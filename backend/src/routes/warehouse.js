const router = require('express').Router();
const { pool } = require('../db/pool');
const { authenticate, canEdit } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, p.name_ar as project_name,
             (m.quantity <= m.min_quantity) as low_stock
      FROM materials m
      LEFT JOIN projects p ON m.project_id = p.id
      ORDER BY m.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', canEdit, async (req, res) => {
  const { material_name, unit, quantity, min_quantity, unit_price, project_id } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO materials (material_name,unit,quantity,min_quantity,unit_price,project_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [material_name, unit, quantity || 0, min_quantity || 0, unit_price || null, project_id || null]
    );
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'create', 'material', rows[0].id, `أضاف مادة: ${material_name}`);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', canEdit, async (req, res) => {
  const { material_name, unit, quantity, min_quantity, unit_price, project_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE materials SET material_name=$1,unit=$2,quantity=$3,min_quantity=$4,unit_price=$5,project_id=$6,updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [material_name, unit, quantity || 0, min_quantity || 0, unit_price || null, project_id || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'update', 'material', rows[0].id, `عدّل مادة: ${material_name}`);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', canEdit, async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM materials WHERE id=$1 RETURNING material_name', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user.id, req.user.fullName || req.user.username, 'delete', 'material', req.params.id, `حذف مادة: ${rows[0].material_name}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
