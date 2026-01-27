-- ============================================================================
-- iWent Database Schema
-- Version: 2.0
-- OpenAPI'den Türetilmiş - Supabase/PostgreSQL
-- Artist, Friendship, Venue endpoint'leri dahil
-- ============================================================================

-- ============================================================================
-- EXTENSIONS (Supabase'de varsayılan olarak mevcut)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Fuzzy search için

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- User role (OpenAPI: User.role)
CREATE TYPE user_role AS ENUM ('public', 'user', 'organizer', 'admin');

-- Order status (OpenAPI: Order.status)
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');

-- Ticket status (OpenAPI: Ticket.status)
CREATE TYPE ticket_status AS ENUM ('RESERVED', 'CONFIRMED', 'CANCELLED');

-- Chat type (OpenAPI: ChatRoom.type)
CREATE TYPE chat_type AS ENUM ('personal', 'group', 'support', 'event');

-- Discount type (OpenAPI: DiscountCode.type)
CREATE TYPE discount_type AS ENUM ('percentage', 'amount');

-- Event status (endpoint'lerden türetilmiş: draft → publish → unpublish)
CREATE TYPE event_status AS ENUM ('draft', 'published', 'unpublished', 'cancelled');

-- Friendship status (YENİ)
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');

-- Report action (OpenAPI: /org/moderation/reports/{id}/action)
CREATE TYPE report_action AS ENUM ('approve', 'reject', 'archive');

-- Chat moderation action (OpenAPI: /org/moderation/chats/{id}/action)
CREATE TYPE chat_moderation_action AS ENUM ('freeze', 'unfreeze', 'delete', 'clear-history');

-- Notification status
CREATE TYPE notification_status AS ENUM ('unread', 'read');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- USERS (OpenAPI: User schema + /auth/* + /users/me)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    city VARCHAR(100),
    role user_role NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    preferences JSONB DEFAULT '{
        "language": "tr",
        "notifications": {
            "push": true,
            "email": true,
            "sms": false
        }
    }',
    
    -- Profile extras
    bio TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    
    -- Email verification (OpenAPI: /auth/verify/email)
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_code VARCHAR(10),
    email_verification_expires_at TIMESTAMPTZ,
    
    -- Password reset (OpenAPI: /auth/password/forgot, /auth/password/reset)
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMPTZ,
    
    -- Security
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_name_search ON users USING gin(name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- REFRESH TOKENS (OpenAPI: /auth/refresh, /auth/logout)
-- -----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- -----------------------------------------------------------------------------
-- FRIENDSHIPS (YENİ - OpenAPI'ye eklenecek)
-- -----------------------------------------------------------------------------
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friendship_status NOT NULL DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id),
    CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_accepted ON friendships(requester_id, addressee_id) WHERE status = 'accepted';

-- -----------------------------------------------------------------------------
-- ORGANIZERS (OpenAPI: /org/profile)
-- -----------------------------------------------------------------------------
CREATE TABLE organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business info
    business_name VARCHAR(255),
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    website VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Türkiye',
    
    -- Social links
    social_links JSONB DEFAULT '{}',
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    -- Stats (denormalized)
    total_events INTEGER DEFAULT 0,
    total_tickets_sold INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizers_user ON organizers(user_id);
CREATE INDEX idx_organizers_city ON organizers(city);
CREATE INDEX idx_organizers_verified ON organizers(is_verified) WHERE is_verified = TRUE;

-- -----------------------------------------------------------------------------
-- TEAM MEMBERS (OpenAPI: /org/team)
-- -----------------------------------------------------------------------------
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '[]',
    
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organizer_id, user_id)
);

CREATE INDEX idx_team_members_organizer ON team_members(organizer_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- -----------------------------------------------------------------------------
-- ARTISTS (YENİ - OpenAPI'ye eklenecek)
-- -----------------------------------------------------------------------------
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    bio TEXT,
    
    -- Media
    profile_photo_url TEXT,
    cover_photo_url TEXT,
    gallery JSONB DEFAULT '[]',
    
    -- Contact & Social
    website VARCHAR(500),
    social_links JSONB DEFAULT '{}',
    
    -- Categorization
    genres JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    
    -- Stats (denormalized)
    follower_count INTEGER DEFAULT 0,
    event_count INTEGER DEFAULT 0,
    
    -- Management
    managed_by_organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artists_slug ON artists(slug);
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_name_search ON artists USING gin(name gin_trgm_ops);
CREATE INDEX idx_artists_genres ON artists USING gin(genres);
CREATE INDEX idx_artists_managed_by ON artists(managed_by_organizer_id);

-- -----------------------------------------------------------------------------
-- ARTIST FOLLOWERS (YENİ)
-- -----------------------------------------------------------------------------
CREATE TABLE artist_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(artist_id, user_id)
);

CREATE INDEX idx_artist_followers_artist ON artist_followers(artist_id);
CREATE INDEX idx_artist_followers_user ON artist_followers(user_id);

-- -----------------------------------------------------------------------------
-- VENUES (OpenAPI: VenueSummary + endpoint'ler eklenecek)
-- -----------------------------------------------------------------------------
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info (OpenAPI: VenueSummary)
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    
    -- Location
    city VARCHAR(100),
    address TEXT,
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Türkiye',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Media
    profile_photo_url TEXT,
    cover_photo_url TEXT,
    gallery JSONB DEFAULT '[]',
    
    -- Details
    capacity INTEGER,
    amenities JSONB DEFAULT '[]',
    
    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    social_links JSONB DEFAULT '{}',
    
    -- Operating hours
    operating_hours JSONB DEFAULT '{}',
    
    -- Management
    managed_by_organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    -- Stats
    event_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_name_search ON venues USING gin(name gin_trgm_ops);
CREATE INDEX idx_venues_location ON venues(latitude, longitude);
CREATE INDEX idx_venues_managed_by ON venues(managed_by_organizer_id);

-- -----------------------------------------------------------------------------
-- VENUE REVIEWS (YENİ)
-- -----------------------------------------------------------------------------
CREATE TABLE venue_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    
    is_visible BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(venue_id, user_id)
);

CREATE INDEX idx_venue_reviews_venue ON venue_reviews(venue_id);
CREATE INDEX idx_venue_reviews_user ON venue_reviews(user_id);

-- -----------------------------------------------------------------------------
-- CATEGORIES (OpenAPI: Event.category)
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    color VARCHAR(7), -- Hex color
    
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;

-- -----------------------------------------------------------------------------
-- EVENTS (OpenAPI: Event schema + /events/* + /org/events/*)
-- -----------------------------------------------------------------------------
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE RESTRICT,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Basic info (OpenAPI: Event schema)
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Timing
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    
    -- Media
    banner_url TEXT,
    
    -- Location (for events without venue)
    address TEXT,
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_online BOOLEAN DEFAULT FALSE,
    online_url VARCHAR(500),
    
    -- Capacity
    total_capacity INTEGER,
    current_attendees INTEGER DEFAULT 0,
    
    -- Pricing (denormalized from ticket_types)
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'TRY',
    
    -- Status
    status event_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    
    -- Settings
    settings JSONB DEFAULT '{
        "allow_chat": true,
        "show_attendee_count": true,
        "require_approval": false,
        "age_restriction": null
    }',
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    
    -- Stats (denormalized)
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_title_search ON events USING gin(title gin_trgm_ops);
CREATE INDEX idx_events_published ON events(status, start_date) WHERE status = 'published';

-- Composite index for search
CREATE INDEX idx_events_search ON events(status, category_id, city, start_date);

-- -----------------------------------------------------------------------------
-- EVENT ARTISTS (Many-to-Many)
-- -----------------------------------------------------------------------------
CREATE TABLE event_artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    
    role VARCHAR(50) DEFAULT 'performer', -- headliner, performer, guest, dj, etc.
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, artist_id)
);

CREATE INDEX idx_event_artists_event ON event_artists(event_id);
CREATE INDEX idx_event_artists_artist ON event_artists(artist_id);

-- -----------------------------------------------------------------------------
-- EVENT PHOTOS (OpenAPI: Event.photos)
-- -----------------------------------------------------------------------------
CREATE TABLE event_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_photos_event ON event_photos(event_id);

-- -----------------------------------------------------------------------------
-- EVENT MEDIA (OpenAPI: /events/{id}/media, /org/events/{id}/media)
-- -----------------------------------------------------------------------------
CREATE TABLE event_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- image, video, audio
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    title VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_media_event ON event_media(event_id);
CREATE INDEX idx_event_media_type ON event_media(event_id, type);

-- -----------------------------------------------------------------------------
-- EVENT ATTACHMENTS (OpenAPI: /org/events/{id}/attachments)
-- -----------------------------------------------------------------------------
CREATE TABLE event_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_attachments_event ON event_attachments(event_id);

-- -----------------------------------------------------------------------------
-- EVENT SOCIAL (OpenAPI: /events/{id}/social)
-- -----------------------------------------------------------------------------
CREATE TABLE event_social (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    
    social_links JSONB DEFAULT '{}',
    hashtags JSONB DEFAULT '[]',
    share_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- EVENT REVIEWS
-- -----------------------------------------------------------------------------
CREATE TABLE event_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Organizer response
    organizer_response TEXT,
    organizer_responded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_reviews_event ON event_reviews(event_id);
CREATE INDEX idx_event_reviews_user ON event_reviews(user_id);
CREATE INDEX idx_event_reviews_rating ON event_reviews(event_id, rating);

-- -----------------------------------------------------------------------------
-- TICKET TYPES (OpenAPI: TicketType schema)
-- -----------------------------------------------------------------------------
CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- OpenAPI: TicketType schema
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    capacity INTEGER NOT NULL,
    
    -- Stock tracking
    sold_count INTEGER DEFAULT 0,
    reserved_count INTEGER DEFAULT 0,
    
    -- Availability
    sale_start_date TIMESTAMPTZ,
    sale_end_date TIMESTAMPTZ,
    min_per_order INTEGER DEFAULT 1,
    max_per_order INTEGER DEFAULT 10,
    
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: sold + reserved <= capacity
    CONSTRAINT chk_ticket_capacity CHECK (sold_count + reserved_count <= capacity),
    CONSTRAINT chk_price_positive CHECK (price >= 0)
);

CREATE INDEX idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX idx_ticket_types_active ON ticket_types(event_id, is_active) WHERE is_active = TRUE;

-- -----------------------------------------------------------------------------
-- DISCOUNT CODES (OpenAPI: DiscountCode schema)
-- -----------------------------------------------------------------------------
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- OpenAPI: DiscountCode schema
    code VARCHAR(50) NOT NULL,
    type discount_type NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    expires_at TIMESTAMPTZ,
    
    -- Additional fields
    min_purchase_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    
    -- Usage tracking
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, code),
    CONSTRAINT chk_value_positive CHECK (value > 0)
);

CREATE INDEX idx_discount_codes_event ON discount_codes(event_id);
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(event_id, is_active, expires_at);

-- -----------------------------------------------------------------------------
-- PRICING RULES (OpenAPI: /org/events/{id}/pricing-rules)
-- -----------------------------------------------------------------------------
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- early_bird, last_minute, quantity_based, time_based
    
    -- Conditions (JSONB for flexibility)
    conditions JSONB DEFAULT '{}',
    
    -- Adjustment
    adjustment_type VARCHAR(20) NOT NULL, -- percentage, fixed
    adjustment_value DECIMAL(10,2) NOT NULL,
    
    -- Validity
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_event ON pricing_rules(event_id);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(event_id, is_active);

-- ============================================================================
-- ORDER & TICKET TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- ORDERS (OpenAPI: Order schema)
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    
    -- Order number (human readable)
    order_number VARCHAR(20) NOT NULL UNIQUE,
    
    -- OpenAPI: Order schema
    status order_status NOT NULL DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    
    -- Pricing breakdown
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    service_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Discount
    discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL,
    
    -- Payment (OpenAPI: /payments/intent)
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    payment_provider_id VARCHAR(255),
    payment_metadata JSONB DEFAULT '{}',
    
    -- Billing info
    billing_info JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ -- For pending orders
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_event ON orders(event_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_pending_expires ON orders(expires_at) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- ORDER ITEMS (OpenAPI: Order.items)
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
    
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_ticket_type ON order_items(ticket_type_id);

-- -----------------------------------------------------------------------------
-- TICKETS (OpenAPI: Ticket schema)
-- -----------------------------------------------------------------------------
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- OpenAPI: Ticket schema
    status ticket_status NOT NULL DEFAULT 'RESERVED',
    qr_code VARCHAR(100) UNIQUE,
    
    -- Transfer
    original_owner_id UUID REFERENCES users(id),
    transferred_at TIMESTAMPTZ,
    
    -- Check-in (OpenAPI: /org/events/{id}/checkin)
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES users(id),
    
    -- Refund (OpenAPI: /tickets/{ticketId}/refund)
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tickets_qr ON tickets(qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_event_status ON tickets(event_id, status);

-- ============================================================================
-- SOCIAL / CHAT TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- CHAT ROOMS (OpenAPI: ChatRoom schema)
-- -----------------------------------------------------------------------------
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- OpenAPI: ChatRoom schema
    name VARCHAR(255),
    type chat_type NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    
    -- For direct chats (personal type)
    -- Will be tracked via chat_participants
    
    -- Settings
    settings JSONB DEFAULT '{
        "allow_media": true,
        "max_participants": 1000
    }',
    
    -- Stats
    participant_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    
    -- Moderation (OpenAPI: /org/moderation/chats/{id}/action)
    is_frozen BOOLEAN DEFAULT FALSE,
    frozen_at TIMESTAMPTZ,
    frozen_by UUID REFERENCES users(id),
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_rooms_event ON chat_rooms(event_id);
CREATE INDEX idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX idx_chat_rooms_frozen ON chat_rooms(is_frozen) WHERE is_frozen = TRUE;

-- -----------------------------------------------------------------------------
-- CHAT PARTICIPANTS
-- -----------------------------------------------------------------------------
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
    
    -- Read tracking (OpenAPI: /users/me/chats/{chatId}/read)
    last_read_at TIMESTAMPTZ,
    last_read_message_id UUID,
    unread_count INTEGER DEFAULT 0,
    
    -- Notifications
    is_muted BOOLEAN DEFAULT FALSE,
    muted_until TIMESTAMPTZ,
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    UNIQUE(chat_room_id, user_id)
);

CREATE INDEX idx_chat_participants_room ON chat_participants(chat_room_id);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_active ON chat_participants(user_id, left_at) WHERE left_at IS NULL;

-- -----------------------------------------------------------------------------
-- MESSAGES (OpenAPI: Message schema)
-- -----------------------------------------------------------------------------
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- OpenAPI: Message schema
    content TEXT NOT NULL,
    
    -- Media
    media_url TEXT,
    media_type VARCHAR(50),
    media_metadata JSONB,
    
    -- Reply
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Soft delete (moderation)
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_room ON messages(chat_room_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_room_active ON messages(chat_room_id, created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- USER ENGAGEMENT TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- USER LIKES (OpenAPI: /users/me/likes)
-- -----------------------------------------------------------------------------
CREATE TABLE user_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_user_likes_user ON user_likes(user_id);
CREATE INDEX idx_user_likes_event ON user_likes(event_id);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS (OpenAPI: /users/me/notifications)
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    
    -- Related entities
    data JSONB DEFAULT '{}',
    
    -- Deep link
    action_url TEXT,
    
    status notification_status DEFAULT 'unread',
    read_at TIMESTAMPTZ,
    
    -- Delivery tracking
    sent_via JSONB DEFAULT '[]', -- ['push', 'email', 'in_app']
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, status, created_at DESC) WHERE status = 'unread';
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================================================
-- MODERATION TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- REPORTS (OpenAPI: /org/moderation/reports)
-- -----------------------------------------------------------------------------
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Reported entity
    entity_type VARCHAR(50) NOT NULL, -- message, user, event, review
    entity_id UUID NOT NULL,
    
    reason VARCHAR(100),
    description TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    action_taken report_action,
    action_note TEXT,
    action_taken_at TIMESTAMPTZ,
    action_taken_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_organizer ON reports(organizer_id);
CREATE INDEX idx_reports_status ON reports(organizer_id, status);
CREATE INDEX idx_reports_entity ON reports(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- MODERATION FILTERS (OpenAPI: /org/moderation/filters)
-- -----------------------------------------------------------------------------
CREATE TABLE moderation_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL UNIQUE REFERENCES organizers(id) ON DELETE CASCADE,
    
    blocked_words TEXT[] DEFAULT '{}',
    blocked_patterns TEXT[] DEFAULT '{}',
    spam_protection BOOLEAN DEFAULT TRUE,
    media_filter BOOLEAN DEFAULT TRUE,
    link_filter BOOLEAN DEFAULT FALSE,
    
    auto_actions JSONB DEFAULT '{}',
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- EVENT DAILY STATS (OpenAPI: /org/analytics/*)
-- -----------------------------------------------------------------------------
CREATE TABLE event_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    tickets_sold INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, date)
);

CREATE INDEX idx_event_daily_stats_event ON event_daily_stats(event_id);
CREATE INDEX idx_event_daily_stats_date ON event_daily_stats(date);
CREATE INDEX idx_event_daily_stats_event_date ON event_daily_stats(event_id, date DESC);

-- -----------------------------------------------------------------------------
-- CONVERSION FUNNEL (OpenAPI: /org/analytics/events/{id}/conversion)
-- -----------------------------------------------------------------------------
CREATE TABLE event_conversion_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    page_views INTEGER DEFAULT 0,
    ticket_views INTEGER DEFAULT 0,
    cart_adds INTEGER DEFAULT 0,
    checkout_starts INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    
    UNIQUE(event_id, date)
);

CREATE INDEX idx_event_conversion_event ON event_conversion_stats(event_id);

-- -----------------------------------------------------------------------------
-- TRAFFIC SOURCES (OpenAPI: /org/analytics/events/{id}/top-sources)
-- -----------------------------------------------------------------------------
CREATE TABLE event_traffic_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    source VARCHAR(100) NOT NULL,
    medium VARCHAR(100),
    campaign VARCHAR(100),
    
    visits INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    
    UNIQUE(event_id, date, source, medium, campaign)
);

CREATE INDEX idx_event_traffic_event ON event_traffic_sources(event_id);
CREATE INDEX idx_event_traffic_source ON event_traffic_sources(source);

-- -----------------------------------------------------------------------------
-- AUDIENCE STATS (OpenAPI: /org/analytics/events/{id}/audience)
-- -----------------------------------------------------------------------------
CREATE TABLE event_audience_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Demographics
    age_groups JSONB DEFAULT '{}',
    gender_distribution JSONB DEFAULT '{}',
    city_distribution JSONB DEFAULT '{}',
    
    -- Behavior
    device_distribution JSONB DEFAULT '{}',
    platform_distribution JSONB DEFAULT '{}',
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id)
);

CREATE INDEX idx_event_audience_event ON event_audience_stats(event_id);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- PAYMENT WEBHOOKS (OpenAPI: /payments/webhook)
-- -----------------------------------------------------------------------------
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    event_id VARCHAR(255), -- Provider's event ID
    
    payload JSONB NOT NULL,
    headers JSONB,
    
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    process_result JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed) WHERE processed = FALSE;
CREATE INDEX idx_payment_webhooks_provider ON payment_webhooks(provider, event_type);
CREATE INDEX idx_payment_webhooks_event ON payment_webhooks(event_id);

-- -----------------------------------------------------------------------------
-- SYSTEM CONFIG (OpenAPI: /config)
-- -----------------------------------------------------------------------------
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_config_key ON system_config(key);
CREATE INDEX idx_system_config_public ON system_config(is_public) WHERE is_public = TRUE;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Updated_at trigger function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_organizers_updated_at BEFORE UPDATE ON organizers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ticket_types_updated_at BEFORE UPDATE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------------------------
-- Event price range update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_event_price_range()
RETURNS TRIGGER AS $$
DECLARE
    target_event_id UUID;
BEGIN
    target_event_id := COALESCE(NEW.event_id, OLD.event_id);
    
    UPDATE events SET
        price_min = (
            SELECT MIN(price) 
            FROM ticket_types 
            WHERE event_id = target_event_id AND is_active = TRUE
        ),
        price_max = (
            SELECT MAX(price) 
            FROM ticket_types 
            WHERE event_id = target_event_id AND is_active = TRUE
        ),
        updated_at = NOW()
    WHERE id = target_event_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_types_price_range
    AFTER INSERT OR UPDATE OR DELETE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION update_event_price_range();

-- -----------------------------------------------------------------------------
-- Event attendee count update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
DECLARE
    target_event_id UUID;
BEGIN
    target_event_id := COALESCE(NEW.event_id, OLD.event_id);
    
    UPDATE events SET
        current_attendees = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE event_id = target_event_id AND status = 'CONFIRMED'
        ),
        updated_at = NOW()
    WHERE id = target_event_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_attendee_count
    AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- -----------------------------------------------------------------------------
-- Event like count update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_event_like_count()
RETURNS TRIGGER AS $$
DECLARE
    target_event_id UUID;
BEGIN
    target_event_id := COALESCE(NEW.event_id, OLD.event_id);
    
    UPDATE events SET
        like_count = (
            SELECT COUNT(*) 
            FROM user_likes 
            WHERE event_id = target_event_id
        ),
        updated_at = NOW()
    WHERE id = target_event_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_likes_count
    AFTER INSERT OR DELETE ON user_likes
    FOR EACH ROW EXECUTE FUNCTION update_event_like_count();

-- -----------------------------------------------------------------------------
-- Event review stats update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_event_review_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_event_id UUID;
BEGIN
    target_event_id := COALESCE(NEW.event_id, OLD.event_id);
    
    UPDATE events SET
        average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM event_reviews 
            WHERE event_id = target_event_id AND is_visible = TRUE
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM event_reviews 
            WHERE event_id = target_event_id AND is_visible = TRUE
        ),
        updated_at = NOW()
    WHERE id = target_event_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_reviews_stats
    AFTER INSERT OR UPDATE OR DELETE ON event_reviews
    FOR EACH ROW EXECUTE FUNCTION update_event_review_stats();

-- -----------------------------------------------------------------------------
-- Venue review stats update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_venue_review_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_venue_id UUID;
BEGIN
    target_venue_id := COALESCE(NEW.venue_id, OLD.venue_id);
    
    UPDATE venues SET
        average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM venue_reviews 
            WHERE venue_id = target_venue_id AND is_visible = TRUE
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM venue_reviews 
            WHERE venue_id = target_venue_id AND is_visible = TRUE
        ),
        updated_at = NOW()
    WHERE id = target_venue_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_venue_reviews_stats
    AFTER INSERT OR UPDATE OR DELETE ON venue_reviews
    FOR EACH ROW EXECUTE FUNCTION update_venue_review_stats();

-- -----------------------------------------------------------------------------
-- Artist follower count update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_artist_follower_count()
RETURNS TRIGGER AS $$
DECLARE
    target_artist_id UUID;
BEGIN
    target_artist_id := COALESCE(NEW.artist_id, OLD.artist_id);
    
    UPDATE artists SET
        follower_count = (
            SELECT COUNT(*) 
            FROM artist_followers 
            WHERE artist_id = target_artist_id
        ),
        updated_at = NOW()
    WHERE id = target_artist_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_artist_followers_count
    AFTER INSERT OR DELETE ON artist_followers
    FOR EACH ROW EXECUTE FUNCTION update_artist_follower_count();

-- -----------------------------------------------------------------------------
-- Chat room stats update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_chat_room_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'messages' THEN
        UPDATE chat_rooms SET
            message_count = message_count + 1,
            last_message_at = NEW.created_at,
            updated_at = NOW()
        WHERE id = NEW.chat_room_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_chat_stats
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_room_stats();

-- -----------------------------------------------------------------------------
-- Participant count update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_chat_participant_count()
RETURNS TRIGGER AS $$
DECLARE
    target_room_id UUID;
BEGIN
    target_room_id := COALESCE(NEW.chat_room_id, OLD.chat_room_id);
    
    UPDATE chat_rooms SET
        participant_count = (
            SELECT COUNT(*) 
            FROM chat_participants 
            WHERE chat_room_id = target_room_id AND left_at IS NULL
        ),
        updated_at = NOW()
    WHERE id = target_room_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_participants_count
    AFTER INSERT OR UPDATE OR DELETE ON chat_participants
    FOR EACH ROW EXECUTE FUNCTION update_chat_participant_count();

-- -----------------------------------------------------------------------------
-- Order number generation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'IW' || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
                        LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_number
    BEFORE INSERT ON orders
    FOR EACH ROW 
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- -----------------------------------------------------------------------------
-- QR code generation for tickets
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_ticket_qr()
RETURNS TRIGGER AS $$
BEGIN
    NEW.qr_code := 'TKT-' || REPLACE(NEW.id::TEXT, '-', '') || '-' || 
                   LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_qr
    BEFORE INSERT ON tickets
    FOR EACH ROW 
    WHEN (NEW.qr_code IS NULL)
    EXECUTE FUNCTION generate_ticket_qr();

-- ============================================================================
-- ROW LEVEL SECURITY (Supabase)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Users policies
-- -----------------------------------------------------------------------------
-- Users can read their own data
CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY users_update_own ON users
    FOR UPDATE USING (auth.uid() = id);

-- Public profiles (limited fields via API)
CREATE POLICY users_select_public ON users
    FOR SELECT USING (TRUE);

-- -----------------------------------------------------------------------------
-- Orders policies
-- -----------------------------------------------------------------------------
CREATE POLICY orders_select_own ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY orders_insert_own ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Tickets policies
-- -----------------------------------------------------------------------------
CREATE POLICY tickets_select_own ON tickets
    FOR SELECT USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Notifications policies
-- -----------------------------------------------------------------------------
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Messages policies
-- -----------------------------------------------------------------------------
CREATE POLICY messages_select_participant ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants
            WHERE chat_room_id = messages.chat_room_id
            AND user_id = auth.uid()
            AND left_at IS NULL
        )
    );

CREATE POLICY messages_insert_participant ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM chat_participants
            WHERE chat_room_id = messages.chat_room_id
            AND user_id = auth.uid()
            AND left_at IS NULL
        )
    );

-- -----------------------------------------------------------------------------
-- Friendships policies
-- -----------------------------------------------------------------------------
CREATE POLICY friendships_select_own ON friendships
    FOR SELECT USING (
        auth.uid() = requester_id OR auth.uid() = addressee_id
    );

CREATE POLICY friendships_insert_own ON friendships
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY friendships_update_own ON friendships
    FOR UPDATE USING (
        auth.uid() = requester_id OR auth.uid() = addressee_id
    );

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- User's accepted friends (both directions)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW user_friends AS
SELECT 
    CASE 
        WHEN requester_id = auth.uid() THEN addressee_id 
        ELSE requester_id 
    END as friend_id,
    responded_at as friends_since
FROM friendships
WHERE status = 'accepted'
AND (requester_id = auth.uid() OR addressee_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Active events (published, not past)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW active_events AS
SELECT *
FROM events
WHERE status = 'published'
AND start_date > NOW()
AND deleted_at IS NULL;

-- ============================================================================
-- SEED DATA (Categories)
-- ============================================================================

INSERT INTO categories (name, slug, description, sort_order) VALUES
('Konser', 'konser', 'Müzik konserleri ve canlı performanslar', 1),
('Festival', 'festival', 'Müzik festivalleri ve açık hava etkinlikleri', 2),
('Tiyatro', 'tiyatro', 'Tiyatro oyunları ve sahne sanatları', 3),
('Stand-up', 'stand-up', 'Stand-up komedi gösterileri', 4),
('Spor', 'spor', 'Spor etkinlikleri ve müsabakalar', 5),
('Konferans', 'konferans', 'Konferanslar ve seminerler', 6),
('Workshop', 'workshop', 'Atölye çalışmaları ve eğitimler', 7),
('Sergi', 'sergi', 'Sanat sergileri ve müze etkinlikleri', 8),
('Parti', 'parti', 'Gece kulübü ve parti etkinlikleri', 9),
('Çocuk', 'cocuk', 'Çocuk etkinlikleri', 10),
('Diğer', 'diger', 'Diğer etkinlikler', 99);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Ana kullanıcı tablosu - tüm kullanıcı tipleri';
COMMENT ON TABLE organizers IS 'Organizatör profilleri - users tablosuna bağlı';
COMMENT ON TABLE artists IS 'Sanatçı profilleri';
COMMENT ON TABLE venues IS 'Mekan bilgileri';
COMMENT ON TABLE events IS 'Etkinlikler - ana tablo';
COMMENT ON TABLE friendships IS 'Kullanıcı arkadaşlık ilişkileri';
COMMENT ON TABLE tickets IS 'Satın alınan biletler';
COMMENT ON TABLE orders IS 'Siparişler';
COMMENT ON TABLE chat_rooms IS 'Sohbet odaları';
COMMENT ON TABLE messages IS 'Sohbet mesajları';

-- ============================================================================
-- v3.0 UPDATES - January 2026
-- ============================================================================
-- Frontend gap analysis: 10 new features
-- - User Stories (24h posts)
-- - Ticket Gifting
-- - Reciprocal Media (chat)
-- - Addressing Style preference
-- - Natural Language Search support
-- ============================================================================

-- ============================================================================
-- NEW TABLES - User Stories Feature
-- ============================================================================

CREATE TABLE user_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Media
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('photo', 'video')),
  thumbnail_url TEXT,

  -- Metadata
  caption TEXT,
  location VARCHAR(255),

  -- Expiry (24 hours from creation)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Stats
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),

  -- Indexes
  CONSTRAINT user_stories_expires_at_check CHECK (expires_at > created_at)
);

CREATE INDEX idx_user_stories_user ON user_stories(user_id);
CREATE INDEX idx_user_stories_expires ON user_stories(expires_at) WHERE expires_at > NOW();

COMMENT ON TABLE user_stories IS 'User stories (24-hour posts) - Instagram-style ephemeral content';
COMMENT ON COLUMN user_stories.expires_at IS 'Auto-calculated: created_at + 24 hours';
COMMENT ON COLUMN user_stories.media_type IS 'photo or video';

-- ============================================================================

CREATE TABLE story_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(story_id, tagged_user_id)
);

CREATE INDEX idx_story_tags_story ON story_tags(story_id);
CREATE INDEX idx_story_tags_user ON story_tags(tagged_user_id);

COMMENT ON TABLE story_tags IS 'Users tagged in stories - only friends can be tagged';

-- ============================================================================

CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(story_id, viewer_user_id)
);

CREATE INDEX idx_story_views_story ON story_views(story_id);
CREATE INDEX idx_story_views_user ON story_views(viewer_user_id);

COMMENT ON TABLE story_views IS 'Story view tracking - only friends can view';

-- ============================================================================
-- UPDATES TO EXISTING TABLES
-- ============================================================================

-- Ticket Gifting Feature
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS gifted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS gifted_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS gifted_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS gift_message TEXT;

CREATE INDEX IF NOT EXISTS idx_tickets_gifted_by ON tickets(gifted_by) WHERE gifted_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_gifted_to ON tickets(gifted_to) WHERE gifted_to IS NOT NULL;

COMMENT ON COLUMN tickets.gifted_by IS 'User who gifted this ticket (NULL if not gifted)';
COMMENT ON COLUMN tickets.gifted_to IS 'User who received this ticket as gift';
COMMENT ON COLUMN tickets.gifted_at IS 'Timestamp when ticket was gifted';
COMMENT ON COLUMN tickets.gift_message IS 'Optional message from gifter';

-- ============================================================================

-- Reciprocal Media Feature (Chat)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS requires_reciprocation BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reciprocation_media_url TEXT;

COMMENT ON COLUMN messages.requires_reciprocation IS 'If TRUE, viewer must send media to unlock this media';
COMMENT ON COLUMN messages.reciprocation_media_url IS 'Media sent by viewer to unlock original media';

-- Helper function for reciprocal media visibility
CREATE OR REPLACE FUNCTION can_view_media(
  p_message_id UUID,
  p_viewer_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id UUID;
  v_requires_reciprocation BOOLEAN;
  v_reciprocated BOOLEAN;
BEGIN
  -- Get message details
  SELECT sender_id, requires_reciprocation
  INTO v_sender_id, v_requires_reciprocation
  FROM messages
  WHERE id = p_message_id;

  -- Sender can always view their own media
  IF v_sender_id = p_viewer_user_id THEN
    RETURN TRUE;
  END IF;

  -- If no reciprocation required, anyone can view
  IF NOT v_requires_reciprocation THEN
    RETURN TRUE;
  END IF;

  -- Check if viewer has sent reciprocal media
  SELECT EXISTS (
    SELECT 1 FROM messages
    WHERE chat_room_id = (SELECT chat_room_id FROM messages WHERE id = p_message_id)
    AND sender_id = p_viewer_user_id
    AND media_url IS NOT NULL
    AND created_at > (SELECT created_at FROM messages WHERE id = p_message_id)
    LIMIT 1
  ) INTO v_reciprocated;

  RETURN v_reciprocated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_view_media IS 'Check if user can view reciprocal media message';

-- ============================================================================

-- Addressing Style Preference (sen/siz)
-- This is stored in users.preferences JSONB field
-- Example: {"addressingStyle": "sen"} or {"addressingStyle": "siz"}
-- Migration: Set default to "sen" for existing users
UPDATE users
SET preferences = COALESCE(preferences, '{}'::jsonb) || '{"addressingStyle": "sen"}'::jsonb
WHERE preferences IS NULL OR preferences->>'addressingStyle' IS NULL;

COMMENT ON COLUMN users.preferences IS 'JSONB preferences including addressingStyle (sen/siz), notifications, etc.';

-- ============================================================================
-- NEW INDEXES FOR PERFORMANCE
-- ============================================================================

-- Full-text search for Natural Language Search feature
CREATE INDEX IF NOT EXISTS idx_events_fulltext_search ON events
USING GIN(to_tsvector('turkish', title || ' ' || COALESCE(description, '')));

COMMENT ON INDEX idx_events_fulltext_search IS 'Full-text search index for Turkish NLP search';

-- Profile visibility rule: "Only users who attended same event can see profiles"
CREATE INDEX IF NOT EXISTS idx_tickets_user_event ON tickets(user_id, event_id)
WHERE status = 'CONFIRMED';

COMMENT ON INDEX idx_tickets_user_event IS 'Profile visibility: Check if users attended same event';

-- Chat message performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_created ON messages(chat_room_id, created_at DESC)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_messages_chat_room_created IS 'Chat message listing performance';

-- ============================================================================
-- SUPABASE STORAGE CONFIGURATION
-- ============================================================================

-- Stories bucket configuration
-- This is managed via Supabase Dashboard or SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for stories bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own stories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stories' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Stories are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

COMMENT ON TABLE storage.buckets IS 'Supabase storage buckets - stories bucket for user posts';

-- ============================================================================
-- CRON JOB CONFIGURATION
-- ============================================================================

-- Story auto-deletion cron job
-- This is implemented as Supabase Edge Function
-- Runs hourly: "0 * * * *"
--
-- Deno.cron("delete-expired-stories", "0 * * * *", async () => {
--   const { data, error } = await supabaseAdmin
--     .from('user_stories')
--     .delete()
--     .lt('expires_at', new Date().toISOString());
--
--   console.log(`Deleted ${data?.length || 0} expired stories`);
-- });
--
-- Also deletes associated files from Supabase Storage

COMMENT ON TABLE user_stories IS 'User stories with 24h auto-deletion via Edge Function cron job';

-- ============================================================================
-- v3.0 SUMMARY
-- ============================================================================
-- NEW TABLES: 3 (user_stories, story_tags, story_views)
-- NEW COLUMNS: 8 (tickets +4, messages +2, users.preferences updated)
-- NEW INDEXES: 5 (stories, full-text, profile visibility, chat performance)
-- NEW STORAGE: 1 bucket (stories)
-- NEW FUNCTIONS: 1 (can_view_media)
-- NEW CRON JOBS: 1 (story cleanup - hourly)
-- ============================================================================

-- ============================================================================
-- END OF SCHEMA v3.0
-- ============================================================================
