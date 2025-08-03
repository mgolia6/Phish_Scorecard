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

function loadExistingRatings(showDate) {
    supabaseStorage.getRatings(showDate).then(existingRatings => {
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
    }).catch(error => {
        console.error('Error loading existing ratings:', error);
    });

    // calculateShowRating(); // <--- KEEP THIS COMMENTED OUT!
}

async function submitRatings() {
    const showDate = document.getElementById("show-search").value;
    if (!showDate) {
        alert("Please select a show first.");
        return;
    }

    // Check if user is logged in
    const user = await supabaseStorage.getCurrentUser();
    if (!user) {
        alert("Please log in to submit ratings.");
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
        // Save ratings to Supabase
        await supabaseStorage.saveRatings(showDate, ratings);

        // Calculate and save show rating
        const setRatings = calculateSetRatings();
        const showRating = {
            average: Object.values(setRatings).reduce((a, b) => a + b, 0) / Object.keys(setRatings).length,
            setRatings: setRatings,
            timestamp: new Date().toISOString()
        };
        await supabaseStorage.saveShowRating(showDate, showRating);

        alert('Ratings submitted successfully!');
        updateDisplayedStats();
        
    } catch (error) {
        console.error('Error saving ratings:', error);
        alert('Error saving ratings: ' + error.message);
    }
}

function updateDisplayedStats() {
    if (document.querySelector('#song-rankings.active')) {
        displaySongRankings();
    }
    if (document.querySelector('#show-ratings.active')) {
        displayShowRatings();
    }
    if (document.querySelector('#unique-song-rankings.active')) {
        displayUniqueSongRankings();
    }
}

// Helper function to calculate set ratings
function calculateSetRatings() {
    const setRatings = {};
    const setSections = document.querySelectorAll('.set-section');
    
    setSections.forEach(setSection => {
        const setHeader = setSection.querySelector('.set-header').textContent;
        const setId = setHeader === 'Encore' ? 'E' : setHeader.split(' ')[1];
        
        const ratingSelects = setSection.querySelectorAll('.rating-select');
        const ratings = Array.from(ratingSelects)
            .map(select => parseInt(select.value))
            .filter(val => !isNaN(val));
        
        if (ratings.length > 0) {
            setRatings[setId] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        }
    });
    
    return setRatings;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// Attach the generate show rating button only after DOM and all scripts are loaded
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('generate-show-rating-btn');
    if (btn && typeof calculateShowRating === 'function') {
        btn.addEventListener('click', calculateShowRating);
    }
});
