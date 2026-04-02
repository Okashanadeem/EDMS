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
  const query = `
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const params = [actorId, action, entityType, entityId, metadata];
  
  const pgClient = client || db;
  const result = await pgClient.query(query, params);
  
  return result.rows[0];
};

module.exports = {
  auditLog
};
