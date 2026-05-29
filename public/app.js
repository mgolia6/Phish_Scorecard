// ============================================
// MAIN APPLICATION MODULE
// ============================================

let allShows = [];
let currentShow = null;
let currentRatings = {};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupTabNavigation();
  setupSearchFunctionality();
});

// Initialize application
async function initializeApp() {
  try {
    // Load all shows from Phish.net API
    await loadAllShows();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize app. Please refresh the page.');
  }
}

// Load all shows from API
async function loadAllShows() {
  try {
    const shows = await apiCall('/api/shows');
    allShows = shows.sort((a, b) => new Date(b.showdate) - new Date(a.showdate));
    console.log(`Loaded ${allShows.length} shows`);
  } catch (error) {
    console.error('Error loading shows:', error);
    throw error;
  }
}

// Setup event listeners
function setupEventListeners() {
  const randomBtn = document.getElementById('random-show-btn');
  const submitBtn = document.getElementById('submit-ratings-btn');
  const calculateBtn = document.getElementById('calculate-rating-btn');

  if (randomBtn) {
    randomBtn.addEventListener('click', loadRandomShow);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', submitRatings);
  }

  if (calculateBtn) {
    calculateBtn.addEventListener('click', calculateShowRating);
  }
}

// Setup tab navigation
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove active class from all
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      // Load tab-specific content
      if (tabId === 'my-shows' && isAuthenticated()) {
        loadUserShows();
      } else if (tabId === 'analytics') {
        loadAnalytics();
      } else if (tabId === 'profile' && isAuthenticated()) {
        loadProfile();
      }
    });
  });
}

// Setup search functionality
function setupSearchFunctionality() {
  const searchInput = document.getElementById('show-search');
  const searchResults = document.getElementById('search-results');

  if (!searchInput) return;

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });

  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.innerHTML = '';
    }
  });
}

// Perform search
async function performSearch(query) {
  const searchResults = document.getElementById('search-results');

  try {
    const results = await apiCall(`/api/shows/search?q=${encodeURIComponent(query)}`);
    
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result">No shows found</div>';
      return;
    }

    searchResults.innerHTML = results.map(show => `
      <div class="search-result" onclick="selectShow('${show.showdate}')">
        <strong>${show.showdate}</strong> - ${show.venue}
        <br><small>${show.city}, ${show.state}</small>
      </div>
    `).join('');
  } catch (error) {
    console.error('Search error:', error);
    searchResults.innerHTML = '<div class="search-result error">Search error</div>';
  }
}

// Select a show
async function selectShow(date) {
  if (!isAuthenticated()) {
    openAuthModal('login');
    return;
  }

  const searchInput = document.getElementById('show-search');
  if (searchInput) {
    searchInput.value = date;
    document.getElementById('search-results').innerHTML = '';
  }

  await loadShow(date);
}

// Load a specific show
async function loadShow(date) {
  try {
    // Show loading state
    document.getElementById('show-details').innerHTML = '<div class="loading">Loading show...</div>';
    document.getElementById('setlist-container').innerHTML = '';

    // Fetch show details and setlist
    const shows = await apiCall('/api/shows');
    const show = shows.find(s => s.showdate === date);

    if (!show) {
      throw new Error('Show not found');
    }

    currentShow = show;

    // Fetch setlist
    const setlist = await apiCall(`/api/shows/${date}/setlist`);

    if (!setlist || setlist.length === 0) {
      document.getElementById('show-details').innerHTML = '<div class="error">No setlist found for this date</div>';
      return;
    }

    // Display show details
    displayShowDetails(show);

    // Display setlist
    displaySetlist(setlist);

    // Load existing ratings if user is logged in
    if (isAuthenticated()) {
      await loadExistingRatings(date);
    }

    // Show action buttons
    document.getElementById('submit-ratings-btn').style.display = 'inline-block';
    document.getElementById('calculate-rating-btn').style.display = 'inline-block';
  } catch (error) {
    console.error('Error loading show:', error);
    document.getElementById('show-details').innerHTML = `<div class="error">${error.message}</div>`;
  }
}

