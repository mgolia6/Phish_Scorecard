const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './phish_scorecard.db';
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Show ratings table (individual song ratings)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      show_date TEXT NOT NULL,
      song_name TEXT NOT NULL,
      set_number TEXT,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      notes TEXT,
      is_jam_chart INTEGER DEFAULT 0,
      gap TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, show_date, song_name)
    )
  `);

  // Show aggregates table (overall show ratings)
  db.exec(`
    CREATE TABLE IF NOT EXISTS show_aggregates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      show_date TEXT NOT NULL,
      venue TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      overall_rating REAL,
      set_ratings TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, show_date)
    )
  `);

  // Song statistics cache (for analytics)
  db.exec(`
    CREATE TABLE IF NOT EXISTS song_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_name TEXT UNIQUE NOT NULL,
      total_ratings INTEGER DEFAULT 0,
      average_rating REAL,
      times_played INTEGER DEFAULT 0,
      times_jam_charted INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Venue statistics cache (for analytics)
  db.exec(`
    CREATE TABLE IF NOT EXISTS venue_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue TEXT NOT NULL,
      city TEXT,
      state TEXT,
      country TEXT,
      total_shows INTEGER DEFAULT 0,
      average_rating REAL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(venue, city, state, country)
    )
  `);

  console.log('Database initialized successfully');
}

// Run migrations
initializeDatabase();

module.exports = db;
