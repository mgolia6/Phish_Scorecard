const db = require('./db');

// Save individual song ratings
function saveRatings(userId, showDate, ratings, showDetails) {
  try {
    // First, delete existing ratings for this show/user
    const deleteStmt = db.prepare(
      `DELETE FROM ratings WHERE user_id = ? AND show_date = ?`
    );
    deleteStmt.run(userId, showDate);

    // Insert new ratings
    const insertStmt = db.prepare(
      `INSERT INTO ratings (user_id, show_date, song_name, set_number, rating, notes, is_jam_chart, gap)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    ratings.forEach(rating => {
      insertStmt.run(
        userId,
        showDate,
        rating.song || rating.song_name,
        rating.set,
        rating.rating || null,
        rating.notes || '',
        rating.jamChart ? 1 : 0,
        rating.gap || ''
      );
    });

    // Update show aggregate
    calculateAndSaveShowAggregate(userId, showDate, showDetails);
    
    return { success: true };
  } catch (error) {
    throw error;
  }
}

// Calculate and save show aggregate rating
function calculateAndSaveShowAggregate(userId, showDate, showDetails) {
  try {
    // Get all ratings for this show
    const getRatingsStmt = db.prepare(
      `SELECT rating, set_number FROM ratings WHERE user_id = ? AND show_date = ?`
    );
    const ratings = getRatingsStmt.all(userId, showDate);

    // Calculate overall and set-by-set averages
    let overallRating = null;
    const setRatings = {};

    if (ratings.length > 0) {
      const totalRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
      overallRating = totalRating / ratings.length;

      // Group by set
      ratings.forEach(r => {
        if (!setRatings[r.set_number]) {
          setRatings[r.set_number] = [];
        }
        if (r.rating) {
          setRatings[r.set_number].push(r.rating);
        }
      });

      // Calculate set averages
      Object.keys(setRatings).forEach(set => {
        const setTotal = setRatings[set].reduce((a, b) => a + b, 0);
        setRatings[set] = setTotal / setRatings[set].length;
      });
    }

    // Upsert show aggregate
    const upsertStmt = db.prepare(
      `INSERT INTO show_aggregates (user_id, show_date, venue, city, state, country, overall_rating, set_ratings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, show_date) DO UPDATE SET
       overall_rating = excluded.overall_rating,
       set_ratings = excluded.set_ratings,
       updated_at = CURRENT_TIMESTAMP`
    );

    upsertStmt.run(
      userId,
      showDate,
      showDetails?.venue || '',
      showDetails?.city || '',
      showDetails?.state || '',
      showDetails?.country || '',
      overallRating,
      JSON.stringify(setRatings)
    );

    return { overallRating, setRatings };
  } catch (error) {
    throw error;
  }
}

// Get ratings for a specific show
function getRatingsForShow(userId, showDate) {
  try {
    const stmt = db.prepare(
      `SELECT * FROM ratings WHERE user_id = ? AND show_date = ? ORDER BY set_number, rowid`
    );
    return stmt.all(userId, showDate) || [];
  } catch (error) {
    throw error;
  }
}

// Get show aggregate
function getShowAggregate(userId, showDate) {
  try {
    const stmt = db.prepare(
      `SELECT * FROM show_aggregates WHERE user_id = ? AND show_date = ?`
    );
    const row = stmt.get(userId, showDate);
    
    if (row && row.set_ratings) {
      row.set_ratings = JSON.parse(row.set_ratings);
    }
    
    return row;
  } catch (error) {
    throw error;
  }
}

// Get all shows rated by user
function getUserShowRatings(userId, limit = 100) {
  try {
    const stmt = db.prepare(
      `SELECT * FROM show_aggregates WHERE user_id = ? ORDER BY show_date DESC LIMIT ?`
    );
    const rows = stmt.all(userId, limit) || [];
    
    rows.forEach(row => {
      if (row.set_ratings) {
        row.set_ratings = JSON.parse(row.set_ratings);
      }
    });
    
    return rows;
  } catch (error) {
    throw error;
  }
}

// Get song statistics (global)
function getSongStats(songName = null) {
  try {
    let stmt;
    if (songName) {
      stmt = db.prepare(`SELECT * FROM song_stats WHERE song_name = ?`);
      return [stmt.get(songName)].filter(Boolean);
    } else {
      stmt = db.prepare(`SELECT * FROM song_stats ORDER BY average_rating DESC`);
      return stmt.all() || [];
    }
  } catch (error) {
    throw error;
  }
}

// Get venue statistics (global)
function getVenueStats(venue = null) {
  try {
    let stmt;
    if (venue) {
      stmt = db.prepare(`SELECT * FROM venue_stats WHERE venue = ?`);
      return [stmt.get(venue)].filter(Boolean);
    } else {
      stmt = db.prepare(`SELECT * FROM venue_stats ORDER BY average_rating DESC`);
      return stmt.all() || [];
    }
  } catch (error) {
    throw error;
  }
}

// Update song statistics (call after ratings are saved)
function updateSongStatistics() {
  try {
    // Clear existing stats
    db.exec(`DELETE FROM song_stats`);

    // Recalculate from ratings
    const getStatsStmt = db.prepare(
      `SELECT song_name, COUNT(*) as total_ratings, AVG(rating) as average_rating,
              SUM(CASE WHEN is_jam_chart = 1 THEN 1 ELSE 0 END) as times_jam_charted
       FROM ratings WHERE rating IS NOT NULL
       GROUP BY song_name
       ORDER BY average_rating DESC`
    );

    const rows = getStatsStmt.all();

    const insertStmt = db.prepare(
      `INSERT INTO song_stats (song_name, total_ratings, average_rating, times_jam_charted, last_updated)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
    );

    rows.forEach(row => {
      insertStmt.run(row.song_name, row.total_ratings, row.average_rating, row.times_jam_charted);
    });

    return { updated: rows.length };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  saveRatings,
  calculateAndSaveShowAggregate,
  getRatingsForShow,
  getShowAggregate,
  getUserShowRatings,
  getSongStats,
  getVenueStats,
  updateSongStatistics
};
