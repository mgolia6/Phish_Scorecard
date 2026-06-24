// Shared AI usage logger — fire and forget, never blocks responses
// Table: ai_usage_log (lazy created)

import { getPool } from './_db.js';

// Anthropic pricing (USD per million tokens) — verified against Claude API
// pricing reference. Update if pricing changes.
const PRICING = {
  'claude-sonnet-4-6':          { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5':           { input: 1.00,  output: 5.00  },
  'claude-haiku-4-5-20251001':  { input: 1.00,  output: 5.00  },
};

function estimateCost(model, inputTokens, outputTokens) {
  const p = PRICING[model];
  if (!p) {
    // Unknown model — log so usage isn't silently under-counted at $0.
    console.warn(`AI usage: no pricing for model "${model}" — cost logged as 0`);
    return 0;
  }
  return ((inputTokens / 1_000_000) * p.input) + ((outputTokens / 1_000_000) * p.output);
}

async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_usage_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      feature VARCHAR(64) NOT NULL,
      model VARCHAR(64) NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_log(created_at)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log(feature)`);
}

/**
 * Log an AI API call. Fire and forget — catch errors silently.
 * @param {{ userId?: number, feature: string, model: string, inputTokens: number, outputTokens: number }} opts
 */
let _tableEnsured = false;

export async function logAiUsage({ userId = null, feature, model, inputTokens, outputTokens }) {
  // Non-blocking — runs after response is sent, never delays user
  Promise.resolve().then(async () => {
    try {
      const pool = getPool();
      if (!_tableEnsured) {
        await ensureTable(pool);
        _tableEnsured = true;
      }
      const cost = estimateCost(model, inputTokens, outputTokens);
      await pool.query(
        `INSERT INTO ai_usage_log (user_id, feature, model, input_tokens, output_tokens, cost_usd)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId || null, feature, model, inputTokens, outputTokens, cost]
      );
    } catch (err) {
      // Truly fire and forget — log but never surface
      console.error('AI usage log failed (non-fatal):', err.message);
    }
  });
}
