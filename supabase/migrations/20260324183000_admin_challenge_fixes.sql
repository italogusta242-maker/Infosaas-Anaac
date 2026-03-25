-- Migration to fix gaps in Challenge and Admin modules
-- Created: 2026-03-24

-- 1. Add missing columns to challenge_modules
ALTER TABLE challenge_modules ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE challenge_modules ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE challenge_modules ADD COLUMN IF NOT EXISTS access_restricted BOOLEAN DEFAULT FALSE;
ALTER TABLE challenge_modules ADD COLUMN IF NOT EXISTS unlock_type TEXT DEFAULT 'immediate';
ALTER TABLE challenge_modules ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ;

-- 2. Add missing columns to challenge_lessons
ALTER TABLE challenge_lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE challenge_lessons ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 3. Create storage bucket for challenge files (PDFs, etc)
-- Note: Requires storage schema extension enabled
INSERT INTO storage.buckets (id, name, public) 
VALUES ('challenge-files', 'challenge-files', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies for challenge-files
CREATE POLICY "Challenge files are public" ON storage.objects FOR SELECT USING (bucket_id = 'challenge-files');
CREATE POLICY "Admins can upload challenge files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'challenge-files');
CREATE POLICY "Admins can update challenge files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'challenge-files');
CREATE POLICY "Admins can delete challenge files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'challenge-files');
