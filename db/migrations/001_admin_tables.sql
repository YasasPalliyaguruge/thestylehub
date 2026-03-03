-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration VARCHAR(50),
  icon VARCHAR(50),
  category VARCHAR(50) NOT NULL,
  popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  specialties JSONB,
  image_url VARCHAR(500),
  bio TEXT,
  experience_years INTEGER,
  rating DECIMAL(2, 1),
  client_count INTEGER,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  before_image_url VARCHAR(500) NOT NULL,
  after_image_url VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  stylist_id UUID REFERENCES team_members(id),
  client_name VARCHAR(255),
  description TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name VARCHAR(255) NOT NULL,
  service VARCHAR(255),
  text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  image_url VARCHAR(500),
  date DATE,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pricing packages table
CREATE TABLE IF NOT EXISTS pricing_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  gender VARCHAR(10) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  services JSONB NOT NULL,
  popular BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Business information table (singleton - should only have one row)
CREATE TABLE IF NOT EXISTS business_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_name VARCHAR(255) NOT NULL DEFAULT 'The Style Hub',
  tagline TEXT,
  description TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  hours JSONB,
  social_links JSONB
);

-- Hero content table (singleton - should only have one row)
CREATE TABLE IF NOT EXISTS hero_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  headline VARCHAR(255) NOT NULL,
  subheadline TEXT,
  badge_text VARCHAR(255),
  primary_cta_text VARCHAR(100),
  primary_cta_link VARCHAR(255),
  secondary_cta_text VARCHAR(100),
  secondary_cta_link VARCHAR(255),
  background_image_url VARCHAR(500),
  active BOOLEAN DEFAULT true
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_active ON portfolio_items(active);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(active);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(featured);
CREATE INDEX IF NOT EXISTS idx_pricing_packages_gender ON pricing_packages(gender);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at);

-- Insert default admin user (password: admin123 - CHANGE THIS AFTER FIRST LOGIN!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (email, password_hash, name, role)
VALUES ('admin@stylehub.com', '$2a$10$YourHashedPasswordHere', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default business info
INSERT INTO business_info (salon_name, tagline, description, address, phone, email, hours, social_links)
VALUES (
  'The Style Hub',
  'Premium Unisex Salon Experience',
  'Award-winning luxury salon experience. Expert stylists, premium services, and an atmosphere of elegance.',
  '123 Fashion Street, Style City, SC 12345',
  '+1 (555) 123-4567',
  'info@stylehub.com',
  '{
    "monday": {"open": "09:00", "close": "20:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "20:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "20:00", "closed": false},
    "thursday": {"open": "09:00", "close": "20:00", "closed": false},
    "friday": {"open": "09:00", "close": "21:00", "closed": false},
    "saturday": {"open": "08:00", "close": "19:00", "closed": false},
    "sunday": {"open": null, "close": null, "closed": true}
  }'::jsonb,
  '{
    "instagram": "https://instagram.com/stylehub",
    "facebook": "https://facebook.com/stylehub",
    "twitter": "https://twitter.com/stylehub"
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert default hero content
INSERT INTO hero_content (headline, subheadline, badge_text, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, active)
VALUES (
  'Experience Luxury Styling',
  'Where artistry meets elegance. Transform your look with our award-winning stylists.',
  'Now Open',
  'Book Appointment',
  '#booking',
  'View Services',
  '#services',
  true
)
ON CONFLICT DO NOTHING;
