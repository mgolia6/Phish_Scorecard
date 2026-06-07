import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

let migrated = false;
async function ensureMigration(pool) {
  if (migrated) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_show_attendance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        show_date DATE NOT NULL REFERENCES shows(show_date) ON DELETE CASCADE,
        attendance_type VARCHAR(20) NOT NULL DEFAULT 'listened'
          CHECK (attendance_type IN ('attended', 'webcast', 'listened')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, show_date)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON user_show_attendance(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_show_date ON user_show_attendance(show_date)`);

    // Add song_position column if it doesn't exist
    await pool.query(`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS song_position INTEGER`);

    migrated = true;
  } catch (err) {
    console.error('Migration error (non-fatal):', err.message);
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { showDate } = req.query;
  if (!showDate) return res.status(400).json({ error: 'Show date required' });

  const pool = getPool();
  await ensureMigration(pool);

  if (req.method === 'GET') {
    try {
      const [ratingsResult, attendanceResult, importedAttendance] = await Promise.all([
        pool.query(
          'SELECT * FROM ratings WHERE user_id = $1 AND show_date = $2 ORDER BY set_number, song_position, id',
          [user.id, showDate]
        ),
        pool.query(
          'SELECT attendance_type FROM user_show_attendance WHERE user_id = $1 AND show_date = $2',
          [user.id, showDate]
        ),
        pool.query(
          'SELECT 1 FROM attendance WHERE user_id = $1 AND show_date = $2 LIMIT 1',
          [user.id, showDate]
        ),
      ]);

      let attendance_type = attendanceResult.rows[0]?.attendance_type || null;
      if (!attendance_type && importedAttendance.rows.length > 0) {
        attendance_type = 'attended';
      }

      return res.json({
        ratings: ratingsResult.rows,
        attendance_type,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { ratings, showDetails, attendance_type } = req.body;

    if (!ratings || !Array.isArray(ratings)) {
      return res.status(400).json({ error: 'ratings array required' });
    }

    const validAttendance = ['attended', 'webcast', 'listened'];
    const attendanceType = validAttendance.includes(attendance_type) ? attendance_type : 'listened';

    try {
      await pool.query(
        `INSERT INTO shows (show_date, venue, city, state, country)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (show_date) DO NOTHING`,
        [showDate, showDetails?.venue, showDetails?.city, showDetails?.state, showDetails?.country]
      );

      await pool.query(
        `INSERT INTO user_show_attendance (user_id, show_date, attendance_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, show_date)
         DO UPDATE SET attendance_type = $3, updated_at = NOW()`,
        [user.id, showDate, attendanceType]
      );

      for (const r of ratings) {
        if (!r.song || r.rating == null) continue;
        const position = r.position ?? null;

        if (position != null) {
          // Upsert by position — handles sandwiched/reprised songs correctly
          await pool.query(
            `INSERT INTO ratings (user_id, show_date, song_name, set_number, song_position, rating, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id, show_date, song_name)
             DO UPDATE SET rating = $6, notes = $7, song_position = $5, updated_at = NOW()`,
            [user.id, showDate, r.song, r.set || null, position, r.rating, r.notes || '']
          );
        } else {
          // Legacy fallback — no position provided
          await pool.query(
            `INSERT INTO ratings (user_id, show_date, song_name, set_number, rating, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, show_date, song_name)
             DO UPDATE SET rating = $5, notes = $6, updated_at = NOW()`,
            [user.id, showDate, r.song, r.set || null, r.rating, r.notes || '']
          );
        }
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('Ratings error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
