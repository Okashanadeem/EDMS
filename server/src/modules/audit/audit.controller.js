const auditService = require('./audit.service');

/**
 * Handles fetching audit logs.
 */
const listLogs = async (req, res) => {
  const { entity_id, actor_id, action, from, to, page = 1, limit = 50 } = req.query;
  try {
    const data = await auditService.listLogs({ 
      entity_id, 
      actor_id, 
      action, 
      from, 
      to,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
};


module.exports = {
  listLogs
};
