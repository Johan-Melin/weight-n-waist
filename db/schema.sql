-- Run this against your Neon database to set up the schema.
-- Each app built from this template should extend this file with its own tables.

CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  email        TEXT        UNIQUE NOT NULL,
  password_hash TEXT       NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Add app-specific tables below this line.

CREATE TABLE IF NOT EXISTS measurements (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measured_at  DATE        NOT NULL DEFAULT CURRENT_DATE,
  weight_kg    NUMERIC(5,2),
  waist_cm     NUMERIC(5,2),
  created_at   TIMESTAMPTZ DEFAULT now(),
  CHECK (weight_kg IS NOT NULL OR waist_cm IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS measurements_user_date ON measurements(user_id, measured_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_system TEXT NOT NULL DEFAULT 'metric'
  CHECK (unit_system IN ('metric', 'imperial'));
