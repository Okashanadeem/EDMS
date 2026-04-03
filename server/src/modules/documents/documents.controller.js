const path = require('path');
const fs = require('fs');
const documentService = require('./documents.service');
const { saveFile } = require('../../utils/storage');
const db = require('../../config/db');

/**
 * Handles document creation and dispatch.
 */
const createDocument = async (req, res) => {
  const { 
    subject, body_html, body, receiver_department_id, 
    cc, bcc, references, is_restricted, restricted_to_user_id 
  } = req.body;
  const workerId = req.user.id;
  const senderDeptId = req.user.department_id;

  // Helper to parse potential JSON string arrays from FormData
  const parseArray = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch (e) {
      return [field];
    }
  };

  if (!subject || !receiver_department_id) {
    return res.status(400).json({ success: false, error: 'Subject and receiver department are required.' });
  }

  try {
    let filePath = null;
    if (req.file) {
      const savedFile = await saveFile(req.file.buffer, req.file.originalname);
      filePath = savedFile.filename;
    }

    const data = await documentService.createDocument({
      subject,
      body_html,
      body,
      file_path: filePath,
      receiver_department_id,
      created_by: workerId,
      sender_department_id: senderDeptId,
      cc: parseArray(cc),
      bcc: parseArray(bcc),
      references: parseArray(references),
      is_restricted: is_restricted === 'true' || is_restricted === true,
      restricted_to_user_id: restricted_to_user_id === 'null' ? null : (restricted_to_user_id || null)
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create document.' });
  }
};

/**
 * Handles fetching department inbox.
 */
const getInbox = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const data = await documentService.getInbox(
      req.user.department_id, 
      req.user.id, 
      req.user.role,
      parseInt(page),
      parseInt(limit)
    );
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inbox.' });
  }
};


/**
 * Handles document pickup from inbox.
 */
const pickupDocument = async (req, res) => {
  const { id } = req.params;
  const workerId = req.user.id;
  const departmentId = req.user.department_id;

  try {
    const data = await documentService.pickupDocument(id, workerId, departmentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.message === 'CONFLICT') {
      return res.status(409).json({ success: false, error: 'Document already picked up or not available.' });
    }
    res.status(500).json({ success: false, error: 'Failed to pick up document.' });
  }
};

/**
 * Handles marking a document as in_progress.
 */
const startProcessing = async (req, res) => {
  const { id } = req.params;
  const workerId = req.user.id;

  try {
    const data = await documentService.startProcessing(id, workerId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.message === 'NOT_AUTHORIZED_OR_NOT_FOUND') {
      return res.status(403).json({ success: false, error: 'Not authorized to process this document.' });
    }
    res.status(500).json({ success: false, error: 'Failed to start processing.' });
  }
};

/**
 * Handles marking a document as completed.
 */
const completeDocument = async (req, res) => {
  const { id } = req.params;
  const workerId = req.user.id;

  try {
    const data = await documentService.completeDocument(id, workerId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.message === 'NOT_AUTHORIZED_OR_NOT_FOUND') {
      return res.status(403).json({ success: false, error: 'Not authorized to complete this document.' });
    }
    res.status(500).json({ success: false, error: 'Failed to complete document.' });
  }
};

/**
 * Handles forwarding a document.
 */
const forwardDocument = async (req, res) => {
  const { id } = req.params;
  const { to_department_id, note } = req.body;
  const workerId = req.user.id;

  if (!to_department_id) {
    return res.status(400).json({ success: false, error: 'Target department is required.' });
  }

  try {
    const data = await documentService.forwardDocument(id, workerId, { to_department_id, note });
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.message === 'NOT_AUTHORIZED_OR_NOT_FOUND') {
      return res.status(403).json({ success: false, error: 'Not authorized to forward this document.' });
    }
    res.status(500).json({ success: false, error: 'Failed to forward document.' });
  }
};

/**
 * Handles fetching documents assigned to or created by a worker.
 */
const getMyDocuments = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const data = await documentService.getMyDocuments(
      req.user.id, 
      req.user.department_id, 
      req.user.role,
      parseInt(page),
      parseInt(limit)
    );
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch your documents.' });
  }
};


/**
 * Handles system-wide document listing (Super Admin).
 */
const listAllDocuments = async (req, res) => {
  const { department_id, status, assigned_to, q, page = 1, limit = 10 } = req.query;
  try {
    const data = await documentService.listAllDocuments(
      { department_id, status, assigned_to, q, page: parseInt(page), limit: parseInt(limit) },
      req.user.id,
      req.user.role
    );
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch documents.' });
  }
};


/**
 * Handles fetching document detail.
 */
const getDocumentDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await documentService.getDocumentDetail(
      id, 
      req.user.id, 
      req.user.role, 
      req.user.department_id
    );
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }
    
    // Authorization check (additional to server-side redaction)
    if (req.user.role !== 'super_admin') {
      const isSenderDept = data.sender_department_id === req.user.department_id;
      const isReceiverDept = data.receiver_department_id === req.user.department_id;
      const isCreator = data.created_by === req.user.id;
      const isAssignee = data.assigned_to === req.user.id;
      const isCCd = data.cc && data.cc.some(r => r.department_id === req.user.department_id);
      const isBCCd = data.bcc && data.bcc.some(r => r.department_id === req.user.department_id);
      
      if (!isSenderDept && !isReceiverDept && !isCreator && !isAssignee && !isCCd && !isBCCd) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this document.' });
      }

      // Add POV-aware display name for the UI label
      if (data.file_path) {
        const ext = path.extname(data.file_path);
        let povName = data.file_path; // Default
        
        if (isSenderDept) povName = data.outward_number || 'OUTWARD';
        else if (isReceiverDept) povName = data.inward_number || data.outward_number || 'INWARD';
        else if (isCCd || isBCCd) {
           // We need the recipient inward number from the DB for detail view too
           const drQuery = 'SELECT inward_number FROM document_recipients WHERE document_id = $1 AND department_id = $2';
           const drRes = await db.query(drQuery, [id, req.user.department_id]);
           povName = drRes.rows[0]?.inward_number || data.outward_number || 'INWARD';
        }
        data.display_filename = povName.replace(/\//g, '_') + ext;
      }
    } else if (data.file_path) {
      // Super Admin sees outward number as name
      data.display_filename = (data.outward_number || 'DOCUMENT').replace(/\//g, '_') + path.extname(data.file_path);
    }
    
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch document details.' });
  }
};

