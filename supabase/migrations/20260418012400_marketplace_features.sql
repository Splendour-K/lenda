-- Migration script for Lenda Marketplace Features

-- 1. Create a trigger to automatically create a user profile on auth signup
-- This fixes the foreign key constraint error when adding items.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar)
  VALUES (
    new.id,
    split_part(new.email, '@', 1), -- Default name based on email
    'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F18-25%2FEuropean%2F1'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid errors on re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Drop the category check constraint to allow new categories
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_category_check;

-- 3. Add currency column to items
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='items' AND column_name='currency'
  ) THEN
    ALTER TABLE public.items ADD COLUMN currency text NOT NULL DEFAULT 'GHS';
  END IF;
END $$;

-- 4. Set up Storage bucket for item images
-- You might need to run these as superuser if they fail, or just create the bucket in the UI.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public access to item-images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'item-images' );

-- Create policy to allow authenticated users to upload to item-images
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'item-images' AND auth.role() = 'authenticated' );
