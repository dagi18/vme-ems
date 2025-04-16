-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(255) NOT NULL,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  user_role VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
-- Event permissions
('view_events', 'View all events', 'events', 'view'),
('create_events', 'Create new events', 'events', 'create'),
('update_events', 'Update existing events', 'events', 'update'),
('delete_events', 'Delete events', 'events', 'delete'),

-- Guest permissions
('view_guests', 'View all guests', 'guests', 'view'),
('create_guests', 'Register new guests', 'guests', 'create'),
('update_guests', 'Update guest information', 'guests', 'update'),
('delete_guests', 'Delete guests', 'guests', 'delete'),
('check_in_guests', 'Check in guests', 'guests', 'check_in'),

-- Report permissions
('view_reports', 'View reports', 'reports', 'view'),
('export_reports', 'Export reports', 'reports', 'export'),
('create_reports', 'Create custom reports', 'reports', 'create'),

-- User permissions
('view_users', 'View all users', 'users', 'view'),
('create_users', 'Create new users', 'users', 'create'),
('update_users', 'Update user information', 'users', 'update'),
('delete_users', 'Delete users', 'users', 'delete'),

-- Role permissions
('view_roles', 'View all roles', 'roles', 'view'),
('create_roles', 'Create new roles', 'roles', 'create'),
('update_roles', 'Update roles', 'roles', 'update'),
('delete_roles', 'Delete roles', 'roles', 'delete'),
('assign_roles', 'Assign roles to users', 'roles', 'assign'),

-- Badge permissions
('view_badges', 'View badges', 'badges', 'view'),
('create_badges', 'Create badge templates', 'badges', 'create'),
('update_badges', 'Update badge templates', 'badges', 'update'),
('delete_badges', 'Delete badge templates', 'badges', 'delete'),
('print_badges', 'Print badges', 'badges', 'print'),

-- Activity log permissions
('view_activity_logs', 'View activity logs', 'activity_logs', 'view')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign default permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Admin permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name NOT IN (
  'delete_users', 
  'create_roles', 
  'update_roles', 
  'delete_roles', 
  'assign_roles'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Staff permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'staff', id FROM permissions 
WHERE name IN (
  'view_events',
  'view_guests',
  'create_guests',
  'update_guests',
  'check_in_guests',
  'view_badges',
  'print_badges'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Create a trigger to update the updated_at column for permissions
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_permissions_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_role ON activity_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