/**
 * Handles fetching all documents related to a department.
 */
const getDepartmentHistory = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const data = await documentService.getDepartmentHistory(
      req.user.department_id, 
      req.user.id, 
      req.user.role,
      parseInt(page),
      parseInt(limit)
    );
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch department history.' });
  }
};

/**
 * Serves a document attachment with dynamic POV-based naming.
 */
const downloadAttachment = async (req, res) => {
  const { id } = req.params;
  const { id: userId, department_id: userDeptId, role } = req.user;

  try {
    // 1. Fetch document and recipient info
    const docQuery = `
      SELECT d.*, dr.inward_number as recipient_inward_number, dr.recipient_type
      FROM documents d
      LEFT JOIN document_recipients dr ON d.id = dr.document_id AND dr.department_id = $2
      WHERE d.id = $1
    `;
    const docResult = await db.query(docQuery, [id, userDeptId]);
    const document = docResult.rows[0];

    if (!document || !document.file_path) {
      return res.status(404).json({ success: false, error: 'Attachment not found.' });
    }

    // 2. Authorization Check
    const isSenderDept = document.sender_department_id === userDeptId;
    const isReceiverDept = document.receiver_department_id === userDeptId;
    const isCCBCC = !!document.recipient_type;
    const isCreator = document.created_by === userId;

    if (role !== 'super_admin' && !isSenderDept && !isReceiverDept && !isCCBCC && !isCreator) {
      return res.status(403).json({ success: false, error: 'Unauthorized to download this attachment.' });
    }

    // 3. Determine Dynamic Filename
    let downloadName = document.file_path; // Default
    const extension = path.extname(document.file_path);

    if (isSenderDept) {
      // Senders see the Outward Number
      downloadName = document.outward_number || 'OUTWARD';
    } else if (isReceiverDept) {
      // Primary Receivers see their Inward Number
      downloadName = document.inward_number || document.outward_number || 'INWARD';
    } else if (isCCBCC) {
      // CC/BCC recipients see their specific Inward Number
      downloadName = document.recipient_inward_number || document.outward_number || 'INWARD';
    }

    // Sanitize filename
    downloadName = downloadName.replace(/\//g, '_') + extension;

    // 4. Serve File
    // Resolve absolute path: server/src/modules/documents -> server/uploads
    const filePath = path.join(__dirname, '../../../uploads', document.file_path);

    if (!fs.existsSync(filePath)) {
      console.error('File not found at:', filePath);
      return res.status(404).json({ success: false, error: 'Physical file missing from server.' });
    }

    res.download(filePath, downloadName);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: 'Failed to download attachment.' });
  }
};


const { generateOfficialPdf } = require('../../utils/pdfGenerator');

/**
 * Handles downloading the document as a professional PDF.
 * POV-aware (Inward vs Outward number and naming).
 */
const downloadDocumentPdf = async (req, res) => {
  const { id } = req.params;
  const actor = req.user;

  try {
    const doc = await documentService.getDocumentDetail(id, actor);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found.' });

    // 1. Determine POV Number
    let currentPovNumber = doc.outward_number;
    let displayName = doc.outward_number || `doc-${id}`;
    
    if (actor.department_id === doc.receiver_department_id) {
      currentPovNumber = doc.inward_number;
      displayName = doc.inward_number || doc.outward_number || `doc-${id}`;
    } else {
      // Check CC/BCC
      const recipient = doc.recipients?.find(r => r.department_id === actor.department_id);
      if (recipient) {
        currentPovNumber = recipient.inward_number;
        displayName = recipient.inward_number || doc.outward_number || `doc-${id}`;
      }
    }

    // 2. Prepare PDF Options
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let signatureUrl = null;
    
    // We prefer the officer's signature if it was a delegated send
    if (doc.officer_signature_path) {
      signatureUrl = `${baseUrl}/uploads/${doc.officer_signature_path}`;
    } else if (doc.creator_signature_path) {
      signatureUrl = `${baseUrl}/uploads/${doc.creator_signature_path}`;
    }

    const pdfOptions = {
      baseUrl,
      signatureUrl,
      senderDept: doc.sender_department_name,
      receiverDept: doc.receiver_department_name,
      senderName: doc.officer_name || doc.creator_name,
      senderPosition: doc.officer_position_title || doc.creator_role,
      currentPovNumber
    };

    const pdfBuffer = await generateOfficialPdf(doc, pdfOptions);

    const safeFilename = displayName.replace(/\//g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Download Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate PDF.' });
  }
};


module.exports = {
  createDocument,
  getInbox,
  pickupDocument,
  startProcessing,
  completeDocument,
  forwardDocument,
  getMyDocuments,
  getDepartmentHistory,
  listAllDocuments,
  getDocumentDetail,
  downloadAttachment,
  downloadDocumentPdf
};
