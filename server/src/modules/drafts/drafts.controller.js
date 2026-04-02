const draftService = require('./drafts.service');
const { saveFile } = require('../../utils/storage');

/**
 * Handles listing drafts.
 */
const listDrafts = async (req, res) => {
  try {
    const data = await draftService.listDrafts(req.user.id, req.user.role);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch drafts.' });
  }
};

/**
 * Handles creating a new draft.
 */
const createDraft = async (req, res) => {
  try {
    let filePath = null;
    if (req.file) {
      const savedFile = await saveFile(req.file.buffer, req.file.originalname);
      filePath = savedFile.filename;
    }

    const data = await draftService.createDraft(req.user.id, req.user.department_id, {
      ...req.body,
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
  try {
    let filePath = undefined; // undefined means don't update column
    if (req.file) {
      const savedFile = await saveFile(req.file.buffer, req.file.originalname);
      filePath = savedFile.filename;
    }

    const data = await draftService.updateDraft(req.params.id, req.user.id, {
      ...req.body,
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
