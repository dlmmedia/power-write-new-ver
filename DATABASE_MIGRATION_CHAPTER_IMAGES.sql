-- Chapter Images Table Migration
-- Run this SQL to add the chapter_images table to your database

-- Create the chapter_images table
CREATE TABLE IF NOT EXISTS chapter_images (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES generated_books(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES book_chapters(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    image_type VARCHAR(50) NOT NULL, -- illustration, diagram, infographic, chart, photo, scene, concept
    position INTEGER DEFAULT 0, -- Character position in chapter content
    placement VARCHAR(50) DEFAULT 'center', -- inline, full-width, float-left, float-right, center, chapter-header, section-break
    caption TEXT,
    alt_text TEXT,
    prompt TEXT, -- Generation prompt for reference/regeneration
    metadata JSONB, -- width, height, style, format, generationModel, generatedAt, etc.
    source VARCHAR(50) DEFAULT 'generated', -- generated, uploaded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chapter_images_book_id ON chapter_images(book_id);
CREATE INDEX IF NOT EXISTS idx_chapter_images_chapter_id ON chapter_images(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_images_image_type ON chapter_images(image_type);

-- Add comments for documentation
COMMENT ON TABLE chapter_images IS 'Stores all images within book chapters';
COMMENT ON COLUMN chapter_images.image_type IS 'Type of image: illustration, diagram, infographic, chart, photo, scene, concept';
COMMENT ON COLUMN chapter_images.position IS 'Character position in chapter content where image should be placed';
COMMENT ON COLUMN chapter_images.placement IS 'How the image is positioned: inline, full-width, float-left, float-right, center';
COMMENT ON COLUMN chapter_images.metadata IS 'JSON object containing width, height, style, format, generationModel, generatedAt, etc.';
COMMENT ON COLUMN chapter_images.source IS 'Whether image was AI-generated or uploaded by user';

-- Verify the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chapter_images'
ORDER BY ordinal_position;
