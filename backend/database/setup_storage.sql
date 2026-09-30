-- ==============================================================
-- Cura+ (HealthSync AI) - Supabase Cloud Storage Configuration
-- Creates the public storage bucket for profile pictures (DP) and meal scans
--
-- How to apply:
-- Supabase Dashboard -> Select Project -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================

-- 1. Create or update public bucket 'cura-uploads'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cura-uploads',
    'cura-uploads',
    true,
    10485760, -- 10 MB maximum per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']::text[];

-- 2. Enable public read access for all objects in 'cura-uploads'
DROP POLICY IF EXISTS "Public Read Cura Uploads" ON storage.objects;
CREATE POLICY "Public Read Cura Uploads" ON storage.objects
    FOR SELECT USING (bucket_id = 'cura-uploads');

-- 3. Enable upload access for 'cura-uploads' (allows frontend and backend uploads)
DROP POLICY IF EXISTS "Public Insert Cura Uploads" ON storage.objects;
CREATE POLICY "Public Insert Cura Uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'cura-uploads');

-- 4. Enable update access for 'cura-uploads'
DROP POLICY IF EXISTS "Public Update Cura Uploads" ON storage.objects;
CREATE POLICY "Public Update Cura Uploads" ON storage.objects
    FOR UPDATE USING (bucket_id = 'cura-uploads');

-- 5. Enable delete access for 'cura-uploads'
DROP POLICY IF EXISTS "Public Delete Cura Uploads" ON storage.objects;
CREATE POLICY "Public Delete Cura Uploads" ON storage.objects
    FOR DELETE USING (bucket_id = 'cura-uploads');
