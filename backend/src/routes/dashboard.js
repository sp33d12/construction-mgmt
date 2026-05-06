const router = require('express').Router();
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [
      projects, projectsByStage,
      fundsReceived, fundsPending,
      salaries, materials,
      contractors, recentActivity, rateRow
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM projects WHERE status='active'"),
      pool.query("SELECT stage, COUNT(*) as count FROM projects WHERE status='active' GROUP BY stage"),

      // Funds received — separate IQD and USD totals
      pool.query(`SELECT
          COALESCE(SUM(amount) FILTER (WHERE currency='IQD' OR currency IS NULL), 0) AS iqd,
          COALESCE(SUM(amount) FILTER (WHERE currency='USD'), 0) AS usd
         FROM incoming_funds WHERE status='received'`),
      pool.query(`SELECT
          COALESCE(SUM(amount) FILTER (WHERE currency='IQD' OR currency IS NULL), 0) AS iqd,
          COALESCE(SUM(amount) FILTER (WHERE currency='USD'), 0) AS usd
         FROM incoming_funds WHERE status='pending'`),

      // Unpaid salaries
      pool.query(`SELECT
          COUNT(*) as count,
          COALESCE(SUM(monthly_salary) FILTER (WHERE currency='IQD' OR currency IS NULL), 0) AS iqd,
          COALESCE(SUM(monthly_salary) FILTER (WHERE currency='USD'), 0) AS usd
         FROM salaries WHERE paid=false`),

      // Materials
      pool.query(`SELECT COUNT(*) as total,
          COUNT(*) FILTER (WHERE quantity <= min_quantity) AS low
         FROM materials`),

      // Pending contractor payments
      pool.query(`SELECT
          COALESCE(SUM(amount) FILTER (WHERE currency='IQD' OR currency IS NULL), 0) AS iqd,
          COALESCE(SUM(amount) FILTER (WHERE currency='USD'), 0) AS usd
         FROM external_contractors WHERE payment_status='pending'`),

      pool.query("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10"),
      pool.query("SELECT value FROM settings WHERE key='usd_to_iqd'"),
    ]);

    res.json({
      activeProjects: parseInt(projects.rows[0].count),
      projectsByStage: projectsByStage.rows,

      funds: {
        receivedIQD: parseFloat(fundsReceived.rows[0].iqd),
        receivedUSD: parseFloat(fundsReceived.rows[0].usd),
        pendingIQD:  parseFloat(fundsPending.rows[0].iqd),
        pendingUSD:  parseFloat(fundsPending.rows[0].usd),
      },

      salaries: {
        unpaidCount: parseInt(salaries.rows[0].count),
        unpaidIQD:   parseFloat(salaries.rows[0].iqd),
        unpaidUSD:   parseFloat(salaries.rows[0].usd),
      },

      contractors: {
        pendingIQD: parseFloat(contractors.rows[0].iqd),
        pendingUSD: parseFloat(contractors.rows[0].usd),
      },

      materials: {
        total:    parseInt(materials.rows[0].total),
        lowStock: parseInt(materials.rows[0].low),
      },

      recentActivity: recentActivity.rows,
      exchangeRate: parseFloat(rateRow.rows[0]?.value || '1310'),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update exchange rate
router.put('/exchange-rate', async (req, res) => {
  const { rate } = req.body;
  if (!rate || isNaN(rate) || rate <= 0) return res.status(400).json({ error: 'Invalid rate' });
  await pool.query(
    "INSERT INTO settings (key,value) VALUES ('usd_to_iqd',$1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [String(rate)]
  );
  res.json({ rate: parseFloat(rate) });
});

module.exports = router;
