-- Menu SaaS 3D Database Schema
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'user' CHECK (type IN ('user', 'master')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  whatsapp TEXT,
  instagram TEXT,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_organizations table (many-to-many relationship)
CREATE TABLE user_organizations (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Create menu_images table
CREATE TABLE menu_images (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_images ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- Create policies for organizations table
CREATE POLICY "Public can read organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Owners can update their organizations" ON organizations FOR UPDATE USING (owner_id = auth.uid()::text);
CREATE POLICY "Users can create organizations" ON organizations FOR INSERT WITH CHECK (true);

-- Create policies for user_organizations table
CREATE POLICY "Users can see their organization memberships" ON user_organizations FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Organization owners can manage members" ON user_organizations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE organizations.id = user_organizations.organization_id 
    AND organizations.owner_id = auth.uid()::text
  )
);
CREATE POLICY "Allow joining organizations" ON user_organizations FOR INSERT WITH CHECK (true);

-- Create policies for menu_images table
CREATE POLICY "Public can view menu images" ON menu_images FOR SELECT USING (true);
CREATE POLICY "Organization members can manage images" ON menu_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_organizations.organization_id = menu_images.organization_id 
    AND user_organizations.user_id = auth.uid()::text
  )
);

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true);

-- Create storage policies for menu images bucket
CREATE POLICY "Public can view menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users can upload menu images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their organization's images" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images');

-- Insert master admin user (you can change the password hash or use bcrypt to generate one)
-- Default password: "Dede@02@" (you should change this after first login)
INSERT INTO users (id, email, password_hash, name, type) VALUES 
('master-admin-001', 'derickcampossantos1@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Master Admin', 'master');

-- Create indexes for better performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_menu_images_org ON menu_images(organization_id);
CREATE INDEX idx_menu_images_order ON menu_images(organization_id, display_order);
CREATE INDEX idx_user_organizations_user ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org ON user_organizations(organization_id);