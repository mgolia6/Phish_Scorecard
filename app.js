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
        if (setlistData && setlistData.length > 0) {
            const showData = setlistData[0];
            displayShowDetails(showData);
            displayShowNotes(showData.setlistnotes);
            displaySetlist(setlistData);
        } else {
            throw new Error('No show data found');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading show data. Please try again.');
    }
}

function calculateAverage() {
    const ratings = document.querySelectorAll('#setlist-table select');
    let sum = 0;
    let count = 0;

    ratings.forEach(select => {
        if (select.value) {
            sum += parseInt(select.value);
            count++;
        }
    });

    const average = count > 0 ? (sum / count).toFixed(2) : 'No ratings yet';
    document.getElementById('show-rating').innerHTML = `<strong>Show Rating:</strong> ${average}`;
}

function submitRatings() {
    const showDate = document.getElementById("showdate").value;
    if (!showDate) {
        alert("Please select a show first.");
        return;
    }

    const ratings = [];
    const rows = document.querySelectorAll('#setlist-table tbody tr');
    let hasRatings = false;

    rows.forEach((row, index) => {
        const ratingSelect = row.querySelector('select');
        const notesInput = row.querySelector('input[type="text"]');
        
        if (ratingSelect && (ratingSelect.value || notesInput.value)) {
            hasRatings = true;
            ratings.push({
                song: row.cells[1].textContent,
                set: row.cells[0].textContent,
                rating: ratingSelect.value ? parseInt(ratingSelect.value) : null,
                notes: notesInput.value || '',
                position: row.cells[2].textContent,
                isJamChart: row.cells[2].textContent.includes('✓'),
                gap: row.cells[3].textContent,
                date: showDate,
                timestamp: new Date().toISOString()
            });
        }
    });

    if (!hasRatings) {
        alert("Please add at least one rating or note before submitting.");
        return;
    }

    try {
        // Save to local storage
        storage.saveRatings(showDate, ratings);

        // Calculate and save show average
        let ratedSongs = ratings.filter(r => r.rating !== null);
        let showAverage = ratedSongs.length > 0 
            ? ratedSongs.reduce((sum, r) => sum + r.rating, 0) / ratedSongs.length
            : null;

        if (showAverage !== null) {
            storage.saveShowRating(showDate, showAverage);
        }

        // Update song statistics
        ratings.forEach(rating => {
            if (rating.rating !== null) {
                storage.updateSongStats(rating.song, rating.rating);
            }
        });

        alert('Ratings submitted successfully!');
        
        // Optional: Update any displayed statistics
        updateDisplayedStats();
    } catch (error) {
        console.error('Error saving ratings:', error);
        alert('Error saving ratings. Please try again.');
    }
}

function updateDisplayedStats() {
    // This function can be implemented later to refresh any 
    // displayed statistics after new ratings are submitted
    const songRankingsTab = document.getElementById('song-rankings-table');
    const showRatingsTab = document.getElementById('show-ratings-table');
    
    if (songRankingsTab) {
        // Update song rankings display
        const songStats = storage.getAllSongStats();
        // Implementation for updating song rankings display
    }
    
    if (showRatingsTab) {
        // Update show ratings display
        const showStats = storage.getAllShowRatings();
        // Implementation for updating show ratings display
    }
}

// Add event listeners for tabs
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app when the DOM is fully loaded
    init();
    
    // Add any additional event listeners here
    const submitButton = document.querySelector('button[onclick="submitRatings()"]');
    if (submitButton) {
        submitButton.addEventListener('click', submitRatings);
    }
});

// Initialize the app
init();
