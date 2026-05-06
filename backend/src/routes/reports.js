const router = require('express').Router();
const { pool } = require('../db/pool');
const { authenticate, canEdit } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    let query = `
      SELECT r.*, p.name_ar as project_name, u.full_name_ar as submitter_name
      FROM daily_reports r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.submitted_by = u.id
    `;
    const params = [];
    if (project_id) { query += ' WHERE r.project_id = $1'; params.push(project_id); }
    query += ' ORDER BY r.report_date DESC, r.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', canEdit, async (req, res) => {
  const { project_id, report_date, weather, worker_count, accomplished, tomorrow_plan, lead_worker, signature_data } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO daily_reports (project_id,report_date,weather,worker_count,accomplished,tomorrow_plan,lead_worker,signature_data,submitted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [project_id, report_date, weather, worker_count || null, accomplished, tomorrow_plan, lead_worker, signature_data, req.user.id]
    );
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'create', 'report', rows[0].id, `أضاف تقرير يومي بتاريخ ${report_date}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, p.name_ar as project_name, u.full_name_ar as submitter_name
      FROM daily_reports r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.submitted_by = u.id
      WHERE r.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', canEdit, async (req, res) => {
  const { project_id, report_date, weather, worker_count, accomplished, tomorrow_plan, lead_worker, signature_data } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE daily_reports SET project_id=$1,report_date=$2,weather=$3,worker_count=$4,accomplished=$5,
       tomorrow_plan=$6,lead_worker=$7,signature_data=$8 WHERE id=$9 RETURNING *`,
      [project_id, report_date, weather, worker_count || null, accomplished, tomorrow_plan, lead_worker, signature_data, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'update', 'report', rows[0].id, `عدّل تقرير يومي بتاريخ ${report_date}`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', canEdit, async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM daily_reports WHERE id=$1 RETURNING report_date', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'delete', 'report', req.params.id, `حذف تقرير يومي`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
