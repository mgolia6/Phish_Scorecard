// Vercel serverless function for auth endpoint
import crypto from 'crypto';

// Simple in-memory user store (resets on deployment)
const users = new Map();
const tokens = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const path = req.url.split('?')[0];

    // GET /api/auth/me - Get current user
    if (req.method === 'GET' && path === '/api/auth/me') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.slice(7);
      const userId = tokens.get(token);

      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = users.get(userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      });
    }

    // POST /api/auth/signup - Create new user
    if (req.method === 'POST' && path === '/api/auth/signup') {
      const { username, email, password, firstName, lastName } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user exists
      for (const user of users.values()) {
        if (user.email === email || user.username === username) {
          return res.status(409).json({ error: 'User already exists' });
        }
      }

      // Create new user
      const userId = crypto.randomUUID();
      const user = {
        id: userId,
        username,
        email,
        password: hashPassword(password),
        first_name: firstName || '',
        last_name: lastName || '',
        created_at: new Date().toISOString()
      };

      users.set(userId, user);

      // Generate token
      const token = generateToken();
      tokens.set(token, userId);

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    }

    // POST /api/auth/login - Login user
    if (req.method === 'POST' && path === '/api/auth/login') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      // Find user by email
      let user = null;
      for (const u of users.values()) {
        if (u.email === email) {
          user = u;
          break;
        }
      }

      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken();
      tokens.set(token, user.id);

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    }

    // PUT /api/auth/profile - Update profile
    if (req.method === 'PUT' && path === '/api/auth/profile') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.slice(7);
      const userId = tokens.get(token);

      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = users.get(userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { firstName, lastName } = req.body;
      if (firstName) user.first_name = firstName;
      if (lastName) user.last_name = lastName;

      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
}
