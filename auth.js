const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const SALT_ROUNDS = 10;

// Hash password
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Register user
async function registerUser(username, email, password, firstName, lastName) {
  try {
    const passwordHash = await hashPassword(password);
    
    const stmt = db.prepare(
      `INSERT INTO users (username, email, password_hash, first_name, last_name) 
       VALUES (?, ?, ?, ?, ?)`
    );
    
    const result = stmt.run(username, email, passwordHash, firstName || '', lastName || '');
    
    return { 
      id: result.lastInsertRowid, 
      username, 
      email 
    };
  } catch (error) {
    throw new Error(error.message.includes('UNIQUE') ? 'Username or email already exists' : error.message);
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const stmt = db.prepare(
      `SELECT id, email, username, password_hash FROM users WHERE email = ?`
    );
    
    const user = stmt.get(email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid password');
    }
    
    const token = generateToken(user.id);
    return { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      token 
    };
  } catch (error) {
    throw error;
  }
}

// Get user by ID
function getUserById(userId) {
  try {
    const stmt = db.prepare(
      `SELECT id, username, email, first_name, last_name, avatar_url, created_at 
       FROM users WHERE id = ?`
    );
    
    return stmt.get(userId);
  } catch (error) {
    throw error;
  }
}

// Update user profile
function updateUserProfile(userId, updates) {
  try {
    const { firstName, lastName, avatarUrl } = updates;
    
    const stmt = db.prepare(
      `UPDATE users SET first_name = ?, last_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    );
    
    stmt.run(firstName || '', lastName || '', avatarUrl || '', userId);
    
    return { id: userId, ...updates };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile
};
