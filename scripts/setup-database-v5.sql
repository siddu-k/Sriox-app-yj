-- Drop tables in correct order (child tables first)
-- Dropping tables will implicitly drop associated policies, triggers, etc.
DROP TABLE IF EXISTS site_files CASCADE;
DROP TABLE IF EXISTS sites CASCADE;

-- Create sites table to track user projects
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

-- Create site_files table to track individual files within projects
-- IMPORTANT: Removed 'content' column. Added 'github_sha' to track file version on GitHub.
CREATE TABLE site_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'text/plain',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  github_sha TEXT, -- Stores the SHA of the file on GitHub for version tracking and updates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, filename)
);

-- Enable Row Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_files ENABLE ROW LEVEL SECURITY;

-- Create policies for sites table
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

-- Create policies for site_files table
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
CREATE INDEX IF NOT EXISTS sites_created_at_idx ON sites(created_at DESC);

CREATE INDEX IF NOT EXISTS site_files_site_id_idx ON site_files(site_id);
CREATE INDEX IF NOT EXISTS site_files_filename_idx ON site_files(filename);
CREATE INDEX IF NOT EXISTS site_files_file_type_idx ON site_files(file_type);
CREATE INDEX IF NOT EXISTS site_files_created_at_idx ON site_files(created_at DESC);

-- Grant necessary permissions to authenticated users
GRANT ALL ON sites TO authenticated;
GRANT ALL ON site_files TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a view to get sites with file counts (optional, for better performance)
CREATE OR REPLACE VIEW sites_with_file_counts AS
SELECT 
  s.*,
  COALESCE(f.file_count, 0) as file_count
FROM sites s
LEFT JOIN (
  SELECT 
    site_id, 
    COUNT(*) as file_count
  FROM site_files 
  GROUP BY site_id
) f ON s.id = f.site_id;

-- Grant access to the view
GRANT SELECT ON sites_with_file_counts TO authenticated;

-- Add a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sites_updated_at 
  BEFORE UPDATE ON sites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_files_updated_at 
  BEFORE UPDATE ON site_files 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some helpful comments
COMMENT ON TABLE sites IS 'Stores user projects/sites with deployment information';
COMMENT ON TABLE site_files IS 'Stores individual files within each project for editing';
COMMENT ON COLUMN sites.subdomain IS 'Unique subdomain for the deployed site (e.g., "my-site" for my-site.sriox.com)';
COMMENT ON COLUMN sites.name IS 'User-friendly project name';
COMMENT ON COLUMN sites.description IS 'Optional project description';
COMMENT ON COLUMN site_files.filename IS 'Name of the file (e.g., "index.html", "style.css")';
COMMENT ON COLUMN site_files.file_type IS 'MIME type of the file';
COMMENT ON COLUMN site_files.size_bytes IS 'Size of the file content in bytes';
COMMENT ON COLUMN site_files.github_sha IS 'SHA hash of the file content on GitHub, used for updates';
