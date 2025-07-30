function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });

  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
}

function populateShowDropdown(shows) {
  const showSelect = document.getElementById('showdate');
  showSelect.innerHTML = '<option value="">-- Choose a date --</option>';
  shows.forEach(show => {
    const option = document.createElement('option');
    option.value = show.showdate;
    option.textContent = `${show.showdate} - ${show.venue}`;
    showSelect.appendChild(option);
  });
}

function displaySetlist(setlistData) {
  // Your existing setlist display logic
}

function calculateAverage() {
  // Your existing average calculation logic
}
