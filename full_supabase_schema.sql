-- Full Supabase Schema with Demo Data

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL, 
    role TEXT NOT NULL DEFAULT 'Executive',
    avatar TEXT,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    permissions JSONB DEFAULT '[]'
);

-- 2. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    roles JSONB DEFAULT '[]',
    status TEXT DEFAULT 'Yes',
    joined_date DATE DEFAULT CURRENT_DATE,
    avatar TEXT,
    is_messaging_active BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT TRUE,
    current_load INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    resolved_chats INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    performance_score INTEGER DEFAULT 0
);

-- 3. Channels Table
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL, 
    name TEXT NOT NULL,     
    external_id TEXT UNIQUE NOT NULL, 
    access_token TEXT,      
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}' 
);

-- 4. Chats Table
CREATE TABLE IF NOT EXISTS public.chats (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_color TEXT,
    last_msg TEXT,
    last_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread INTEGER DEFAULT 0,
    online BOOLEAN DEFAULT TRUE,
    avatar TEXT,
    is_starred BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,
    is_bin BOOLEAN DEFAULT FALSE,
    is_done BOOLEAN DEFAULT FALSE,
    has_ordered BOOLEAN DEFAULT FALSE,
    assigned_to TEXT,
    phone TEXT,
    profile JSONB DEFAULT '{}',
    external_uid TEXT,
    channel_id UUID REFERENCES public.channels(id)
);

CREATE INDEX IF NOT EXISTS idx_chats_platform_uid ON public.chats(platform, external_uid);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES public.chats(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender TEXT NOT NULL, 
    time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT DEFAULT 'text', 
    media_url TEXT,
    translated_text TEXT,
    external_id TEXT UNIQUE
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    phone TEXT,
    item TEXT NOT NULL,
    amount TEXT NOT NULL,
    paid TEXT NOT NULL,
    due TEXT NOT NULL,
    status TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    channel TEXT,
    assigned_to TEXT
);

-- 7. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    source TEXT,
    status TEXT,
    score INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    assigned_to TEXT
);

-- --- DEMO DATA ---

-- Demo Admin
INSERT INTO public.app_users (name, email, password, role, avatar)
VALUES ('Admin User', 'admin@omniinbox.com', 'admin123', 'Super Admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin')
ON CONFLICT (email) DO NOTHING;

-- Demo Employees
INSERT INTO public.employees (name, email, roles, is_online, avatar, rating, resolved_chats)
VALUES 
('Hasnut Karim', 'hasnut@omniinbox.com', '["Agent"]', true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=hasnut', 4.8, 152),
('Sarah Chen', 'sarah@omniinbox.com', '["Agent"]', true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 4.9, 89)
ON CONFLICT (email) DO NOTHING;

-- Demo Channels
INSERT INTO public.channels (platform, name, external_id, status)
VALUES 
('facebook', 'Aaramaura Shop FB', 'pg_123456789', 'active'),
('whatsapp', 'Business WhatsApp', 'default', 'active')
ON CONFLICT (external_id) DO NOTHING;

-- Demo Chats
INSERT INTO public.chats (name, platform, platform_color, last_msg, assigned_to, external_uid, avatar)
VALUES 
('Jamal Ahmed', 'messenger', 'bg-blue-500', 'I want to know the price of Messenger Plan', 'Hasnut Karim', 'psid_9876', 'J'),
('Akash Khan', 'whatsapp', 'bg-emerald-500', 'Do you have home delivery?', 'Sarah Chen', '8801700000000@c.us', 'A')
ON CONFLICT DO NOTHING;

-- 8. Facebook Integration Tables

-- Store Facebook Page Access Tokens securely
CREATE TABLE IF NOT EXISTS public.social_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  page_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  page_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Facebook direct messages
CREATE TABLE IF NOT EXISTS public.facebook_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  message_id TEXT UNIQUE NOT NULL,
  text TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'unreplied'
);
