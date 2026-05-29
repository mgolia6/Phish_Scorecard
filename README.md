# Phishow Scorecard v2.0

A retro-modern web application for rating Phish shows, tracking concert statistics, and analyzing performance by song, venue, and date.

## Features

- **User Authentication**: Secure login and signup with JWT tokens
- **Show Rating System**: Rate individual songs from each Phish show (1-5 scale)
- **Real-time Calculations**: Automatic show and set-by-set rating calculations
- **Phish.net Integration**: Access to complete Phish show database and setlists
- **Analytics Dashboards**: 
  - Top-rated songs across all users
  - Top venues by average rating
  - Personal statistics and favorite venues
- **Retro-Modern Design**: Terminal-inspired UI with modern usability
- **Persistent Storage**: SQLite database for user data and ratings

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **External API**: Phish.net API v5

## Installation

### Prerequisites
- Node.js 14+ and npm
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mgolia6/Phish_Scorecard.git
   cd Phish_Scorecard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_secret_key_here
   PHISH_NET_API_KEY=10645D7F59011FFA82A
   DATABASE_PATH=./phish_scorecard.db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## Usage

### Getting Started

1. **Sign Up**: Create a new account with your email and password
2. **Search for a Show**: Use the search bar to find a Phish show by date or venue
3. **Rate Songs**: Select a show and rate each song on a 1-5 scale
4. **Add Notes**: Add personal notes for standout moments
5. **Submit Ratings**: Save your ratings to your profile

### Tabs

- **Scorecard**: Rate shows and view real-time calculations
- **My Shows**: View all your rated shows and statistics
- **Analytics**: Explore top-rated songs and venues
- **Profile**: Manage your account information

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### Shows
- `GET /api/shows` - Get all Phish shows
- `GET /api/shows/search?q=query` - Search shows
- `GET /api/shows/random` - Get random show
- `GET /api/shows/:date/setlist` - Get setlist for a show

### Ratings
- `POST /api/ratings/:showDate` - Save ratings (requires auth)
- `GET /api/ratings/:showDate` - Get ratings for a show (requires auth)
- `GET /api/shows/:showDate/aggregate` - Get show aggregate (requires auth)
- `GET /api/user/shows` - Get user's rated shows (requires auth)

### Analytics
- `GET /api/analytics/songs` - Get song statistics
- `GET /api/analytics/venues` - Get venue statistics

## Database Schema

### Users Table
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- email (TEXT UNIQUE)
- password_hash (TEXT)
- first_name (TEXT)
- last_name (TEXT)
- avatar_url (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

### Ratings Table
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FK)
- show_date (TEXT)
- song_name (TEXT)
- set_number (TEXT)
- rating (INTEGER 1-5)
- notes (TEXT)
- is_jam_chart (INTEGER)
- gap (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

### Show Aggregates Table
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER FK)
- show_date (TEXT)
- venue (TEXT)
- city (TEXT)
- state (TEXT)
- country (TEXT)
- overall_rating (REAL)
- set_ratings (TEXT JSON)
- notes (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

## Design Philosophy

The Phishow Scorecard maintains a retro-modern aesthetic inspired by vintage terminal interfaces, updated with contemporary UX principles:

- **Color Palette**: Green (#33ff33), Cyan (#00ccff), Orange (#ff6600) on dark backgrounds
- **Typography**: Monospace fonts for authenticity
- **Layout**: Clean, organized grid-based design with clear visual hierarchy
- **Interactions**: Smooth transitions and responsive feedback
- **Accessibility**: High contrast, readable fonts, keyboard navigation support

## Future Enhancements

- [ ] Social features (share ratings, follow friends)
- [ ] Advanced filtering and sorting
- [ ] Data export (CSV, JSON)
- [ ] Mobile app
- [ ] Jam chart integration
- [ ] Tour tracking
- [ ] Community leaderboards

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Support

For issues or questions, please open an issue on GitHub.

## Acknowledgments

- Phish.net for providing the show and setlist data
- The Phish community for inspiration

---

**Version**: 2.0  
**Last Updated**: May 2026  
**Author**: Matthew Golia
