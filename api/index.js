require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import modules
const db = require('../db');
const { verifyToken, registerUser, loginUser, getUserById, updateUserProfile } = require('../auth');
const { fetchAllShows, fetchSetlist, searchShows, getRandomShow } = require('../phishnet-api');
const { saveRatings, getRatingsForShow, getShowAggregate, getUserShowRatings, getSongStats, getVenueStats, updateSongStatistics } = require('../ratings-service');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.userId = decoded.userId;
  next();
}

// ============ AUTH ROUTES ============

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await registerUser(username, email, password, firstName, lastName);
    const token = require('../auth').generateToken(user.id);

    res.json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Get current user
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
app.put('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, avatarUrl } = req.body;
    const updated = await updateUserProfile(req.userId, { firstName, lastName, avatarUrl });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PHISH.NET API ROUTES ============

// Get all shows
app.get('/shows', async (req, res) => {
  try {
    const shows = await fetchAllShows();
    res.json(shows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search shows
app.get('/shows/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    const results = await searchShows(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random show
app.get('/shows/random', async (req, res) => {
  try {
    const show = await getRandomShow();
    res.json(show);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get setlist for a show
app.get('/shows/:date/setlist', async (req, res) => {
  try {
    const { date } = req.params;
    const setlist = await fetchSetlist(date);
    res.json(setlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RATINGS ROUTES ============

// Save ratings for a show
app.post('/ratings/:showDate', authenticateToken, async (req, res) => {
  try {
    const { showDate } = req.params;
    const { ratings, showDetails } = req.body;

    if (!ratings || !Array.isArray(ratings)) {
      return res.status(400).json({ error: 'Invalid ratings data' });
    }

    await saveRatings(req.userId, showDate, ratings, showDetails);
    await updateSongStatistics();

    res.json({ success: true, message: 'Ratings saved' });
  } catch (error) {
    console.error('Error saving ratings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get ratings for a show
app.get('/ratings/:showDate', authenticateToken, async (req, res) => {
  try {
    const { showDate } = req.params;
    const ratings = await getRatingsForShow(req.userId, showDate);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get show aggregate
app.get('/shows/:showDate/aggregate', authenticateToken, async (req, res) => {
  try {
    const { showDate } = req.params;
    const aggregate = await getShowAggregate(req.userId, showDate);
    res.json(aggregate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's show ratings
app.get('/user/shows', authenticateToken, async (req, res) => {
  try {
    const shows = await getUserShowRatings(req.userId);
    res.json(shows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ANALYTICS ROUTES ============

// Get song statistics
app.get('/analytics/songs', async (req, res) => {
  try {
    const { song } = req.query;
    const stats = await getSongStats(song);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get venue statistics
app.get('/analytics/venues', async (req, res) => {
  try {
    const { venue } = req.query;
    const stats = await getVenueStats(venue);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Export for Vercel
module.exports = app;

// Also export as default for serverless
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
