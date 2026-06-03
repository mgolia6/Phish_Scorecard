-- Phreezer: user_reviews table migration
-- Run in Neon SQL Editor

CREATE TABLE IF NOT EXISTS user_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_date DATE NOT NULL,
  phishnet_score NUMERIC(4,2),
  review_text TEXT,
  posted_date DATE,
  source VARCHAR(50) DEFAULT 'phishnet',
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, show_date)
);

CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_show_date ON user_reviews(show_date);
