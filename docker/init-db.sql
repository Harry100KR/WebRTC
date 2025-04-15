-- Create the database and user
CREATE USER webrtc_user WITH PASSWORD 'webrtc_password';
CREATE DATABASE webrtc_db;
GRANT ALL PRIVILEGES ON DATABASE webrtc_db TO webrtc_user;

-- Connect to the new database
\c webrtc_db

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counselor_id UUID REFERENCES users(id),
    client_id UUID REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    room_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    sender_id UUID REFERENCES users(id),
    message_text TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session Notes table
CREATE TABLE session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    counselor_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recordings table
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    recording_type VARCHAR(50),
    storage_path VARCHAR(255) NOT NULL,
    duration INTEGER,
    file_size BIGINT,
    encrypted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recording Access Logs table
CREATE TABLE recording_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID REFERENCES recordings(id),
    user_id UUID REFERENCES users(id),
    access_type VARCHAR(50),
    ip_address VARCHAR(45),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recording Consent table
CREATE TABLE recording_consent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    user_id UUID REFERENCES users(id),
    consent_type VARCHAR(50),
    consented BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    consent_ip VARCHAR(45)
);

-- Grant all privileges on all tables to webrtc_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO webrtc_user; 