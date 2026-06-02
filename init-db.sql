-- Phishow Scorecard — Database Schema
-- Run this in Neon SQL Editor (or via psql against POSTGRES_URL)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shows (
  id SERIAL PRIMARY KEY,
  show_date DATE UNIQUE NOT NULL,
  venue VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_date DATE NOT NULL REFERENCES shows(show_date) ON DELETE CASCADE,
  song_name VARCHAR(255) NOT NULL,
  set_number VARCHAR(10),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, show_date, song_name)
);

CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_show_date ON ratings(show_date);
CREATE INDEX IF NOT EXISTS idx_shows_show_date ON shows(show_date);
