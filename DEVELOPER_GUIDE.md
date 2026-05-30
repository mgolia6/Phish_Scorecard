# Phish Scorecard - Developer Guide

A comprehensive guide for developers working with the Phish Scorecard codebase.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Backend Development](#backend-development)
5. [Frontend Development](#frontend-development)
6. [Database Management](#database-management)
7. [API Development](#api-development)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [Code Style Guide](#code-style-guide)
12. [Contributing](#contributing)

---

## Getting Started

### Prerequisites

- **Node.js**: v16 or higher
- **npm**: v7 or higher (or yarn)
- **PostgreSQL**: v12 or higher
- **Git**: For version control

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mgolia6/Phish_Scorecard.git
   cd Phish_Scorecard
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```
   This runs:
   - `npm install` (root dependencies)
   - `cd client && npm install` (frontend dependencies)

3. **Create PostgreSQL database**
   ```bash
   createdb phish_scorecard
   psql -U postgres -d phish_scorecard -f init-db.sql
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```
   DATABASE_URL=postgresql://username:password@localhost/phish_scorecard
   JWT_SECRET=your-secret-key-here
   PORT=5000
   NODE_ENV=development
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```
   This starts:
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173

---

## Project Structure

```
Phish_Scorecard/
├── server.js                    # Express server & API routes
├── init-db.sql                  # Database schema
├── package.json                 # Root dependencies
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── README.md                    # Project overview
├── SESSION_LOG.md               # Development session log
├── DEVELOPER_GUIDE.md           # This file
│
├── client/                      # React frontend
│   ├── src/
│   │   ├── App.jsx             # Main React component
│   │   ├── App.css             # App-specific styles
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # React entry point
│   ├── index.html              # HTML template
│   ├── vite.config.js          # Vite configuration
│   └── package.json            # Frontend dependencies
│
└── docs/                        # Additional documentation (optional)
    ├── API.md                   # API reference
    └── ARCHITECTURE.md          # Architecture overview
```

---

## Development Workflow

### Daily Development

1. **Start development servers**
   ```bash
   npm run dev
   ```

2. **Make changes to frontend**
   - Edit files in `client/src/`
   - Vite hot-reloads automatically
   - Check http://localhost:5173

3. **Make changes to backend**
   - Edit `server.js`
   - Server restarts automatically (with nodemon)
   - Check http://localhost:5000

4. **Test your changes**
   ```bash
   npm test
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

### Creating a Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### Code Review Process

1. Create a Pull Request
2. Request review from team members
3. Address feedback
4. Merge when approved

---

## Backend Development

### Adding New API Routes

1. **Open `server.js`**

2. **Add route handler**
   ```javascript
   // Example: Add new endpoint
   app.get('/api/custom-endpoint', authenticateToken, async (req, res) => {
     try {
       // Your logic here
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

3. **Document in API section**
   - Add endpoint to README.md
   - Include method, path, parameters, response

### Authentication Middleware

All protected routes should use `authenticateToken` middleware:

```javascript
app.get('/api/protected-route', authenticateToken, (req, res) => {
  // req.user contains decoded JWT payload
  const userId = req.user.id;
  // ... rest of handler
});
```

### Error Handling

Use consistent error responses:

```javascript
try {
  // Your code
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Descriptive error message',
    details: error.message 
  });
}
```

### Database Queries

Use parameterized queries to prevent SQL injection:

```javascript
// ✅ GOOD - Parameterized query
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ❌ BAD - String concatenation (SQL injection risk)
const result = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

### Adding Dependencies

```bash
# Add to root (backend)
npm install package-name

# Add to frontend
cd client && npm install package-name
```

---

## Frontend Development

### Component Structure

```javascript
import React, { useState, useEffect } from 'react';
import './ComponentName.css';

function ComponentName() {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects here
  }, []);

  return (
    <div className="component-name">
      {/* JSX here */}
    </div>
  );
}

export default ComponentName;
```

### Making API Calls

```javascript
import axios from 'axios';

// Create API instance with auth header
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Use in component
useEffect(() => {
  api.get('/endpoint')
    .then(response => {
      // Handle success
    })
    .catch(error => {
      // Handle error
    });
}, []);
```

### Styling

Use CSS classes with BEM naming convention:

```css
/* Block */
.component-name {
  /* styles */
}

/* Element */
.component-name__header {
  /* styles */
}

/* Modifier */
.component-name--active {
  /* styles */
}
```

### Adding New Pages/Components

1. Create component file in `client/src/`
2. Add styles in corresponding `.css` file
3. Import and use in `App.jsx`
4. Add route/tab if needed

---

## Database Management

### Running Migrations

```bash
# Apply schema
psql -U postgres -d phish_scorecard -f init-db.sql

# Verify tables
psql -U postgres -d phish_scorecard -c "\dt"
```

### Backing Up Database

```bash
# Export database
pg_dump -U postgres phish_scorecard > backup.sql

# Import database
psql -U postgres -d phish_scorecard < backup.sql
```

### Resetting Database

```bash
# Drop and recreate
dropdb phish_scorecard
createdb phish_scorecard
psql -U postgres -d phish_scorecard -f init-db.sql
```

### Querying Database Directly

```bash
# Connect to database
psql -U postgres -d phish_scorecard

# Useful queries
SELECT * FROM users;
SELECT * FROM shows;
SELECT * FROM ratings;
SELECT COUNT(*) FROM ratings;
```

---

## API Development

### API Endpoints Reference

#### Authentication
```
POST   /api/auth/register        - Create new account
POST   /api/auth/login           - Login
GET    /api/auth/me              - Get current user
PUT    /api/auth/profile         - Update profile
```

#### Shows
```
GET    /api/shows                - Get all shows
GET    /api/shows/search?q=      - Search shows
GET    /api/shows/:date          - Get show details
```

#### Ratings
```
POST   /api/ratings/:showDate    - Submit ratings
GET    /api/ratings/:showDate    - Get ratings
GET    /api/user/shows           - Get user's shows
```

#### Analytics
```
GET    /api/analytics/songs      - Top rated songs
GET    /api/analytics/venues     - Top rated venues
```

### Request/Response Format

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

---

## Testing

### Manual Testing

1. **Test user registration**
   - Sign up with new email
   - Verify account created

2. **Test login**
   - Login with credentials
   - Verify token stored

3. **Test show search**
   - Search by date
   - Search by venue
   - Verify results

4. **Test rating submission**
   - Select show
   - Rate songs
   - Verify saved to database

5. **Test analytics**
   - View top songs
   - View top venues
   - Verify calculations

### Automated Testing (Future)

```bash
npm test
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Code reviewed
- [ ] Commit messages clear

### Deploy to Railway

1. Push to GitHub
2. Railway auto-deploys
3. Monitor deployment logs
4. Test live URL

### Deploy to Render

1. Push to GitHub
2. Trigger manual deploy
3. Monitor build logs
4. Test live URL

### Environment Variables for Production

```
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host/phish_scorecard
JWT_SECRET=production-secret-key-here
PORT=5000
NODE_ENV=production
```

---

## Troubleshooting

### Common Issues

#### "Cannot find module 'express'"
```bash
npm install
```

#### "Database connection refused"
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check database exists
psql -U postgres -l | grep phish_scorecard
```

#### "Port 5000 already in use"
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm start
```

#### "Frontend not connecting to backend"
- Check backend is running on port 5000
- Check proxy in `client/vite.config.js`
- Check CORS headers in `server.js`

#### "JWT token invalid"
- Verify JWT_SECRET matches
- Check token expiration
- Verify token format in Authorization header

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm start

# Check environment variables
node -e "console.log(process.env)"
```

---

## Code Style Guide

### JavaScript

- Use ES6+ syntax
- Use const/let (not var)
- Use arrow functions where appropriate
- Add comments for complex logic
- Keep functions small and focused

```javascript
// ✅ Good
const getUserById = async (id) => {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return user.rows[0];
};

// ❌ Bad
function getUserById(id) {
  var user = db.query("SELECT * FROM users WHERE id = " + id);
  return user;
}
```

### React

- Use functional components
- Use hooks for state management
- Destructure props
- Use meaningful variable names

```javascript
// ✅ Good
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  return <div>{user?.name}</div>;
}

// ❌ Bad
class UserProfile extends React.Component {
  render() {
    return <div>{this.props.user.name}</div>;
  }
}
```

### CSS

- Use BEM naming convention
- Group related styles
- Use CSS variables for colors
- Mobile-first approach

```css
/* ✅ Good */
.button {
  background: var(--primary);
  padding: 12px 24px;
}

.button--primary {
  background: var(--primary);
}

/* ❌ Bad */
.btn {
  background: #33ff33;
}

.btn_primary {
  background: #33ff33;
}
```

### SQL

- Use meaningful table/column names
- Add comments for complex queries
- Use parameterized queries
- Keep queries readable

```sql
-- ✅ Good
SELECT 
  u.id,
  u.username,
  COUNT(r.id) as rating_count
FROM users u
LEFT JOIN ratings r ON u.id = r.user_id
GROUP BY u.id
ORDER BY rating_count DESC;

-- ❌ Bad
SELECT * FROM u,r WHERE u.id=r.uid;
```

---

## Contributing

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write clear commit messages
5. Push to your fork
6. Create a Pull Request

### Commit Message Format

```
[Type] Brief description

Detailed explanation if needed.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat: Add user profile page
fix: Resolve rating calculation bug
docs: Update API documentation
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
```

---

## Resources

### Documentation
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Vite Guide](https://vitejs.dev/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [pgAdmin](https://www.pgadmin.org/) - Database GUI
- [VS Code](https://code.visualstudio.com/) - Code editor

### Useful Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Format code
npm run format

# Check for errors
npm run lint
```

---

## Getting Help

- Check the [README.md](README.md) for project overview
- Review [SESSION_LOG.md](SESSION_LOG.md) for architecture decisions
- Open an issue on GitHub
- Contact the development team

---

**Last Updated**: May 29, 2026  
**Version**: 2.0
