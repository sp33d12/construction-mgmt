const { pool } = require('../db/pool');

async function logActivity(userId, userName, action, entityType, entityId, description) {
  try {
    await pool.query(
      `INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, userName, action, entityType, entityId, description]
    );
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

module.exports = { logActivity };
