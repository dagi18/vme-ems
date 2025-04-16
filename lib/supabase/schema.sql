-- Create users table with super_admin role
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a super admin user (you'll need to create this user in Auth first)
-- Replace 'SUPER_ADMIN_UUID' with the actual UUID from Auth
INSERT INTO users (id, email, first_name, last_name, username, role)
VALUES 
  ('SUPER_ADMIN_UUID', 'super.admin@example.com', 'Super', 'Admin', 'superadmin', 'super_admin')
ON CONFLICT (id) DO NOTHING;

-- Set up row level security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY super_admin_all_users ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

-- Admins can read all users but only update themselves
CREATE POLICY admin_read_all_users ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY admin_update_self ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
  WITH CHECK (auth.uid() = id AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Staff can only read and update themselves
CREATE POLICY staff_read_self ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY staff_update_self ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
