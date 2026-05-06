const router = require('express').Router();
const { pool } = require('../db/pool');
const { authenticate, canEdit } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.full_name_ar as engineer_name_ar, u.full_name as engineer_name
      FROM projects p LEFT JOIN users u ON p.engineer_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', canEdit, async (req, res) => {
  const { name_ar, name_en, location, engineer_id, start_date, budget, progress, stage } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO projects (name_ar,name_en,location,engineer_id,start_date,budget,progress,stage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name_ar, name_en, location, engineer_id || null, start_date || null, budget || null, progress || 0, stage || 'planning']
    );
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'create', 'project', rows[0].id, `أضاف مشروع: ${name_ar}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.full_name_ar as engineer_name_ar, u.full_name as engineer_name
      FROM projects p LEFT JOIN users u ON p.engineer_id = u.id
      WHERE p.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const tasks = await pool.query('SELECT * FROM project_tasks WHERE project_id = $1 ORDER BY id', [req.params.id]);
    res.json({ ...rows[0], tasks: tasks.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', canEdit, async (req, res) => {
  const { name_ar, name_en, location, engineer_id, start_date, budget, progress, stage, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE projects SET name_ar=$1,name_en=$2,location=$3,engineer_id=$4,start_date=$5,
       budget=$6,progress=$7,stage=$8,status=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,
      [name_ar, name_en, location, engineer_id || null, start_date || null, budget || null, progress || 0, stage, status || 'active', req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'update', 'project', rows[0].id, `عدّل مشروع: ${name_ar}`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', canEdit, async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING name_ar', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'delete', 'project', req.params.id, `حذف مشروع: ${rows[0].name_ar}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM project_tasks WHERE project_id = $1 ORDER BY id', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/tasks', canEdit, async (req, res) => {
  const { task_name } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO project_tasks (project_id, task_name) VALUES ($1,$2) RETURNING *',
      [req.params.id, task_name]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/tasks/:taskId', canEdit, async (req, res) => {
  const { completed, task_name } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE project_tasks SET completed=$1, task_name=COALESCE($2,task_name) WHERE id=$3 AND project_id=$4 RETURNING *',
      [completed, task_name, req.params.taskId, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/tasks/:taskId', canEdit, async (req, res) => {
  try {
    await pool.query('DELETE FROM project_tasks WHERE id=$1 AND project_id=$2', [req.params.taskId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
