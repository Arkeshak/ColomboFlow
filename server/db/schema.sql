-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create Enums
CREATE TYPE user_role AS ENUM('commuter','admin','parking_op','analyst');
CREATE TYPE booking_status AS ENUM('pending','confirmed','used','cancelled');

-- Create Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    role user_role,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE traffic_readings (
    time TIMESTAMPTZ NOT NULL,
    road_segment_id UUID,
    speed_kmh DECIMAL(5,2),
    congestion_level INT, -- 1(clear) to 5(standstill)
    incident_type VARCHAR(50), -- accident/closure/jam
    source VARCHAR(20), -- waze/user_report
    geom GEOMETRY(LINESTRING, 4326)
);

-- Make traffic_readings a hypertable
SELECT create_hypertable('traffic_readings', by_range('time'));

CREATE TABLE parking_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150),
    operator_id UUID REFERENCES users(id),
    location GEOGRAPHY(POINT, 4326),
    total_slots INT,
    available_slots INT,
    price_per_hour DECIMAL(8,2),
    is_covered BOOLEAN,
    stripe_account_id VARCHAR(255),
    has_ev BOOLEAN DEFAULT false,
    ev_total INT DEFAULT 0,
    ev_available INT DEFAULT 0
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50), -- accident, protest, flood
    location GEOGRAPHY(POINT, 4326),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parking_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    lot_id UUID REFERENCES parking_lots(id),
    slot_number INT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    qr_code VARCHAR(500),
    stripe_payment_id VARCHAR(255),
    status booking_status
);
