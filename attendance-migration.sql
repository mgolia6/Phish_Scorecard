-- Phreezer: attendance table migration
-- Run in Neon SQL Editor

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_date DATE NOT NULL,
  venue VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  source VARCHAR(50) DEFAULT 'manual',
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, show_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_show_date ON attendance(show_date);
