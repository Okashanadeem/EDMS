const db = require('../config/db');

/**
 * Reusable helper to write an audit log entry.
 * @param {object} params
 * @param {number} params.actorId - User ID who performed the action.
 * @param {string} params.action - Action key (e.g., 'document.created').
 * @param {string} params.entityType - Type of entity (e.g., 'document').
 * @param {number} [params.entityId] - ID of the entity.
 * @param {object} [params.metadata] - Contextual JSON snapshot.
 * @param {object} [params.client] - Optional pg transaction client.
 */
const auditLog = async ({ actorId, action, entityType, entityId, metadata, client }) => {
  const pgClient = client || db;

  // 1. Fetch current position of the actor for point-in-time record
  const userRes = await pgClient.query('SELECT position_id FROM users WHERE id = $1', [actorId]);
  const positionId = userRes.rows[0]?.position_id || null;

  const query = `
    INSERT INTO audit_logs (actor_id, position_id, action, entity_type, entity_id, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const params = [actorId, positionId, action, entityType, entityId, metadata];
  
  const result = await pgClient.query(query, params);
  
  return result.rows[0];
};


module.exports = {
  auditLog
};
