-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view own sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can insert own sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can update own sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can delete own sites" ON sites;
DROP TABLE IF EXISTS sites;

-- Create sites table to track user uploads with additional GitHub info
CREATE TABLE sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  github_repo_name TEXT NOT NULL,
  github_repo_url TEXT NOT NULL,
  github_pages_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sites_subdomain_idx ON sites(subdomain);
CREATE INDEX IF NOT EXISTS sites_user_id_idx ON sites(user_id);
CREATE INDEX IF NOT EXISTS sites_github_repo_name_idx ON sites(github_repo_name);

-- Grant necessary permissions
GRANT ALL ON sites TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
