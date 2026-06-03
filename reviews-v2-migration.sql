-- Drop old constraint, add reviewid as unique key
-- Run in Neon SQL Editor

ALTER TABLE user_reviews DROP CONSTRAINT IF EXISTS user_reviews_user_id_show_date_key;
ALTER TABLE user_reviews ADD COLUMN IF NOT EXISTS phishnet_review_id BIGINT;
ALTER TABLE user_reviews ADD UNIQUE (user_id, phishnet_review_id);

-- Add index on show_date for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_show ON user_reviews(user_id, show_date);