// Display show details
function displayShowDetails(show) {
  const detailsDiv = document.getElementById('show-details');
  
  const phishNetUrl = buildPhishNetUrl(show);

  detailsDiv.innerHTML = `
    <h3>${show.showdate}</h3>
    <p><strong>Venue:</strong> ${show.venue}</p>
    <p><strong>Location:</strong> ${show.city}, ${show.state}, ${show.country}</p>
    <p><a href="${phishNetUrl}" target="_blank" rel="noopener">View on Phish.net →</a></p>
  `;
}

// Build Phish.net URL
function buildPhishNetUrl(show) {
  const months = ['january', 'february', 'march', 'april', 'may', 'june',
                  'july', 'august', 'september', 'october', 'november', 'december'];
  
  const [year, month, day] = show.showdate.split('-');
  const monthName = months[parseInt(month) - 1];
  const dayNum = parseInt(day);

  const slug = (str) => (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

  return `https://phish.net/setlists/phish-${monthName}-${dayNum}-${year}-${slug(show.venue)}-${slug(show.city)}-${slug(show.state)}-${slug(show.country)}.html`;
}

// Display setlist
function displaySetlist(setlistData) {
  const container = document.getElementById('setlist-container');

  // Group songs by set
  const songsBySet = {};
  for (let i = 1; i < setlistData.length; i++) {
    const entry = setlistData[i];
    if (!songsBySet[entry.set]) {
      songsBySet[entry.set] = [];
    }
    songsBySet[entry.set].push(entry);
  }

  let html = '<h3>Setlist & Ratings</h3>';

  Object.keys(songsBySet).forEach(setName => {
    const setLabel = setName === 'E' ? 'Encore' : `Set ${setName}`;
    html += `
      <div class="set-section">
        <div class="set-header">${setLabel}</div>
        <table class="set-table">
          <thead>
            <tr>
              <th>Song</th>
              <th>Jam Chart</th>
              <th>Gap</th>
              <th>Rating</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
    `;

    songsBySet[setName].forEach(song => {
      const kebabSong = (song.song || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');

      const phishNetSongUrl = `https://phish.net/song/${kebabSong}`;

      html += `
        <tr class="song-row" data-song="${song.song}" data-set="${setName}">
          <td class="song-name">
            <a href="${phishNetSongUrl}" target="_blank" rel="noopener">${song.song}</a>
          </td>
          <td>${song.isjamchart ? '✓' : ''}</td>
          <td>${song.gap || 'N/A'}</td>
          <td>
            <select class="rating-select" onchange="updateRating(this)">
              <option value="">--</option>
              <option value="5">5 - Legendary</option>
              <option value="4">4 - Great</option>
              <option value="3">3 - Solid</option>
              <option value="2">2 - Average</option>
              <option value="1">1 - Below Avg</option>
            </select>
          </td>
          <td>
            <input type="text" class="notes-input" placeholder="Notes..." />
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Load existing ratings for a show
async function loadExistingRatings(date) {
  try {
    const ratings = await apiCall(`/api/ratings/${date}`);
    
    ratings.forEach(rating => {
      const row = document.querySelector(`[data-song="${rating.song_name}"][data-set="${rating.set_number}"]`);
      if (row) {
        const select = row.querySelector('.rating-select');
        const notesInput = row.querySelector('.notes-input');
        
        if (select && rating.rating) {
          select.value = rating.rating;
        }
        if (notesInput && rating.notes) {
          notesInput.value = rating.notes;
        }
      }
    });
  } catch (error) {
    console.error('Error loading existing ratings:', error);
  }
}

// Update rating (called when select changes)
function updateRating(selectElement) {
  // Could add real-time calculation here
  calculateShowRating();
}

// Calculate show rating
function calculateShowRating() {
  const rows = document.querySelectorAll('.song-row');
  const setRatings = {};
  let allRatings = [];

  rows.forEach(row => {
    const select = row.querySelector('.rating-select');
    const setName = row.getAttribute('data-set');
    const rating = parseInt(select.value);

    if (!isNaN(rating)) {
      allRatings.push(rating);
      
      if (!setRatings[setName]) {
        setRatings[setName] = [];
      }
      setRatings[setName].push(rating);
    }
  });

  const showRatingDiv = document.getElementById('show-rating');

  if (allRatings.length === 0) {
    showRatingDiv.innerHTML = '';
    return;
  }

  const overallAverage = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;

  // Build set summary bar
  let summaryHtml = '<div class="set-summary-bar">';
  Object.keys(setRatings).forEach(set => {
    const setAvg = setRatings[set].reduce((a, b) => a + b, 0) / setRatings[set].length;
    const setLabel = set === 'E' ? 'Encore' : `Set ${set}`;
    summaryHtml += `
      <div class="set-summary-item">
        <div class="set-name">${setLabel}</div>
        <div class="set-rating">${setAvg.toFixed(2)}</div>
      </div>
    `;
  });
  summaryHtml += '</div>';

  showRatingDiv.innerHTML = `
    ${summaryHtml}
    <div class="show-rating">
      <h3>Show Rating</h3>
      <div class="rating-value">${overallAverage.toFixed(2)}</div>
      <p>${allRatings.length} songs rated</p>
    </div>
  `;
}

// Submit ratings
async function submitRatings() {
  if (!isAuthenticated()) {
    openAuthModal('login');
    return;
  }

  if (!currentShow) {
    showError('Please select a show first');
    return;
  }

  try {
    const ratings = [];
    document.querySelectorAll('.song-row').forEach(row => {
      const songName = row.getAttribute('data-song');
      const setNumber = row.getAttribute('data-set');
      const ratingSelect = row.querySelector('.rating-select');
      const notesInput = row.querySelector('.notes-input');

      if (ratingSelect.value || notesInput.value) {
        ratings.push({
          song: songName,
          set: setNumber,
          rating: ratingSelect.value ? parseInt(ratingSelect.value) : null,
          notes: notesInput.value,
          jamChart: row.querySelector('td:nth-child(2)').textContent === '✓'
        });
      }
    });

    if (ratings.length === 0) {
      showError('Please rate at least one song');
      return;
    }

    await apiCall(`/api/ratings/${currentShow.showdate}`, {
      method: 'POST',
      body: JSON.stringify({
        ratings,
        showDetails: {
          venue: currentShow.venue,
          city: currentShow.city,
          state: currentShow.state,
          country: currentShow.country
        }
      })
    });

    showSuccess('Ratings submitted successfully!');
  } catch (error) {
    console.error('Error submitting ratings:', error);
    showError(error.message);
  }
}

// Load random show
async function loadRandomShow() {
  if (!isAuthenticated()) {
    openAuthModal('login');
    return;
  }

  try {
    const show = await apiCall('/api/shows/random');
    await selectShow(show.showdate);
  } catch (error) {
    console.error('Error loading random show:', error);
    showError('Failed to load random show');
  }
}

// Load user's shows
async function loadUserShows() {
  if (!isAuthenticated()) {
    document.getElementById('my-shows-list').innerHTML = '<div class="error">Please login to view your shows</div>';
    return;
  }

  try {
    const shows = await apiCall('/api/user/shows');
    
    if (shows.length === 0) {
      document.getElementById('my-shows-list').innerHTML = '<div class="loading">No rated shows yet</div>';
      return;
    }

    let html = '<table class="stats-table"><thead><tr><th>Date</th><th>Venue</th><th>Rating</th><th>Songs Rated</th></tr></thead><tbody>';
    
    shows.forEach(show => {
      html += `
        <tr>
          <td>${show.show_date}</td>
          <td>${show.venue}</td>
          <td>${show.overall_rating ? show.overall_rating.toFixed(2) : 'N/A'}</td>
          <td>${show.set_ratings ? Object.keys(JSON.parse(show.set_ratings)).length : 0}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    document.getElementById('my-shows-list').innerHTML = html;
  } catch (error) {
    console.error('Error loading user shows:', error);
    document.getElementById('my-shows-list').innerHTML = `<div class="error">${error.message}</div>`;
  }
}

// Load analytics
async function loadAnalytics() {
  try {
    // Load song stats
    const songStats = await apiCall('/api/analytics/songs');
    displaySongAnalytics(songStats);

    // Load venue stats
    const venueStats = await apiCall('/api/analytics/venues');
    displayVenueAnalytics(venueStats);
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

// Display song analytics
function displaySongAnalytics(stats) {
  const container = document.getElementById('songs-analytics');
  
  if (!stats || stats.length === 0) {
    container.innerHTML = '<div class="loading">No song data available yet</div>';
    return;
  }

  let html = '<table class="stats-table"><thead><tr><th>Song</th><th>Avg Rating</th><th>Total Ratings</th><th>Jam Charts</th></tr></thead><tbody>';
  
  stats.slice(0, 50).forEach(song => {
    html += `
      <tr>
        <td>${song.song_name}</td>
        <td>${song.average_rating ? song.average_rating.toFixed(2) : 'N/A'}</td>
        <td>${song.total_ratings}</td>
        <td>${song.times_jam_charted || 0}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Display venue analytics
function displayVenueAnalytics(stats) {
  const container = document.getElementById('venues-analytics');
  
  if (!stats || stats.length === 0) {
    container.innerHTML = '<div class="loading">No venue data available yet</div>';
    return;
  }

  let html = '<table class="stats-table"><thead><tr><th>Venue</th><th>City</th><th>Avg Rating</th><th>Shows</th></tr></thead><tbody>';
  
  stats.slice(0, 50).forEach(venue => {
    html += `
      <tr>
        <td>${venue.venue}</td>
        <td>${venue.city}</td>
        <td>${venue.average_rating ? venue.average_rating.toFixed(2) : 'N/A'}</td>
        <td>${venue.total_shows}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Load profile
async function loadProfile() {
  if (!isAuthenticated()) {
    document.getElementById('profile-content').innerHTML = '<div class="error">Please login</div>';
    return;
  }

  const profileDiv = document.getElementById('profile-content');
  profileDiv.innerHTML = `
    <div class="profile-field">
      <label>Username</label>
      <input type="text" value="${currentUser.username}" disabled />
    </div>
    <div class="profile-field">
      <label>Email</label>
      <input type="email" value="${currentUser.email}" disabled />
    </div>
    <div class="profile-field">
      <label>First Name</label>
      <input type="text" id="profile-first-name" value="${currentUser.first_name || ''}" />
    </div>
    <div class="profile-field">
      <label>Last Name</label>
      <input type="text" id="profile-last-name" value="${currentUser.last_name || ''}" />
    </div>
    <button class="btn-primary" onclick="updateProfile()">Update Profile</button>
  `;
}

// Update profile
async function updateProfile() {
  try {
    const firstName = document.getElementById('profile-first-name').value;
    const lastName = document.getElementById('profile-last-name').value;

    await apiCall('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName })
    });

    currentUser.first_name = firstName;
    currentUser.last_name = lastName;
    showSuccess('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    showError(error.message);
  }
}

// Utility functions
function showError(message) {
  const div = document.createElement('div');
  div.className = 'error';
  div.textContent = message;
  document.body.insertBefore(div, document.body.firstChild);
  setTimeout(() => div.remove(), 5000);
}

function showSuccess(message) {
  const div = document.createElement('div');
  div.className = 'success';
  div.textContent = message;
  document.body.insertBefore(div, document.body.firstChild);
  setTimeout(() => div.remove(), 5000);
}
