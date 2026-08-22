-- =========================================================
-- WisataData API - Database Schema (PostgreSQL / Supabase)
-- =========================================================
-- Jalankan file ini di Supabase SQL Editor atau via `npm run migrate`

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1. USERS  -> akun developer/consumer yang login pakai JWT
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'developer'
                     CHECK (role IN ('developer', 'admin')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. API_KEYS -> setiap user bisa punya banyak API key
--    dipakai konsumen data untuk mengakses endpoint /api/v1/*
-- =========================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(100) NOT NULL DEFAULT 'Default Key',
    api_key         VARCHAR(64) UNIQUE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    daily_quota     INTEGER NOT NULL DEFAULT 1000,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);

-- =========================================================
-- 3. CATEGORIES -> kategori destinasi wisata (Pantai, Gunung, dst)
-- =========================================================
CREATE TABLE IF NOT EXISTS categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(60) UNIQUE NOT NULL,
    slug            VARCHAR(60) UNIQUE NOT NULL,
    description     TEXT
);

-- =========================================================
-- 4. DESTINATIONS -> data inti yang "dijual" lewat API (>= 50 baris)
-- =========================================================
CREATE TABLE IF NOT EXISTS destinations (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    slug            VARCHAR(160) UNIQUE NOT NULL,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    province        VARCHAR(80) NOT NULL,
    city            VARCHAR(80) NOT NULL,
    address         TEXT,
    description     TEXT,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    ticket_price    INTEGER NOT NULL DEFAULT 0,      -- dalam Rupiah
    rating          NUMERIC(2,1) NOT NULL DEFAULT 0,  -- 0.0 - 5.0
    opening_hours   VARCHAR(60),
    facilities      TEXT[],                           -- array fasilitas, contoh: {Parkir,Toilet,Musholla}
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    image_url       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category_id);
CREATE INDEX IF NOT EXISTS idx_destinations_province ON destinations(province);
CREATE INDEX IF NOT EXISTS idx_destinations_rating ON destinations(rating);

-- =========================================================
-- 5. API_USAGE_LOGS -> log tiap request yang masuk lewat API key
--    (bukti pemakaian data + dasar analytics/rate-limit)
-- =========================================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id              BIGSERIAL PRIMARY KEY,
    api_key_id      UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint        VARCHAR(150) NOT NULL,
    method          VARCHAR(10)  NOT NULL,
    status_code     INTEGER,
    ip_address      VARCHAR(64),
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_requested_at ON api_usage_logs(requested_at);

-- =========================================================
-- Trigger sederhana untuk auto update `updated_at`
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_destinations_updated_at ON destinations;
CREATE TRIGGER trg_destinations_updated_at BEFORE UPDATE ON destinations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
