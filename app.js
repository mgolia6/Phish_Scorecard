// REMOVE all import/export statements for classic browser scripts

// storage and supabase must be available globally via script tags before this file
// E.g.
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="supabaseClient.js"></script>
// <script src="storage.js"></script>

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
    console.log('Loading show:', date);
    const showDate = date || document.getElementById("show-search").value;
    if (!showDate) {
        alert("Please select or enter a show date.");
        return;
    }

    try {
        document.getElementById("setlist-table").innerHTML = '<div class="loading">Loading show data...</div>';

        const setlistData = await fetchSetlist(showDate);
        console.log("Setlist data:", setlistData);

        if (!setlistData || setlistData.length === 0) {
            document.getElementById("setlist-table").innerHTML = '<div class="error">No setlist found for this date.</div>';
            return;
        }

        const showData = setlistData[0];

        displayShowDetails(showData);
        displayShowNotes(showData.setlistnotes);
        displaySetlist(setlistData);

        // Load any existing ratings
        await loadExistingRatings(showDate);

    } catch (error) {
        console.error('Error loading show:', error);
        document.getElementById("setlist-table").innerHTML =
            '<div class="error">Error loading show data. Please try again.</div>';
    }
}

// --- Load Ratings for Current Show ---
async function loadExistingRatings(showDate) {
    const existingRatings = await storage.getRatings(showDate);
    if (!existingRatings || !Array.isArray(existingRatings)) return;

    existingRatings.forEach(rating => {
        const songRow = Array.from(document.querySelectorAll('.song-row'))
            .find(row => row.querySelector('.song-name').textContent === (rating.song || rating.song_name));
        if (songRow) {
            const ratingSelect = songRow.querySelector('.rating-select');
            const notesInput = songRow.querySelector('.notes-input');
            if (ratingSelect && (rating.rating !== undefined && rating.rating !== null)) {
                ratingSelect.value = rating.rating;
            }
            if (notesInput && rating.notes) {
                notesInput.value = rating.notes;
            }
        }
    });
    // calculateShowRating(); // <--- KEEP THIS COMMENTED OUT!
}

// --- Submit Ratings and Show Aggregates to Supabase ---
async function submitRatings() {
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
                jamChart: row.querySelector('.jam-chart')?.textContent.includes('✓') || false,
                gap: row.querySelector('.gap')?.textContent || null,
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
        // Save ratings to Supabase (uses current session user if available)
        let user_id = null;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) user_id = user.id;
        await storage.saveRatings(showDate, ratings, user_id);

        // Calculate and save show rating
        const setRatings = calculateSetRatings();
        const showRating = {
            average: Object.values(setRatings).reduce((a, b) => a + b, 0) / Object.keys(setRatings).length,
            setRatings: setRatings,
            timestamp: new Date().toISOString()
        };
        await storage.saveShowRating(showDate, showRating);

        alert('Ratings submitted successfully!');
        await updateDisplayedStats();

    } catch (error) {
        console.error('Error saving ratings:', error);
        alert('Error saving ratings. Please try again.');
    }
}

// --- Calculate Set Ratings for Current Show ---
function calculateSetRatings() {
    const setRatings = {};
    const setCounts = {};
    document.querySelectorAll('.song-row').forEach(row => {
        const ratingSelect = row.querySelector('.rating-select');
        const setHeader = row.closest('.set-section').querySelector('.set-header').textContent;
        const set = setHeader === 'Encore' ? 'E' : setHeader.split(' ')[1];
        if (ratingSelect.value) {
            if (!setRatings[set]) {
                setRatings[set] = 0;
                setCounts[set] = 0;
            }
            setRatings[set] += parseInt(ratingSelect.value, 10);
            setCounts[set] += 1;
        }
    });
    Object.keys(setRatings).forEach(set => {
        setRatings[set] = setCounts[set] ? setRatings[set] / setCounts[set] : 0;
    });
    return setRatings;
}

// --- Update UI Tabs with Latest Data ---
async function updateDisplayedStats() {
    // Fetch show ratings
    if (document.querySelector('#song-rankings.active')) {
        let allSongRatings = await storage.getAllRatings();
        displaySongRankings(allSongRatings);
    }
    if (document.querySelector('#show-ratings.active')) {
        let allShowRatings = await storage.getAllShowRatings();
        displayShowRatings(allShowRatings);
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('generate-show-rating-btn');
    if (btn && typeof calculateShowRating === 'function') {
        btn.addEventListener('click', calculateShowRating);
    }
});

// Attach submitRatings and loadShow to global scope for HTML button compatibility
window.submitRatings = submitRatings;
window.loadShow = loadShow;
