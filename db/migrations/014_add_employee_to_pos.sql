-- Add employee_id to pos_invoices
ALTER TABLE pos_invoices 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES team_members(id);

CREATE INDEX IF NOT EXISTS idx_pos_invoices_employee_id ON pos_invoices(employee_id);
