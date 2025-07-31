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
            addCalculateButton(); // Add this line to ensure the calculate button is added
        } else {
            throw new Error('No show data found');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading show data. Please try again.');
    }
}

function addCalculateButton() {
    const setlistTable = document.getElementById('setlist-table');
    if (setlistTable) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';
        buttonContainer.style.textAlign = 'right';
        
        const calculateButton = document.createElement('button');
        calculateButton.textContent = 'Calculate Show Rating';
        calculateButton.onclick = calculateAverage;
        
        const ratingSpan = document.createElement('span');
        ratingSpan.id = 'show-rating';
        ratingSpan.style.marginLeft = '10px';
        
        buttonContainer.appendChild(calculateButton);
        buttonContainer.appendChild(ratingSpan);
        setlistTable.appendChild(buttonContainer);
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
    const showRatingElement = document.getElementById('show-rating');
    if (showRatingElement) {
        showRatingElement.innerHTML = `<strong>Show Rating:</strong> ${average}`;
    } else {
        console.error('Show rating element not found');
    }
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
        // Save to local storage (assuming storage object is defined elsewhere)
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
        
        // Update displayed average
        calculateAverage();
    } catch (error) {
        console.error('Error saving ratings:', error);
        alert('Error saving ratings. Please try again.');
    }
}

function updateDisplayedStats() {
    // Implementation for updating displayed statistics
    // This can be expanded as needed
}

// Add event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    const submitButton = document.querySelector('button[onclick="submitRatings()"]');
    if (submitButton) {
        submitButton.addEventListener('click', submitRatings);
    }
});

// Initialize the app
init();
