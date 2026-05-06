CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  full_name_ar VARCHAR(100),
  role VARCHAR(30) NOT NULL CHECK (role IN ('general_manager','project_manager','field_engineer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  engineer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE,
  budget DECIMAL(15,2),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  stage VARCHAR(30) DEFAULT 'planning' CHECK (stage IN ('planning','foundation','structure','finishing','handover')),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  task_name VARCHAR(500) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  weather VARCHAR(50),
  worker_count INTEGER,
  accomplished TEXT,
  tomorrow_plan TEXT,
  lead_worker VARCHAR(100),
  signature_data TEXT,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salaries (
  id SERIAL PRIMARY KEY,
  employee_name VARCHAR(150) NOT NULL,
  role VARCHAR(100),
  department VARCHAR(100),
  monthly_salary DECIMAL(12,2),
  month_year VARCHAR(7),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incoming_funds (
  id SERIAL PRIMARY KEY,
  source VARCHAR(200) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  fund_date DATE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('received','pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_contractors (
  id SERIAL PRIMARY KEY,
  contractor_name VARCHAR(200) NOT NULL,
  job_description VARCHAR(500),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  amount DECIMAL(12,2),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid','pending')),
  contract_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  material_name VARCHAR(200) NOT NULL,
  unit VARCHAR(50),
  quantity DECIMAL(12,2) DEFAULT 0,
  min_quantity DECIMAL(12,2) DEFAULT 0,
  unit_price DECIMAL(12,2),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outgoing_letters (
  id SERIAL PRIMARY KEY,
  reference_number VARCHAR(50),
  letter_date DATE,
  recipient VARCHAR(200),
  subject TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incoming_letters (
  id SERIAL PRIMARY KEY,
  reference_number VARCHAR(50),
  letter_date DATE,
  sender VARCHAR(200),
  subject TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50),
  order_date DATE,
  subject TEXT,
  issued_to VARCHAR(200),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(100),
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (key-value store for app config)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO settings (key, value) VALUES ('usd_to_iqd', '1310') ON CONFLICT (key) DO NOTHING;

-- Currency columns for financial tables (safe to run multiple times)
ALTER TABLE salaries            ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'IQD';
ALTER TABLE incoming_funds      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'IQD';
ALTER TABLE external_contractors ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'IQD';
