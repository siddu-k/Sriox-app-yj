-- Create sites table to track user uploads
CREATE TABLE IF NOT EXISTS sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subdomain TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sites
CREATE POLICY "Users can view own sites" ON sites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sites
CREATE POLICY "Users can insert own sites" ON sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sites
CREATE POLICY "Users can update own sites" ON sites
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sites
CREATE POLICY "Users can delete own sites" ON sites
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster subdomain lookups
CREATE INDEX IF NOT EXISTS sites_subdomain_idx ON sites(subdomain);
CREATE INDEX IF NOT EXISTS sites_user_id_idx ON sites(user_id);
