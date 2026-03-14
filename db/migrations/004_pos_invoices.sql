-- POS invoices table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sequence for invoice numbering
CREATE SEQUENCE IF NOT EXISTS pos_invoice_seq;

CREATE TABLE IF NOT EXISTS pos_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL DEFAULT (
    'INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('pos_invoice_seq')::text, 4, '0')
  ),
  booking_id UUID REFERENCES bookings(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pos_invoices_booking_id ON pos_invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_status ON pos_invoices(status);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_created_at ON pos_invoices(created_at);
