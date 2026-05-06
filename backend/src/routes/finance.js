const router = require('express').Router();
const { pool } = require('../db/pool');
const { authenticate, canEdit } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

router.use(authenticate);

// ── Salaries ──────────────────────────────────────────────
router.get('/salaries', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, p.name_ar as project_name FROM salaries s
      LEFT JOIN projects p ON s.project_id = p.id
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/salaries', canEdit, async (req, res) => {
  const { employee_name, role, department, monthly_salary, month_year, project_id, currency } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO salaries (employee_name,role,department,monthly_salary,month_year,project_id,currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [employee_name, role, department, monthly_salary, month_year, project_id || null, currency || 'IQD']
    );
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'create', 'salary', rows[0].id, `أضاف راتب: ${employee_name}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/salaries/:id', canEdit, async (req, res) => {
  const { employee_name, role, department, monthly_salary, month_year, project_id, paid, currency } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE salaries SET employee_name=$1,role=$2,department=$3,monthly_salary=$4,month_year=$5,
       project_id=$6,paid=$7,paid_date=CASE WHEN $7=true AND paid=false THEN NOW() ELSE paid_date END,
       currency=$9
       WHERE id=$8 RETURNING *`,
      [employee_name, role, department, monthly_salary, month_year, project_id || null, paid, req.params.id, currency || 'IQD']
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'update', 'salary', rows[0].id, `عدّل راتب: ${employee_name}`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/salaries/:id', canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM salaries WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Incoming Funds ────────────────────────────────────────
router.get('/funds', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT f.*, p.name_ar as project_name FROM incoming_funds f
      LEFT JOIN projects p ON f.project_id = p.id
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/funds', canEdit, async (req, res) => {
  const { source, amount, fund_date, project_id, status, notes, currency } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO incoming_funds (source,amount,fund_date,project_id,status,notes,currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [source, amount, fund_date || null, project_id || null, status || 'pending', notes, currency || 'IQD']
    );
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'create', 'fund', rows[0].id, `أضاف مبلغ وارد: ${source}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/funds/:id', canEdit, async (req, res) => {
  const { source, amount, fund_date, project_id, status, notes, currency } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE incoming_funds SET source=$1,amount=$2,fund_date=$3,project_id=$4,status=$5,notes=$6,currency=$8 WHERE id=$7 RETURNING *`,
      [source, amount, fund_date || null, project_id || null, status, notes, req.params.id, currency || 'IQD']
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'update', 'fund', rows[0].id, `عدّل مبلغ وارد: ${source}`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/funds/:id', canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM incoming_funds WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── External Contractors ──────────────────────────────────
router.get('/contractors', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, p.name_ar as project_name FROM external_contractors c
      LEFT JOIN projects p ON c.project_id = p.id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/contractors', canEdit, async (req, res) => {
  const { contractor_name, job_description, project_id, amount, payment_status, contract_date, currency } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO external_contractors (contractor_name,job_description,project_id,amount,payment_status,contract_date,currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [contractor_name, job_description, project_id || null, amount, payment_status || 'pending', contract_date || null, currency || 'IQD']
    );
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'create', 'contractor', rows[0].id, `أضاف مقاول: ${contractor_name}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/contractors/:id', canEdit, async (req, res) => {
  const { contractor_name, job_description, project_id, amount, payment_status, contract_date, currency } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE external_contractors SET contractor_name=$1,job_description=$2,project_id=$3,amount=$4,payment_status=$5,contract_date=$6,currency=$8
       WHERE id=$7 RETURNING *`,
      [contractor_name, job_description, project_id || null, amount, payment_status, contract_date || null, req.params.id, currency || 'IQD']
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'update', 'contractor', rows[0].id, `عدّل مقاول: ${contractor_name}`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/contractors/:id', canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM external_contractors WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
