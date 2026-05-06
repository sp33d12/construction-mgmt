const router = require('express').Router();
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// Return all users (for engineer dropdown etc.)
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, full_name, full_name_ar, role FROM users ORDER BY full_name_ar'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
