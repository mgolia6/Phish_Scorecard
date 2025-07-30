async function init() {
  try {
    const shows = await fetchShows();
    const sortedShows = shows.sort((a, b) => new Date(b.showdate) - new Date(a.showdate));
    populateShowDropdown(sortedShows);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

async function loadShow() {
  const date = document.getElementById("showdate").value;
  if (!date) return alert("Please select a show date.");

  try {
    const setlistData = await fetchSetlist(date);
    displaySetlist(setlistData);
  } catch (error) {
    alert('Error loading show data: ' + error.message);
  }
}

function submitRatings() {
  // Your existing submit ratings logic
}

// Initialize the app
init();
