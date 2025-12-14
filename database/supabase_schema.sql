-- =====================================================
-- Elderly Data Management System - Supabase Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Tables
-- =====================================================

-- LGUs (Local Government Units)
CREATE TABLE lgu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  province VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Senior Citizens (Main table)
CREATE TABLE senior_citizens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lgu_id UUID NOT NULL REFERENCES lgu(id),
  
  -- Identification
  osca_id VARCHAR(50),
  ncsc_rrn VARCHAR(50),
  last_name VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  ext_name VARCHAR(10),
  date_of_birth DATE NOT NULL,
  sex VARCHAR(10) CHECK (sex IN ('Male', 'Female')),
  
  -- Personal Information
  civil_status VARCHAR(50),
  citizenship VARCHAR(100),
  is_ip BOOLEAN DEFAULT false,
  ip_group VARCHAR(100),
  is_pwd BOOLEAN DEFAULT false,
  pwd_type VARCHAR(100),
  
  -- Address
  house_no_street TEXT,
  subdivision_village VARCHAR(100),
  barangay VARCHAR(100) NOT NULL,
  city_municipality VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10),
  
  -- Contact Information
  contact_no VARCHAR(50),
  email VARCHAR(255),
  philhealth_id VARCHAR(50),
  
  -- Financial Information
  pension_type VARCHAR(50),
  monthly_pension DECIMAL(10, 2),
  
  -- Representative Information
  representative_name VARCHAR(255),
  representative_relationship VARCHAR(100),
  representative_contact VARCHAR(50),
  
  -- Bank Information
  bank_name VARCHAR(255),
  account_name VARCHAR(255),
  account_number VARCHAR(50),
  
  -- System Fields
  sync_status VARCHAR(50) DEFAULT 'DRAFT' CHECK (
    sync_status IN ('DRAFT', 'PENDING_UPLOAD', 'UPLOADED', 'PENDING_REVIEW', 
                   'CLEAN', 'APPROVED', 'DENIED', 'CROSS_LGU_DUPLICATE')
  ),
  sync_version INTEGER DEFAULT 1,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  admin_notes TEXT,
  admin_decision_at TIMESTAMP WITH TIME ZONE,
  export_batch_id VARCHAR(100),
  import_batch_id VARCHAR(100),
  duplicate_of UUID REFERENCES senior_citizens(id),
  is_readonly BOOLEAN DEFAULT false,
  
  -- Payment Information
  payment_status VARCHAR(50),
  payment_date DATE,
  payment_amount DECIMAL(10, 2),
  payment_reference VARCHAR(100),
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES lgu(id),
  updated_by UUID REFERENCES lgu(id)
);

-- Requirements/Documents
CREATE TABLE senior_citizen_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  senior_citizen_id UUID NOT NULL REFERENCES senior_citizens(id) ON DELETE CASCADE,
  requirement_type VARCHAR(50) NOT NULL CHECK (
    requirement_type IN ('ID_CARD', 'BIRTH_CERTIFICATE', 'BARANGAY_CLEARANCE', 
                        'MEDICAL_CERTIFICATE', 'INDIGENCY_CERTIFICATE', 'OTHER')
  ),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  mime_type VARCHAR(100),
  checksum VARCHAR(64),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES lgu(id),
  notes TEXT
);

-- Sync Logs
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id VARCHAR(100) NOT NULL,
  lgu_id UUID NOT NULL REFERENCES lgu(id),
  sync_type VARCHAR(50) NOT NULL CHECK (
    sync_type IN ('EXPORT', 'IMPORT', 'STATUS_UPDATE', 'DATA_SYNC')
  ),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  record_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB
);

