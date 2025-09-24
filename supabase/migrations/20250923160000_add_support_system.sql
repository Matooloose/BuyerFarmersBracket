-- Create support tickets system tables
CREATE TABLE support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('payment', 'delivery', 'account', 'technical', 'product', 'farmer', 'subscription', 'other')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
    assigned_agent VARCHAR(100),
    estimated_resolution TIMESTAMPTZ,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    resolution_time INTEGER, -- in hours
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support messages table for conversation history
CREATE TABLE support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('customer', 'agent', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support attachments table for file uploads
CREATE TABLE support_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create security sessions table for UpdateProfile
CREATE TABLE security_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device VARCHAR(255),
    location VARCHAR(255),
    ip_address VARCHAR(45),
    browser VARCHAR(255),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    is_current BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create login history table for UpdateProfile
CREATE TABLE login_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    location VARCHAR(255),
    ip_address VARCHAR(45),
    device VARCHAR(255),
    browser VARCHAR(255),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed')),
    method VARCHAR(50) DEFAULT 'email' CHECK (method IN ('email', 'social', 'phone', 'biometric')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create delivery photos table for TrackOrder
CREATE TABLE delivery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('package', 'location', 'safe_drop', 'recipient')),
    url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_attachments_ticket_id ON support_attachments(ticket_id);
CREATE INDEX idx_security_sessions_user_id ON security_sessions(user_id);
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_delivery_photos_order_id ON delivery_photos(order_id);

-- Create updated_at trigger for support_tickets
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own support tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own support tickets" ON support_tickets
    FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for support_messages
CREATE POLICY "Users can view messages for their tickets" ON support_messages
    FOR SELECT USING (
        ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create messages for their tickets" ON support_messages
    FOR INSERT WITH CHECK (
        ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    );

-- RLS policies for support_attachments
CREATE POLICY "Users can view attachments for their tickets" ON support_attachments
    FOR SELECT USING (
        ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can upload attachments to their tickets" ON support_attachments
    FOR INSERT WITH CHECK (
        ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    );

-- RLS policies for security_sessions
CREATE POLICY "Users can view their own security sessions" ON security_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own security sessions" ON security_sessions
    FOR ALL USING (user_id = auth.uid());

-- RLS policies for login_history
CREATE POLICY "Users can view their own login history" ON login_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert login history" ON login_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS policies for delivery_photos
CREATE POLICY "Users can view delivery photos for their orders" ON delivery_photos
    FOR SELECT USING (
        order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert delivery photos" ON delivery_photos
    FOR INSERT WITH CHECK (true); -- Allow system to insert photos