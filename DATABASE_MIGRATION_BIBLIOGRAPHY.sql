-- Bibliography System Database Migration
-- Run this SQL to add bibliography tables to your database

-- ============================================
-- Table: bibliography_references
-- Stores all reference/citation entries
-- ============================================
CREATE TABLE IF NOT EXISTS bibliography_references (
  id VARCHAR(255) PRIMARY KEY,
  book_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  authors JSONB NOT NULL,
  year INTEGER,
  publisher TEXT,
  url TEXT,
  doi TEXT,
  access_date VARCHAR(50),
  type_specific_data JSONB,
  notes TEXT,
  tags JSONB,
  citation_key VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES generated_books(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bibliography_references_book_id 
  ON bibliography_references(book_id);
CREATE INDEX IF NOT EXISTS idx_bibliography_references_type 
  ON bibliography_references(type);
CREATE INDEX IF NOT EXISTS idx_bibliography_references_citation_key 
  ON bibliography_references(citation_key);

-- ============================================
-- Table: citations
-- Tracks in-text citations
-- ============================================
CREATE TABLE IF NOT EXISTS citations (
  id VARCHAR(255) PRIMARY KEY,
  reference_id VARCHAR(255) NOT NULL,
  book_id INTEGER NOT NULL,
  chapter_id INTEGER,
  position INTEGER NOT NULL,
  page_number VARCHAR(50),
  paragraph TEXT,
  quotation TEXT,
  prefix VARCHAR(100),
  suffix TEXT,
  suppress_author BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reference_id) REFERENCES bibliography_references(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES generated_books(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES book_chapters(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_citations_reference_id 
  ON citations(reference_id);
CREATE INDEX IF NOT EXISTS idx_citations_book_id 
  ON citations(book_id);
CREATE INDEX IF NOT EXISTS idx_citations_chapter_id 
  ON citations(chapter_id);

-- ============================================
-- Table: bibliography_configs
-- Per-book bibliography configuration
-- ============================================
CREATE TABLE IF NOT EXISTS bibliography_configs (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT FALSE,
  citation_style VARCHAR(50) DEFAULT 'APA',
  location JSONB DEFAULT '["bibliography"]',
  sort_by VARCHAR(50) DEFAULT 'author',
  sort_direction VARCHAR(10) DEFAULT 'asc',
  include_annotations BOOLEAN DEFAULT FALSE,
  include_abstracts BOOLEAN DEFAULT FALSE,
  hanging_indent BOOLEAN DEFAULT TRUE,
  line_spacing VARCHAR(20) DEFAULT 'single',
  group_by_type BOOLEAN DEFAULT FALSE,
  numbering_style VARCHAR(20) DEFAULT 'none',
  show_doi BOOLEAN DEFAULT TRUE,
  show_url BOOLEAN DEFAULT TRUE,
  show_access_date BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES generated_books(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bibliography_configs_book_id 
  ON bibliography_configs(book_id);

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================

-- Trigger for bibliography_references
CREATE OR REPLACE FUNCTION update_bibliography_references_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bibliography_references_updated_at
  BEFORE UPDATE ON bibliography_references
  FOR EACH ROW
  EXECUTE FUNCTION update_bibliography_references_updated_at();

-- Trigger for bibliography_configs
CREATE OR REPLACE FUNCTION update_bibliography_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bibliography_configs_updated_at
  BEFORE UPDATE ON bibliography_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_bibliography_configs_updated_at();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data for testing
/*
-- Sample reference (Book)
INSERT INTO bibliography_references (
  id, book_id, type, title, authors, year, publisher, 
  type_specific_data, citation_key
) VALUES (
  'ref_sample_001',
  1, -- Replace with actual book_id
  'book',
  'The Elements of Style',
  '[{"firstName":"William","lastName":"Strunk","suffix":"Jr."},{"firstName":"E.B.","lastName":"White"}]',
  1999,
  'Pearson',
  '{"edition":"4th ed.","isbn":"978-0205309023","publisherLocation":"New York, NY"}',
  'Strunk1999'
);

-- Sample reference (Journal)
INSERT INTO bibliography_references (
  id, book_id, type, title, authors, year,
  type_specific_data, citation_key
) VALUES (
  'ref_sample_002',
  1, -- Replace with actual book_id
  'journal',
  'The Structure of Scientific Revolutions',
  '[{"firstName":"Thomas","lastName":"Kuhn"}]',
  1962,
  '{"journalTitle":"University of Chicago Press","volume":"50","pages":"1-264"}',
  'Kuhn1962'
);

-- Sample bibliography config
INSERT INTO bibliography_configs (
  book_id, enabled, citation_style, location, sort_by
) VALUES (
  1, -- Replace with actual book_id
  TRUE,
  'APA',
  '["in-text", "bibliography"]',
  'author'
);
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check if tables were created successfully
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('bibliography_references', 'citations', 'bibliography_configs')
  AND table_schema = 'public';

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('bibliography_references', 'citations', 'bibliography_configs')
ORDER BY tablename, indexname;

-- ============================================
-- Rollback Script (if needed)
-- ============================================

/*
-- Uncomment to rollback the migration

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_bibliography_references_updated_at ON bibliography_references;
DROP TRIGGER IF EXISTS trigger_update_bibliography_configs_updated_at ON bibliography_configs;

-- Drop functions
DROP FUNCTION IF EXISTS update_bibliography_references_updated_at();
DROP FUNCTION IF EXISTS update_bibliography_configs_updated_at();

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS citations CASCADE;
DROP TABLE IF EXISTS bibliography_configs CASCADE;
DROP TABLE IF EXISTS bibliography_references CASCADE;
*/

-- ============================================
-- Migration Complete
-- ============================================

SELECT 'Bibliography system migration completed successfully!' as status;

