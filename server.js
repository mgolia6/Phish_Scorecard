import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pkg from 'pg';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import NodeCache from 'node-cache';

const { Pool } = pkg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/phish_scorecard'
});

// JWT middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, username, password, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, username, first_name, last_name',
      [email, username, hashedPassword, firstName || '', lastName || '']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret');

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret');
    res.json({ token, user: { id: user.id, email: user.email, username: user.username, first_name: user.first_name, last_name: user.last_name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, username, first_name, last_name FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PHISH.NET API ROUTES
// ============================================

async function fetchPhishNetShows() {
  const cacheKey = 'phish_shows';
  let shows = cache.get(cacheKey);
  
  if (shows) return shows;

  try {
    const response = await axios.get('https://api.phish.net/v5/shows/artist/phish?limit=500');
    shows = response.data.data || [];
    cache.set(cacheKey, shows);
    return shows;
  } catch (error) {
    console.error('Error fetching shows:', error);
    return [];
  }
}

app.get('/api/shows', async (req, res) => {
  try {
    const shows = await fetchPhishNetShows();
    res.json(shows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shows/search', async (req, res) => {
  try {
    const { q } = req.query;
    const shows = await fetchPhishNetShows();
    
    if (!q) return res.json(shows);

    const filtered = shows.filter(show =>
      show.showdate.includes(q) ||
      (show.venue && show.venue.toLowerCase().includes(q.toLowerCase())) ||
      (show.city && show.city.toLowerCase().includes(q.toLowerCase()))
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shows/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const response = await axios.get(`https://api.phish.net/v5/shows/${date}`);
    res.json(response.data.data);
  } catch (error) {
    res.status(500).json({ error: 'Show not found' });
  }
});

// ============================================
// RATINGS ROUTES
// ============================================

app.post('/api/ratings/:showDate', verifyToken, async (req, res) => {
  try {
    const { showDate } = req.params;
    const { ratings, showDetails } = req.body;

    // Store show if not exists
    await pool.query(
      `INSERT INTO shows (show_date, venue, city, state, country) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (show_date) DO NOTHING`,
      [showDate, showDetails.venue, showDetails.city, showDetails.state, showDetails.country]
    );

    // Store ratings
    for (const rating of ratings) {
      await pool.query(
        `INSERT INTO ratings (user_id, show_date, song_name, set_number, rating, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, show_date, song_name) DO UPDATE SET rating = $5, notes = $6`,
        [req.user.id, showDate, rating.song, rating.set, rating.rating || null, rating.notes || '']
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ratings/:showDate', verifyToken, async (req, res) => {
  try {
    const { showDate } = req.params;
    const result = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND show_date = $2',
      [req.user.id, showDate]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/shows', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT show_date, venue, city, state, country, 
              AVG(rating) as overall_rating, COUNT(*) as song_count
       FROM ratings r
       JOIN shows s ON r.show_date = s.show_date
       WHERE r.user_id = $1
       GROUP BY show_date, venue, city, state, country
       ORDER BY show_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

app.get('/api/analytics/songs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT song_name, AVG(rating) as average_rating, COUNT(*) as total_ratings
       FROM ratings WHERE rating IS NOT NULL
       GROUP BY song_name
       ORDER BY average_rating DESC, total_ratings DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/venues', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT venue, city, state, AVG(r.rating) as average_rating, COUNT(DISTINCT r.show_date) as total_shows
       FROM ratings r
       JOIN shows s ON r.show_date = s.show_date
       WHERE r.rating IS NOT NULL
       GROUP BY venue, city, state
       ORDER BY average_rating DESC, total_shows DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SERVE REACT APP
// ============================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
