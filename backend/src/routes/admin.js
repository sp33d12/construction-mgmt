const router = require('express').Router();
const { pool } = require('../db/pool');
const { authenticate, canEdit } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

router.use(authenticate);

// ── Outgoing Letters ──────────────────────────────────────
router.get('/outgoing', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, p.name_ar as project_name FROM outgoing_letters o
      LEFT JOIN projects p ON o.project_id = p.id ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/outgoing', canEdit, async (req, res) => {
  const { reference_number, letter_date, recipient, subject, project_id, file_data, file_name, file_type } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO outgoing_letters (reference_number,letter_date,recipient,subject,project_id,file_data,file_name,file_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [reference_number, letter_date||null, recipient, subject, project_id||null, file_data||null, file_name||null, file_type||null]
    );
    await logActivity(req.user.id, req.user.fullName||req.user.username, 'create', 'outgoing_letter', rows[0].id, `أضاف كتاب صادر إلى: ${recipient}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/outgoing/:id', canEdit, async (req, res) => {
  const { reference_number, letter_date, recipient, subject, project_id, file_data, file_name, file_type } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE outgoing_letters SET reference_number=$1,letter_date=$2,recipient=$3,subject=$4,project_id=$5,
       file_data=COALESCE($6,file_data), file_name=COALESCE($7,file_name), file_type=COALESCE($8,file_type)
       WHERE id=$9 RETURNING *`,
      [reference_number, letter_date||null, recipient, subject, project_id||null, file_data||null, file_name||null, file_type||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName||req.user.username, 'update', 'outgoing_letter', rows[0].id, `عدّل كتاب صادر`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/outgoing/:id', canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM outgoing_letters WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Incoming Letters ──────────────────────────────────────
router.get('/incoming', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.*, p.name_ar as project_name FROM incoming_letters i
      LEFT JOIN projects p ON i.project_id = p.id ORDER BY i.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/incoming', canEdit, async (req, res) => {
  const { reference_number, letter_date, sender, subject, project_id, file_data, file_name, file_type } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO incoming_letters (reference_number,letter_date,sender,subject,project_id,file_data,file_name,file_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [reference_number, letter_date||null, sender, subject, project_id||null, file_data||null, file_name||null, file_type||null]
    );
    await logActivity(req.user.id, req.user.fullName||req.user.username, 'create', 'incoming_letter', rows[0].id, `أضاف كتاب وارد من: ${sender}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/incoming/:id', canEdit, async (req, res) => {
  const { reference_number, letter_date, sender, subject, project_id, file_data, file_name, file_type } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE incoming_letters SET reference_number=$1,letter_date=$2,sender=$3,subject=$4,project_id=$5,
       file_data=COALESCE($6,file_data), file_name=COALESCE($7,file_name), file_type=COALESCE($8,file_type)
       WHERE id=$9 RETURNING *`,
      [reference_number, letter_date||null, sender, subject, project_id||null, file_data||null, file_name||null, file_type||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName||req.user.username, 'update', 'incoming_letter', rows[0].id, `عدّل كتاب وارد`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/incoming/:id', canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM incoming_letters WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Administrative Orders ─────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, p.name_ar as project_name FROM admin_orders o
      LEFT JOIN projects p ON o.project_id = p.id ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/orders', canEdit, async (req, res) => {
  const { order_number, order_date, subject, issued_to, project_id, file_data, file_name, file_type } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO admin_orders (order_number,order_date,subject,issued_to,project_id,file_data,file_name,file_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [order_number, order_date||null, subject, issued_to, project_id||null, file_data||null, file_name||null, file_type||null]
    );
    await logActivity(req.user.id, req.user.fullName||req.user.username, 'create', 'admin_order', rows[0].id, `أضاف أمر إداري: ${subject}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/orders/:id', canEdit, async (req, res) => {
  const { order_number, order_date, subject, issued_to, project_id, file_data, file_name, file_type } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE admin_orders SET order_number=$1,order_date=$2,subject=$3,issued_to=$4,project_id=$5,
       file_data=COALESCE($6,file_data), file_name=COALESCE($7,file_name), file_type=COALESCE($8,file_type)
       WHERE id=$9 RETURNING *`,
      [order_number, order_date||null, subject, issued_to, project_id||null, file_data||null, file_name||null, file_type||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName||req.user.username, 'update', 'admin_order', rows[0].id, `عدّل أمر إداري`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/orders/:id', canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM admin_orders WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
