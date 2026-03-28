-- WBF Registration Database Schema
-- Run this in Cloudflare D1 console to initialize the database

CREATE TABLE IF NOT EXISTS players (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name          TEXT NOT NULL,
  family_name         TEXT NOT NULL,
  gender              TEXT,
  date_of_birth       TEXT,
  country_of_birth    TEXT,
  country_of_residence TEXT,
  email               TEXT,
  phone               TEXT,
  nbo_code            TEXT,
  photo_url           TEXT,
  wbf_form_signed     INTEGER DEFAULT 0,
  wbf_form_date       TEXT,
  ebl_form_signed     INTEGER DEFAULT 0,
  ebl_form_date       TEXT,
  minor_form_signed   INTEGER DEFAULT 0,
  minor_form_date     TEXT,
  minor_guardian_name TEXT,
  is_minor            INTEGER DEFAULT 0,
  registered_at       TEXT DEFAULT (datetime('now')),
  registration_source TEXT DEFAULT 'web_form'
);

CREATE INDEX IF NOT EXISTS idx_email       ON players(email);
CREATE INDEX IF NOT EXISTS idx_family_name ON players(family_name);
CREATE INDEX IF NOT EXISTS idx_registered  ON players(registered_at);
