-- Menu SaaS 3D Database Schema
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'master')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'pro')),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  instagram TEXT,
  whatsapp TEXT,
  tiktok TEXT,
  address TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_organizations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Create menu_images table
CREATE TABLE IF NOT EXISTS menu_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Public can read organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can see their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Organization owners can manage members" ON user_organizations;
DROP POLICY IF EXISTS "Allow joining organizations" ON user_organizations;
DROP POLICY IF EXISTS "Public can view menu images" ON menu_images;
DROP POLICY IF EXISTS "Organization members can manage images" ON menu_images;

-- Create policies for users table
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- Create policies for organizations table
CREATE POLICY "Public can read organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Owners can update their organizations" ON organizations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_organizations.organization_id = organizations.id 
    AND user_organizations.user_id = auth.uid()
    AND user_organizations.role IN ('owner', 'admin')
  )
);
CREATE POLICY "Users can create organizations" ON organizations FOR INSERT WITH CHECK (true);

-- Create policies for user_organizations table
CREATE POLICY "Users can see their organization memberships" ON user_organizations FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM user_organizations uo2 
    WHERE uo2.organization_id = user_organizations.organization_id 
    AND uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);
CREATE POLICY "Organization owners can manage members" ON user_organizations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo2
    WHERE uo2.organization_id = user_organizations.organization_id 
    AND uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);
CREATE POLICY "Allow joining organizations" ON user_organizations FOR INSERT WITH CHECK (true);

-- Create policies for menu_images table
CREATE POLICY "Public can view menu images" ON menu_images FOR SELECT USING (true);
CREATE POLICY "Organization members can manage images" ON menu_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_organizations.organization_id = menu_images.organization_id 
    AND user_organizations.user_id = auth.uid()
  )
);

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their organization's images" ON storage.objects;

-- Create storage policies for menu images bucket
CREATE POLICY "Public can view menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users can upload menu images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'menu-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete their organization's images" ON storage.objects FOR DELETE USING (
  bucket_id = 'menu-images' AND auth.role() = 'authenticated'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_menu_images_org ON menu_images(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org ON user_organizations(organization_id);

-- Insert master admin user (you can change the password hash or use bcrypt to generate one)
-- Default password: "admin123" (you should change this after first login)
INSERT INTO users (id, email, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'derickcampossantos1@gmail.com', 'Master Admin', 'master')
ON CONFLICT (email) DO UPDATE SET role = 'master';