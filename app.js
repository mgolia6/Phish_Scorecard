async function init() {
    try {
        await loadAllShows(); // Load shows into memory for search
        initializeShowSearch();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing application. Please refresh the page.');
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
    const showDate = date || document.getElementById("show-search").value;
    if (!showDate) {
        alert("Please select or enter a show date.");
        return;
    }

    console.log("Loading show for date:", showDate); // Add this line

    try {
        document.getElementById("setlist-table").innerHTML = '<div class="loading">Loading show data...</div>';
        
        const setlistData = await fetchSetlist(showDate);
        console.log("Setlist data received:", setlistData); // Add this line
        
        if (!setlistData || !setlistData.length) {
            document.getElementById("setlist-table").innerHTML = '<div class="error">No setlist found for this date.</div>';
            return;
        }

        const showData = setlistData[0];
        
        displayShowDetails(showData);
        displayShowNotes(showData.setlistnotes);
        displaySetlist(setlistData);

        loadExistingRatings(showDate);

    } catch (error) {
        console.error('Error loading show:', error);
        document.getElementById("setlist-table").innerHTML = 
            '<div class="error">Error loading show data. Please try again.</div>';
    }
}

function loadExistingRatings(showDate) {
    const existingRatings = storage.getRatings(showDate);
    if (!existingRatings) return;

    // Populate existing ratings and notes
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

    // Recalculate ratings
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
    // Update song rankings if that tab is active
    if (document.querySelector('#song-rankings.active')) {
        displaySongRankings();
    }
    
    // Update show ratings if that tab is active
    if (document.querySelector('#show-ratings.active')) {
        displayShowRatings();
    }
}

function displaySongRankings() {
    const songStats = storage.getAllSongStats();
    const sortedSongs = Object.entries(songStats)
        .map(([song, stats]) => ({
            song,
            averageRating: stats.totalRating / stats.count,
            count: stats.count,
            jamChartCount: stats.jamChartCount || 0
        }))
        .sort((a, b) => b.averageRating - a.averageRating);

    const html = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th>Song</th>
                    <th>Average Rating</th>
                    <th>Times Rated</th>
                    <th>Jam Charts</th>
                </tr>
            </thead>
            <tbody>
                ${sortedSongs.map(song => `
                    <tr>
                        <td>${song.song}</td>
                        <td>${song.averageRating.toFixed(2)}</td>
                        <td>${song.count}</td>
                        <td>${song.jamChartCount}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('song-rankings-table').innerHTML = html;
}

function displayShowRatings() {
    const showRatings = storage.getAllShowRatings();
    const sortedShows = Object.entries(showRatings)
        .map(([date, rating]) => ({
            date,
            rating: rating.average,
            setRatings: rating.setRatings,
            timestamp: new Date(rating.timestamp)
        }))
        .sort((a, b) => b.rating - a.rating);

    const html = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Average Rating</th>
                    <th>Set Details</th>
                    <th>Rated On</th>
                </tr>
            </thead>
            <tbody>
                ${sortedShows.map(show => `
                    <tr>
                        <td>${show.date}</td>
                        <td>${show.rating.toFixed(2)}</td>
                        <td>${Object.entries(show.setRatings)
                            .map(([set, rating]) => `${set}: ${rating.toFixed(2)}`)
                            .join(', ')}</td>
                        <td>${show.timestamp.toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('show-ratings-table').innerHTML = html;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
