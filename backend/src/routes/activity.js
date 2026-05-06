const router = require('express').Router();
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