-- Duplicate Records Tracking
CREATE TABLE duplicate_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_record_id UUID NOT NULL REFERENCES senior_citizens(id),
  duplicate_record_id UUID NOT NULL REFERENCES senior_citizens(id),
  duplicate_type VARCHAR(50) NOT NULL CHECK (
    duplicate_type IN ('EXACT_NAME_DOB', 'SIMILAR_NAME_DOB', 'SAME_BIRTHDATE_ADDRESS')
  ),
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reviewed_by UUID REFERENCES lgu(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution VARCHAR(50) CHECK (
    resolution IN ('PENDING', 'APPROVED_PRIMARY', 'APPROVED_DUPLICATE', 'BOTH_DENIED')
  ),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(primary_record_id, duplicate_record_id)
);

-- Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES lgu(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- =====================================================
-- Indexes
-- =====================================================

-- Senior Citizens indexes
CREATE INDEX idx_senior_citizens_lgu_id ON senior_citizens(lgu_id);
CREATE INDEX idx_senior_citizens_sync_status ON senior_citizens(sync_status);
CREATE INDEX idx_senior_citizens_name ON senior_citizens(LOWER(last_name), LOWER(first_name));
CREATE INDEX idx_senior_citizens_dob ON senior_citizens(date_of_birth);
CREATE INDEX idx_senior_citizens_batch_id ON senior_citizens(export_batch_id);
CREATE INDEX idx_senior_citizens_import_batch ON senior_citizens(import_batch_id);
CREATE INDEX idx_senior_citizens_duplicate_of ON senior_citizens(duplicate_of);
CREATE INDEX idx_senior_citizens_payment_status ON senior_citizens(payment_status);

-- Composite indexes for duplicate detection
CREATE INDEX idx_senior_citizens_name_dob ON senior_citizens(LOWER(last_name), LOWER(first_name), date_of_birth);
CREATE INDEX idx_senior_citizens_address_dob ON senior_citizens(barangay, city_municipality, date_of_birth);

-- Requirements indexes
CREATE INDEX idx_requirements_senior_id ON senior_citizen_requirements(senior_citizen_id);
CREATE INDEX idx_requirements_type ON senior_citizen_requirements(requirement_type);

-- Sync logs indexes
CREATE INDEX idx_sync_logs_lgu_id ON sync_logs(lgu_id);
CREATE INDEX idx_sync_logs_batch_id ON sync_logs(batch_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);

-- Duplicate records indexes
CREATE INDEX idx_duplicates_primary ON duplicate_records(primary_record_id);
CREATE INDEX idx_duplicates_duplicate ON duplicate_records(duplicate_record_id);
CREATE INDEX idx_duplicates_type ON duplicate_records(duplicate_type);

-- Audit logs indexes
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_logs(changed_at);

-- =====================================================
-- Triggers and Functions
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger
CREATE TRIGGER update_senior_citizens_updated_at
  BEFORE UPDATE ON senior_citizens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lgu_updated_at
  BEFORE UPDATE ON lgu
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), OLD.updated_by);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), NEW.created_by);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger
CREATE TRIGGER audit_senior_citizens_trigger
  AFTER INSERT OR UPDATE OR DELETE ON senior_citizens
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE senior_citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE senior_citizen_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_records ENABLE ROW LEVEL SECURITY;

-- Senior Citizens RLS Policies
CREATE POLICY "LGU users can view their own records" ON senior_citizens
  FOR SELECT USING (auth.uid() = lgu_id);

CREATE POLICY "LGU users can insert their own records" ON senior_citizens
  FOR INSERT WITH CHECK (auth.uid() = lgu_id);

CREATE POLICY "LGU users can update their own records" ON senior_citizens
  FOR UPDATE USING (auth.uid() = lgu_id);

CREATE POLICY "Admin users have full access" ON senior_citizens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lgu 
      WHERE id = senior_citizens.lgu_id 
      AND is_active = true
    )
  );

-- Requirements RLS Policies
CREATE POLICY "Users can view requirements for their records" ON senior_citizen_requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM senior_citizens
      WHERE id = senior_citizen_requirements.senior_citizen_id
      AND lgu_id = auth.uid()
    )
  );

