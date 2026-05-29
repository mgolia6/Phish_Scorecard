// ============================================
// UI UTILITIES MODULE
// ============================================

// Setup analytics tabs
document.addEventListener('DOMContentLoaded', () => {
  setupAnalyticsTabs();
});

function setupAnalyticsTabs() {
  const analyticsBtns = document.querySelectorAll('.analytics-tab-btn');
  const analyticsContents = document.querySelectorAll('.analytics-content');

  analyticsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const analyticsId = btn.getAttribute('data-analytics');

      // Remove active from all
      analyticsBtns.forEach(b => b.classList.remove('active'));
      analyticsContents.forEach(c => c.classList.remove('active'));

      // Add active to clicked
      btn.classList.add('active');
      document.getElementById(`${analyticsId}-analytics`).classList.add('active');

      // Load specific analytics if needed
      if (analyticsId === 'personal' && isAuthenticated()) {
        loadPersonalStats();
      }
    });
  });
}

// Load personal statistics
async function loadPersonalStats() {
  if (!isAuthenticated()) {
    document.getElementById('personal-analytics').innerHTML = '<div class="error">Please login to view your stats</div>';
    return;
  }

  try {
    const shows = await apiCall('/api/user/shows');
    
    if (!shows || shows.length === 0) {
      document.getElementById('personal-analytics').innerHTML = '<div class="loading">No rating data yet</div>';
      return;
    }

    // Calculate personal statistics
    let totalShows = shows.length;
    let totalRating = 0;
    let ratingCount = 0;
    const songRatings = {};
    const venueRatings = {};

    shows.forEach(show => {
      if (show.overall_rating) {
        totalRating += show.overall_rating;
        ratingCount++;
      }

      if (show.venue) {
        if (!venueRatings[show.venue]) {
          venueRatings[show.venue] = { ratings: [], city: show.city };
        }
        if (show.overall_rating) {
          venueRatings[show.venue].ratings.push(show.overall_rating);
        }
      }
    });

    const averageShowRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // Build stats display
    let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="stat-card" style="background: var(--bg-panel); border: 1px solid var(--primary-green); padding: 20px; border-radius: 8px; text-align: center;">
          <div style="color: var(--primary-cyan); font-size: 0.9em; text-transform: uppercase; margin-bottom: 10px;">Total Shows Rated</div>
          <div style="font-size: 2em; color: var(--primary-green); font-weight: bold;">${totalShows}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-panel); border: 1px solid var(--primary-green); padding: 20px; border-radius: 8px; text-align: center;">
          <div style="color: var(--primary-cyan); font-size: 0.9em; text-transform: uppercase; margin-bottom: 10px;">Average Show Rating</div>
          <div style="font-size: 2em; color: var(--primary-orange); font-weight: bold;">${averageShowRating.toFixed(2)}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-panel); border: 1px solid var(--primary-green); padding: 20px; border-radius: 8px; text-align: center;">
          <div style="color: var(--primary-cyan); font-size: 0.9em; text-transform: uppercase; margin-bottom: 10px;">Favorite Venue</div>
          <div style="font-size: 1.2em; color: var(--primary-green); font-weight: bold;">
            ${Object.entries(venueRatings).length > 0 
              ? Object.entries(venueRatings)
                  .map(([venue, data]) => ({
                    venue,
                    avg: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
                    city: data.city
                  }))
                  .sort((a, b) => b.avg - a.avg)[0]
                  .venue
              : 'N/A'
            }
          </div>
        </div>
      </div>
    `;

    // Top venues
    if (Object.keys(venueRatings).length > 0) {
      html += '<h4 style="color: var(--primary-cyan); margin: 20px 0 10px 0;">Your Top Venues</h4>';
      html += '<table class="stats-table"><thead><tr><th>Venue</th><th>City</th><th>Avg Rating</th><th>Shows</th></tr></thead><tbody>';

      Object.entries(venueRatings)
        .map(([venue, data]) => ({
          venue,
          city: data.city,
          avg: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
          count: data.ratings.length
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10)
        .forEach(item => {
          html += `
            <tr>
              <td>${item.venue}</td>
              <td>${item.city}</td>
              <td>${item.avg.toFixed(2)}</td>
              <td>${item.count}</td>
            </tr>
          `;
        });

      html += '</tbody></table>';
    }

    document.getElementById('personal-analytics').innerHTML = html;
  } catch (error) {
    console.error('Error loading personal stats:', error);
    document.getElementById('personal-analytics').innerHTML = `<div class="error">${error.message}</div>`;
  }
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Format number
function formatNumber(num) {
  return num.toLocaleString();
}

// Truncate text
function truncate(text, length) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}
