-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Duties table
CREATE TABLE IF NOT EXISTS duties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    duty_date DATE NOT NULL,
    duty_type VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, duty_date, duty_type)
);

-- Duty swap requests
CREATE TABLE IF NOT EXISTS duty_swaps (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    requested_with_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    requester_duty_id INTEGER REFERENCES duties(id) ON DELETE CASCADE,
    requested_duty_id INTEGER REFERENCES duties(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, cancelled
    reason TEXT,
    requester_approved BOOLEAN DEFAULT TRUE,
    requested_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar subscriptions
CREATE TABLE IF NOT EXISTS calendar_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    include_all_duties BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_duties_date ON duties(duty_date);
CREATE INDEX idx_duties_user ON duties(user_id);
CREATE INDEX idx_swaps_requester ON duty_swaps(requester_id);
CREATE INDEX idx_swaps_requested ON duty_swaps(requested_with_id);
CREATE INDEX idx_swaps_status ON duty_swaps(status);