-- Sync Logs RLS Policies
CREATE POLICY "LGU users can view their sync logs" ON sync_logs
  FOR SELECT USING (auth.uid() = lgu_id);

CREATE POLICY "Admin users can view all sync logs" ON sync_logs
  FOR SELECT USING (true);

-- =====================================================
-- Views
-- =====================================================

-- Senior Citizens with LGU info
CREATE VIEW senior_citizens_with_lgu AS
SELECT 
  sc.*,
  lgu.code as lgu_code,
  lgu.name as lgu_name,
  lgu.province as lgu_province,
  lgu.region as lgu_region
FROM senior_citizens sc
JOIN lgu ON sc.lgu_id = lgu.id;

-- Duplicate Records View
CREATE VIEW duplicate_records_view AS
SELECT 
  dr.*,
  primary_rec.last_name as primary_last_name,
  primary_rec.first_name as primary_first_name,
  primary_rec.osca_id as primary_osca_id,
  primary_lgu.name as primary_lgu_name,
  duplicate_rec.last_name as duplicate_last_name,
  duplicate_rec.first_name as duplicate_first_name,
  duplicate_rec.osca_id as duplicate_osca_id,
  duplicate_lgu.name as duplicate_lgu_name
FROM duplicate_records dr
JOIN senior_citizens primary_rec ON dr.primary_record_id = primary_rec.id
JOIN senior_citizens duplicate_rec ON dr.duplicate_record_id = duplicate_rec.id
JOIN lgu primary_lgu ON primary_rec.lgu_id = primary_lgu.id
JOIN lgu duplicate_lgu ON duplicate_rec.lgu_id = duplicate_lgu.id;

-- Sync Statistics View
CREATE VIEW sync_statistics AS
SELECT 
  lgu.id as lgu_id,
  lgu.name as lgu_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN sc.sync_status = 'DRAFT' THEN 1 END) as draft_count,
  COUNT(CASE WHEN sc.sync_status = 'PENDING_UPLOAD' THEN 1 END) as pending_upload_count,
  COUNT(CASE WHEN sc.sync_status = 'UPLOADED' THEN 1 END) as uploaded_count,
  COUNT(CASE WHEN sc.sync_status = 'PENDING_REVIEW' THEN 1 END) as pending_review_count,
  COUNT(CASE WHEN sc.sync_status = 'CLEAN' THEN 1 END) as clean_count,
  COUNT(CASE WHEN sc.sync_status = 'APPROVED' THEN 1 END) as approved_count,
  COUNT(CASE WHEN sc.sync_status = 'DENIED' THEN 1 END) as denied_count,
  COUNT(CASE WHEN sc.sync_status = 'CROSS_LGU_DUPLICATE' THEN 1 END) as duplicate_count,
  COUNT(CASE WHEN sc.payment_status IS NOT NULL THEN 1 END) as with_payment_count,
  MAX(sc.last_synced_at) as last_sync_at
FROM lgu
LEFT JOIN senior_citizens sc ON lgu.id = sc.lgu_id
WHERE lgu.is_active = true
GROUP BY lgu.id, lgu.name;

-- =====================================================
-- Functions for Admin Operations
-- =====================================================

