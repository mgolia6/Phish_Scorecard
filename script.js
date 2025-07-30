// script.js

// 1. Fetch setlist from Phish.net
async function fetchSetlist(showDate) {
  const url = `https://api.phish.net/v5/setlists?apikey=YOUR_API_KEY&showdate=${showDate}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    displaySetlist(data);
  } catch (error) {
    console.error('Error fetching setlist:', error);
  }
}

// 2. Display setlist and rating inputs
function displaySetlist(data) {
  const container = document.getElementById('setlist-container');
  container.innerHTML = '';

  data.setlist.forEach((song, index) => {
    const songDiv = document.createElement('div');
    songDiv.innerHTML = `
      <p>${song.song}</p>
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

// 3. Submit ratings and calculate average
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

  const average = (total / count).toFixed(2);
  document.getElementById('rating-summary').innerHTML = `
    <p>Average Show Rating: ${average}</p>
    <pre>${JSON.stringify(songRatings, null, 2)}</pre>
  `;
}

// 4. Optional: Trigger fetch on page load or button click
document.addEventListener('DOMContentLoaded', () => {
  fetchSetlist('2023-07-28'); // Replace with desired show date
});
