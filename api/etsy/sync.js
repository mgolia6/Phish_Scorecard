// GET /api/etsy/sync
// Pulls transaction counts for Phreezer listings from Etsy API,
// updates donation_tracker with total items sold.
// Called by daily cron or manually from admin.
// Auth: CRON_SECRET header or admin JWT.

import { verifyToken, cors } from '../_auth.js';
import { getPool } from '../_db.js';

// Phreezer Etsy listing IDs
const LISTING_IDS = [
  '4521118995', // Phreezer logo bumper sticker
  '4521116067', // Phreezer logo t-shirt
  '4521316287', // Don't Suck at Phish bumper sticker
];

const DONATION_PER_ITEM = 1.00;

async function getToken(pool) {
  const result = await pool.query('SELECT access_token, shop_id FROM etsy_tokens WHERE id = 1');
  if (!result.rows.length) throw new Error('Etsy not connected — visit /api/etsy/auth to authorize');
  return result.rows[0];
}

async function getReceiptCount(apiKey, accessToken, shopId, listingId) {
  // Get receipts (orders) for a specific listing
  const res = await fetch(
    `https://openapi.etsy.com/v3/application/shops/${shopId}/receipts?limit=100&was_paid=true`,
    {
      headers: {
        'x-api-key': apiKey,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Etsy API error for listing ${listingId}: ${err}`);
  }
  const data = await res.json();

  // Count items matching our listing IDs across all receipts
  let count = 0;
  for (const receipt of (data.results || [])) {
    for (const transaction of (receipt.transactions || [])) {
      if (LISTING_IDS.includes(String(transaction.listing_id))) {
        count += transaction.quantity || 1;
      }
    }
  }
  return count;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth — cron secret or admin JWT
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const user = verifyToken(req);
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  const isAdmin = user?.is_admin;

  if (!isCron && !isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const pool = getPool();

  try {
    const { access_token, shop_id } = await getToken(pool);
    const { ETSY_API_KEY } = process.env;

    // Get all receipts and count items sold across our listings
    const res2 = await fetch(
      `https://openapi.etsy.com/v3/application/shops/${shop_id}/receipts?limit=100&was_paid=true`,
      {
        headers: {
          'x-api-key': ETSY_API_KEY,
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!res2.ok) {
      const err = await res2.text();
      throw new Error(`Etsy API error: ${err}`);
    }

    const data = await res2.json();
    let totalItemsSold = 0;

    for (const receipt of (data.results || [])) {
      for (const transaction of (receipt.transactions || [])) {
        if (LISTING_IDS.includes(String(transaction.listing_id))) {
          totalItemsSold += transaction.quantity || 1;
        }
      }
    }

    // Update donation tracker
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donation_tracker (
        id SERIAL PRIMARY KEY,
        items_sold INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      INSERT INTO donation_tracker (id, items_sold, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE SET items_sold = $1, updated_at = NOW()
    `, [totalItemsSold]);

    const total_donated = (totalItemsSold * DONATION_PER_ITEM).toFixed(2);

    res.json({
      ok: true,
      items_sold: totalItemsSold,
      total_donated,
      receipts_checked: (data.results || []).length,
    });

  } catch (err) {
    console.error('Etsy sync error:', err);
    res.status(500).json({ error: err.message });
  }
}
