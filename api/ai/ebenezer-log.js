import { getPool } from '../_db.js';

let tableReady = false;

async function ensureTable(pool) {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ebenezer_log (
      id SERIAL PRIMARY KEY,
      intent VARCHAR(32),
      era VARCHAR(32),
      vibe_keywords TEXT,
      message_length INTEGER,
      response_length INTEGER,
      moderation_flagged BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  tableReady = true;
}

export async function logEbenezerConversation({ intent, era, vibeKeywords, messageLength, responseLength, flagged = false }) {
  // Fully anonymous -- no user_id, no message text, no response text
  // Only metadata: intent type, era, vibe keywords matched, lengths
  Promise.resolve().then(async () => {
    try {
      const pool = getPool();
      await ensureTable(pool);
      await pool.query(`
        INSERT INTO ebenezer_log (intent, era, vibe_keywords, message_length, response_length, moderation_flagged)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        intent || 'general',
        era || null,
        vibeKeywords?.join(',') || null,
        messageLength || 0,
        responseLength || 0,
        flagged || false,
      ]);
    } catch (_) {}
  });
}
