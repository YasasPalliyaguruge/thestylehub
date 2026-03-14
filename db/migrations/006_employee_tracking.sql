-- Employee attendance and performance tracking
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Link bookings and POS invoices to team members (employees)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES team_members(id);

ALTER TABLE pos_invoices
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES team_members(id);

-- Attendance records
CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES team_members(id),
  attendance_date DATE NOT NULL,
  check_in_at TIMESTAMP WITH TIME ZONE,
  check_out_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_attendance_unique
  ON employee_attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date
  ON employee_attendance(attendance_date);

-- Service/performance logs
CREATE TABLE IF NOT EXISTS employee_service_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES team_members(id),
  source_type VARCHAR(20) NOT NULL,
  source_id UUID,
  service_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_service_logs_employee
  ON employee_service_logs(employee_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_employee_service_logs_source
  ON employee_service_logs(source_type, source_id);

-- Compensation settings (fully customizable)
CREATE TABLE IF NOT EXISTS employee_comp_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID UNIQUE NOT NULL REFERENCES team_members(id),
  base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  bonus_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments (salary, bonus, commission, adjustments)
CREATE TABLE IF NOT EXISTS employee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES team_members(id),
  entry_type VARCHAR(30) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  period_start DATE,
  period_end DATE,
  payment_method VARCHAR(50),
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_payments_employee
  ON employee_payments(employee_id, paid_at);
