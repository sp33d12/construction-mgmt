const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { testConnection, pool } = require('./db/pool');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/warehouse', require('./routes/warehouse'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Serve frontend static files in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

async function start() {
  await testConnection();

  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  await pool.query(schema);

  const { rows } = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (username, password_hash, full_name, full_name_ar, role) VALUES
      ('admin',   $1, 'General Manager', 'المدير العام',       'general_manager'),
      ('pm',      $1, 'Project Manager', 'مدير المشروع',        'project_manager'),
      ('engineer',$1, 'Field Engineer',  'المهندس الميداني',    'field_engineer')
    `, [hash]);
    console.log('Default users created (password: admin123)');
  }

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on port ${PORT}`));
}

start().catch(err => { console.error(err); process.exit(1); });
