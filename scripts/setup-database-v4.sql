-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view own sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can insert own sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can update own sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can delete own sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can view own files" ON site_files;
DROP POLICY IF EXISTS "Authenticated users can insert own files" ON site_files;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON site_files;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON site_files;
DROP TABLE IF EXISTS site_files;
DROP TABLE IF EXISTS sites;

-- Create sites table to track user uploads
CREATE TABLE sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  github_repo_name TEXT NOT NULL,
  github_repo_url TEXT NOT NULL,
  github_pages_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create site_files table to track individual files
CREATE TABLE site_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, filename)
);

-- Enable RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_files ENABLE ROW LEVEL SECURITY;

-- Create policies for sites
CREATE POLICY "Authenticated users can view own sites" ON sites
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own sites" ON sites
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update own sites" ON sites
  FOR UPDATE 
  USING (auth.uid() = user_id AND auth.role() = 'authenticated')
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete own sites" ON sites
  FOR DELETE 
  USING (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Create policies for site_files
CREATE POLICY "Authenticated users can view own files" ON site_files
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_files.site_id 
    AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can insert own files" ON site_files
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_files.site_id 
    AND sites.user_id = auth.uid()
  ) AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update own files" ON site_files
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_files.site_id 
    AND sites.user_id = auth.uid()
  ) AND auth.role() = 'authenticated')
  WITH CHECK (EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_files.site_id 
    AND sites.user_id = auth.uid()
  ) AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete own files" ON site_files
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_files.site_id 
    AND sites.user_id = auth.uid()
  ) AND auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sites_subdomain_idx ON sites(subdomain);
CREATE INDEX IF NOT EXISTS sites_user_id_idx ON sites(user_id);
CREATE INDEX IF NOT EXISTS sites_github_repo_name_idx ON sites(github_repo_name);
CREATE INDEX IF NOT EXISTS site_files_site_id_idx ON site_files(site_id);
CREATE INDEX IF NOT EXISTS site_files_filename_idx ON site_files(filename);

-- Grant necessary permissions
GRANT ALL ON sites TO authenticated;
GRANT ALL ON site_files TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
