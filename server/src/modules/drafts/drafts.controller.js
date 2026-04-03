const draftService = require('./drafts.service');
const { saveFile } = require('../../utils/storage');

/**
 * Handles listing drafts.
 */
const listDrafts = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const data = await draftService.listDrafts(
      req.user.id, 
      req.user.role,
      parseInt(page),
      parseInt(limit)
    );
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch drafts.' });
  }
};


/**
 * Handles creating a new draft.
 */
const createDraft = async (req, res) => {
  const { 
    subject, body_html, receiver_department_id, 
    cc, bcc, references, is_restricted, restricted_to_user_id,
    behalf_of_officer_id, behalf_of_position_id
  } = req.body;

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

  try {
    let filePath = null;
    if (req.file) {
      const savedFile = await saveFile(req.file.buffer, req.file.originalname);
      filePath = savedFile.filename;
    }

    const data = await draftService.createDraft(req.user.id, req.user.department_id, {
      subject,
      body_html,
      receiver_department_id,
      cc: parseArray(cc),
      bcc: parseArray(bcc),
      references: parseArray(references),
      is_restricted: is_restricted === 'true' || is_restricted === true,
      restricted_to_user_id: restricted_to_user_id === 'null' ? null : (restricted_to_user_id || null),
      behalf_of_officer_id,
      behalf_of_position_id,
      file_path: filePath
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create draft.' });
  }
};

/**
 * Handles updating a draft.
 */
const updateDraft = async (req, res) => {
  const { 
    subject, body_html, receiver_department_id, 
    cc, bcc, references, is_restricted, restricted_to_user_id,
    draft_revision_note, behalf_of_position_id
  } = req.body;

  // Helper to parse potential JSON string arrays from FormData
  const parseArray = (field) => {
    if (field === undefined) return undefined;
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch (e) {
      return [field];
    }
  };

  try {
    let filePath = undefined; // undefined means don't update column
    if (req.file) {
      const savedFile = await saveFile(req.file.buffer, req.file.originalname);
      filePath = savedFile.filename;
    }

    const data = await draftService.updateDraft(req.params.id, req.user.id, {
      subject,
      body_html,
      receiver_department_id,
      cc: parseArray(cc),
      bcc: parseArray(bcc),
      references: parseArray(references),
      is_restricted: is_restricted === undefined ? undefined : (is_restricted === 'true' || is_restricted === true),
      restricted_to_user_id: restricted_to_user_id === 'null' ? null : (restricted_to_user_id || undefined),
      draft_revision_note,
      behalf_of_position_id,
      file_path: filePath
    }, req.user.role);
    
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update draft.' });
  }
};

/**
 * Handles submitting a draft to an officer.
 */
const submitDraft = async (req, res) => {
  try {
    const data = await draftService.submitDraft(req.params.id, req.user.id);
    res.status(200).json({ success: true, data, message: 'Draft submitted to officer for review.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to submit draft.' });
  }
};

/**
 * Handles officer approval of a draft.
 */
const approveDraft = async (req, res) => {
  try {
    const data = await draftService.approveDraft(req.params.id, req.user.id);
    res.status(200).json({ success: true, data, message: 'Draft approved and dispatched.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to approve draft.' });
  }
};

/**
 * Handles officer revision request.
 */
const reviseDraft = async (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ success: false, error: 'Revision note is required.' });

  try {
    const data = await draftService.reviseDraft(req.params.id, req.user.id, note);
    res.status(200).json({ success: true, data, message: 'Draft returned for revision.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to send for revision.' });
  }
};

/**
 * Handles deleting a draft.
 */
const deleteDraft = async (req, res) => {
  try {
    await draftService.deleteDraft(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Draft deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete draft.' });
  }
};

module.exports = {
  listDrafts,
  createDraft,
  updateDraft,
  submitDraft,
  approveDraft,
  reviseDraft,
  deleteDraft
};
