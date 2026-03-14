-- Finance ledger table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS finance_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_type VARCHAR(20) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_id UUID,
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Avoid duplicate income entries for the same source
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_ledger_unique_source
  ON finance_ledger(entry_type, source_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_finance_ledger_type ON finance_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_occurred_at ON finance_ledger(occurred_at);
