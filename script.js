// script.js

// Dismiss splash screen on any keypress
document.addEventListener('keydown', () => {
  const splash = document.getElementById('splash-screen');
  const mainUI = document.getElementById('main-ui');
  if (splash.style.display !== 'none') {
    splash.style.display = 'none';
    mainUI.style.display = 'block';
  }
});

// Load show when button is clicked
function loadShow() {
  const showDate = document.getElementById('show-date').value;
  if (!showDate) {
    alert('Please enter a show date in YYYY-MM-DD format.');
    return;
  }
  fetchSetlist(showDate);
}

// Fetch setlist from Phish.net API
async function fetchSetlist(showDate) {
  const url = `https://api.phish.net/v5/setlists?apikey=${API_KEY}&showdate=${showDate}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.error || !data.setlist || data.setlist.length === 0) {
      document.getElementById('setlist-container').innerHTML = `<p>No setlist found for ${showDate}</p>`;
      return;
    }
    displaySetlist(data);
  } catch (error) {
    console.error('Error fetching setlist:', error);
    document.getElementById('setlist-container').innerHTML = `<p>Error loading setlist.</p>`;
  }
}

// Display setlist with rating inputs
function displaySetlist(data) {
  const container = document.getElementById('setlist-container');
  container.innerHTML = '';

  data.setlist.forEach((song, index) => {
    const songDiv = document.createElement('div');
    songDiv.innerHTML = `
      <p class="typewriter">${song.song}</p>
      <label>Rating:
        <select data-song="${song.song}" class="rating-select">
          <option value="">--</option>
          <option value="1">1 - Meh</option>
          <option value="2">2 - Decent</option>
          <option value="3">3 - Good</option>
          <option value="4">4 - Great</option>
          <option value="5">5 - Transcendent</option>
        </select>
      </label>
    `;
    container.appendChild(songDiv);
  });
}

// Submit ratings and calculate average
function submitRatings() {
  const selects = document.querySelectorAll('.rating-select');
  let total = 0;
  let count = 0;
  const songRatings = {};

  selects.forEach(select => {
    const rating = parseInt(select.value);
    const song = select.dataset.song;
    if (rating) {
      total += rating;
      count++;
      songRatings[song] = rating;
    }
  });

  const average = count > 0 ? (total / count).toFixed(2) : 'N/A';
  document.getElementById('rating-summary').innerHTML = `
    <p>Average Show Rating: ${average}</p>
    <pre>${JSON.stringify(songRatings, null, 2)}</pre>
  `;
}
