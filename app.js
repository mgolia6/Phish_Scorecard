async function init() {
    try {
        await loadAllShows();
        initializeShowSearch();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

async function loadAllShows() {
    try {
        const shows = await fetchShows();
        window.allShows = shows.sort((a, b) => new Date(b.showdate) - new Date(a.showdate));
        return window.allShows;
    } catch (error) {
        console.error('Error loading shows:', error);
        throw error;
    }
}

async function loadShow(date) {
    console.log('Loading show:', date); // Debug log
    const showDate = date || document.getElementById("show-search").value;
    if (!showDate) {
        alert("Please select or enter a show date.");
        return;
    }

    try {
        document.getElementById("setlist-table").innerHTML = '<div class="loading">Loading show data...</div>';
        
        const setlistData = await fetchSetlist(showDate);
        console.log("Setlist data:", setlistData); // Debug log
        
        if (!setlistData || setlistData.length === 0) {
            document.getElementById("setlist-table").innerHTML = '<div class="error">No setlist found for this date.</div>';
            return;
        }

        const showData = setlistData[0];
        
        displayShowDetails(showData);
        displayShowNotes(showData.setlistnotes);
        displaySetlist(setlistData);

        // Load any existing ratings
        loadExistingRatings(showDate);

    } catch (error) {
        console.error('Error loading show:', error);
        document.getElementById("setlist-table").innerHTML = 
            '<div class="error">Error loading show data. Please try again.</div>';
    }
}

function calculateSetRatings() {
    const setRatings = {};
    
    document.querySelectorAll('.song-row').forEach(row => {
        const ratingSelect = row.querySelector('.rating-select');
        const rating = parseInt(ratingSelect.value);
        const setHeader = row.closest('.set-section').querySelector('.set-header').textContent;
        
        // Extract set identifier (1, 2, E, etc.)
        const setId = setHeader === 'Encore' ? 'E' : setHeader.split(' ')[1];
        
        if (!isNaN(rating)) {
            if (!setRatings[setId]) {
                setRatings[setId] = { total: 0, count: 0 };
            }
            setRatings[setId].total += rating;
            setRatings[setId].count += 1;
        }
    });
    
    // Convert to averages
    const averages = {};
    Object.keys(setRatings).forEach(setId => {
        averages[setId] = setRatings[setId].total / setRatings[setId].count;
    });
    
    return averages;
}

function loadExistingRatings(showDate) {
    const existingRatings = storage.getRatings(showDate);
    if (!existingRatings) return;

    existingRatings.forEach(rating => {
        const songRow = Array.from(document.querySelectorAll('.song-row'))
            .find(row => row.querySelector('.song-name').textContent === rating.song);
        
        if (songRow) {
            const ratingSelect = songRow.querySelector('.rating-select');
            const notesInput = songRow.querySelector('.notes-input');
            
            if (ratingSelect && rating.rating) {
                ratingSelect.value = rating.rating;
            }
            if (notesInput && rating.notes) {
                notesInput.value = rating.notes;
            }
        }
    });

    calculateShowRating();
}

function submitRatings() {
    const showDate = document.getElementById("show-search").value;
    if (!showDate) {
        alert("Please select a show first.");
        return;
    }

    const ratings = [];
    let hasRatings = false;

    document.querySelectorAll('.song-row').forEach(row => {
        const songName = row.querySelector('.song-name').textContent;
        const ratingSelect = row.querySelector('.rating-select');
        const notesInput = row.querySelector('.notes-input');
        const setHeader = row.closest('.set-section').querySelector('.set-header').textContent;
        
        if (ratingSelect.value || notesInput.value) {
            hasRatings = true;
            ratings.push({
                song: songName,
                set: setHeader === 'Encore' ? 'E' : setHeader.split(' ')[1],
                rating: ratingSelect.value ? parseInt(ratingSelect.value) : null,
                notes: notesInput.value,
                jamChart: row.querySelector('.jam-chart').textContent.includes('✓'),
                gap: row.querySelector('.gap').textContent,
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
        // Save ratings
        storage.saveRatings(showDate, ratings);

        // Calculate and save show rating
        const setRatings = calculateSetRatings();
        const showRating = {
            average: Object.values(setRatings).reduce((a, b) => a + b, 0) / Object.keys(setRatings).length,
            setRatings: setRatings,
            timestamp: new Date().toISOString()
        };
        storage.saveShowRating(showDate, showRating);

        // Update song statistics
        ratings.forEach(rating => {
            if (rating.rating !== null) {
                storage.updateSongStats(rating.song, rating.rating);
            }
        });

        alert('Ratings submitted successfully!');
        updateDisplayedStats();
        
    } catch (error) {
        console.error('Error saving ratings:', error);
        alert('Error saving ratings. Please try again.');
    }
}

function updateDisplayedStats() {
    if (document.querySelector('#song-rankings.active')) {
        displaySongRankings();
    }
    if (document.querySelector('#show-ratings.active')) {
        displayShowRatings();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
