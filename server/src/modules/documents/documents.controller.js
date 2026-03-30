const documentService = require('./documents.service');
const { saveFile } = require('../../utils/storage');

/**
 * Handles document creation and dispatch.
 */
const createDocument = async (req, res) => {
  const { subject, body, receiver_department_id } = req.body;
  const workerId = req.user.id;
  const senderDeptId = req.user.department_id;

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
      body,
      file_path: filePath,
      receiver_department_id,
      created_by: workerId,
      sender_department_id: senderDeptId
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
  try {
    const data = await documentService.getInbox(req.user.department_id);
    res.status(200).json({ success: true, data });
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
  try {
    const data = await documentService.getMyDocuments(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch your documents.' });
  }
};

/**
 * Handles system-wide document listing (Super Admin).
 */
const listAllDocuments = async (req, res) => {
  const { department_id, status, assigned_to } = req.query;
  try {
    const data = await documentService.listAllDocuments({ department_id, status, assigned_to });
    res.status(200).json({ success: true, data });
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
    const data = await documentService.getDocumentDetail(id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }
    
    // RBAC: Super Admin can see all, Worker can see if they belong to sender/receiver dept or are assigned/creator.
    if (req.user.role === 'worker') {
      const isSenderDept = data.sender_department_id === req.user.department_id;
      const isReceiverDept = data.receiver_department_id === req.user.department_id;
      const isCreator = data.created_by === req.user.id;
      const isAssignee = data.assigned_to === req.user.id;
      
      if (!isSenderDept && !isReceiverDept && !isCreator && !isAssignee) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this document.' });
      }
    }
    
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch document details.' });
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
  listAllDocuments,
  getDocumentDetail
};
