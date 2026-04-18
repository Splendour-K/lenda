-- Set up Storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public access to avatars
DROP POLICY IF EXISTS "Avatars Public Access" ON storage.objects;
CREATE POLICY "Avatars Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Create policy to allow authenticated users to upload their own avatar
-- Or allow any authenticated user to upload to the avatars bucket
DROP POLICY IF EXISTS "Avatars Authenticated Upload" ON storage.objects;
CREATE POLICY "Avatars Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Create policy to allow authenticated users to update their own avatar
DROP POLICY IF EXISTS "Avatars Authenticated Update" ON storage.objects;
CREATE POLICY "Avatars Authenticated Update" 
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