-- Function to find potential duplicates
CREATE OR REPLACE FUNCTION find_potential_duplicates(
  search_last_name VARCHAR,
  search_first_name VARCHAR,
  search_dob DATE,
  exclude_lgu_id UUID
)
RETURNS TABLE (
  record_id UUID,
  lgu_id UUID,
  lgu_name VARCHAR,
  osca_id VARCHAR,
  full_name VARCHAR,
  date_of_birth DATE,
  match_type VARCHAR,
  confidence_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  -- Exact matches
  SELECT 
    sc.id,
    sc.lgu_id,
    lgu.name,
    sc.osca_id,
    sc.last_name || ', ' || sc.first_name || ' ' || COALESCE(sc.middle_name, '') as full_name,
    sc.date_of_birth,
    'EXACT_MATCH'::VARCHAR as match_type,
    1.0::DECIMAL as confidence_score
  FROM senior_citizens sc
  JOIN lgu ON sc.lgu_id = lgu.id
  WHERE LOWER(sc.last_name) = LOWER(search_last_name)
  AND LOWER(sc.first_name) = LOWER(search_first_name)
  AND sc.date_of_birth = search_dob
  AND sc.lgu_id != exclude_lgu_id
  
  UNION ALL
  
  -- Similar names (simple implementation)
  SELECT 
    sc.id,
    sc.lgu_id,
    lgu.name,
    sc.osca_id,
    sc.last_name || ', ' || sc.first_name || ' ' || COALESCE(sc.middle_name, '') as full_name,
    sc.date_of_birth,
    'SIMILAR_MATCH'::VARCHAR as match_type,
    0.7::DECIMAL as confidence_score
  FROM senior_citizens sc
  JOIN lgu ON sc.lgu_id = lgu.id
  WHERE sc.date_of_birth = search_dob
  AND sc.lgu_id != exclude_lgu_id
  AND (
    LOWER(sc.last_name) LIKE '%' || LOWER(search_last_name) || '%' OR
    LOWER(sc.first_name) LIKE '%' || LOWER(search_first_name) || '%'
  )
  AND NOT (
    LOWER(sc.last_name) = LOWER(search_last_name) AND
    LOWER(sc.first_name) = LOWER(search_first_name)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to generate status updates for LGU
CREATE OR REPLACE FUNCTION generate_status_updates(
  target_lgu_id UUID,
  include_approved BOOLEAN DEFAULT true,
  include_denied BOOLEAN DEFAULT true,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  record_id UUID,
  osca_id VARCHAR,
  full_name VARCHAR,
  status VARCHAR,
  admin_notes TEXT,
  decision_at TIMESTAMP WITH TIME ZONE,
  payment_status VARCHAR,
  payment_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.osca_id,
    sc.last_name || ', ' || sc.first_name || ' ' || COALESCE(sc.middle_name, '') as full_name,
    sc.sync_status as status,
    sc.admin_notes,
    sc.admin_decision_at as decision_at,
    sc.payment_status,
    sc.payment_date
  FROM senior_citizens sc
  WHERE sc.lgu_id = target_lgu_id
  AND sc.sync_status IN (
    CASE WHEN include_approved THEN 'APPROVED' ELSE NULL END,
    CASE WHEN include_denied THEN 'DENIED' ELSE NULL END
  )
  AND sc.import_batch_id IS NULL
  AND (date_from IS NULL OR sc.admin_decision_at >= date_from)
  AND (date_to IS NULL OR sc.admin_decision_at <= date_to)
  ORDER BY sc.admin_decision_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Initial Data
-- =====================================================

-- Insert default LGUs (sample data)
INSERT INTO lgu (code, name, province, region) VALUES
('LGU-001', 'City Government of Sample City', 'Sample Province', 'Region I'),
('LGU-002', 'Municipality of Sample Town', 'Sample Province', 'Region I'),
('LGU-003', 'City Government of Test City', 'Test Province', 'Region II');

-- =====================================================
-- Storage Buckets (for Supabase Storage)
-- =====================================================

-- These would be created via Supabase Dashboard or API:
-- 1. senior-citizen-photos/ - Profile photos
-- 2. requirements/ - Uploaded documents
-- 3. exports/ - Generated export files
-- 4. backups/ - Database backups

-- =====================================================
-- Notes for Implementation
-- =====================================================

-- 1. The lgu_id field should store the UUID from the authentication system
-- 2. All timestamps should use TIMESTAMP WITH TIME ZONE
-- 3. File storage should use Supabase Storage with proper RLS policies
-- 4. API keys should be properly managed through Supabase auth
-- 5. Consider adding database functions for complex duplicate detection
-- 6. Implement proper backup strategy for the online database
-- 7. Consider adding full-text search indexes for better name matching
