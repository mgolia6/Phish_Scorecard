// Utility debounce function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Helper to create phish.net show URL (timezone safe)
function getPhishNetShowUrl(show) {
    // Full month name, lowercase
    const months = [
        "january","february","march","april","may","june",
        "july","august","september","october","november","december"
    ];
    // Split the date string directly to avoid timezone offset
    const [year, monthStr, dayStr] = show.showdate.split("-");
    const month = months[parseInt(monthStr, 10) - 1];
    const day = parseInt(dayStr, 10);

    // Helper to slugify text
    const slug = (str) =>
        (str || "")
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "")
            .replace(/\s+/g, "-");

    // Assemble URL
    return `https://phish.net/setlists/phish-${month}-${day}-${year}-${slug(show.venue)}-${slug(show.city)}-${slug(show.state)}-${slug(show.country)}.html`;
}

// Display functions
function displayShowDetails(show) {
    const phishNetUrl = getPhishNetShowUrl(show);

    document.getElementById("show-details").innerHTML = `
        <h2>Show Details</h2>
        <p><strong>Date:</strong> ${show.showdate || 'N/A'}</p>
        <p><strong>Venue:</strong> ${show.venue || 'N/A'}</p>
        <p><strong>Location:</strong> ${show.city || 'N/A'}, ${show.state || 'N/A'}, ${show.country || 'N/A'}</p>
        <p>
            <a href="${phishNetUrl}" target="_blank" rel="noopener">
                View this show on phish.net
            </a>
        </p>
    `;
}

function displayShowNotes(notes) {
    document.getElementById("show-notes").innerHTML = `
        <div class="show-notes">
            <h2>Show Notes</h2>
            <p>${notes || "No notes available for this show."}</p>
        </div>
    `;
}

function displaySetlist(setlistData) {
    console.log('Displaying setlist data:', setlistData);

    if (!setlistData || setlistData.length <= 1) {
        console.log('No setlist data available');
        document.getElementById("setlist-table").innerHTML = "<p>No setlist data available.</p>";
        return;
    }

    // Group songs by set
    const songsBySet = {};
    for (let i = 1; i < setlistData.length; i++) {
        const entry = setlistData[i];
        console.log('Processing entry:', entry);
        if (!songsBySet[entry.set]) {
            songsBySet[entry.set] = [];
        }
        songsBySet[entry.set].push(entry);
    }

    let setlistHTML = '<h2>Setlist & Ratings</h2>';

    // Display each set
    Object.keys(songsBySet).forEach(setName => {
        setlistHTML += `
            <div class="set-section">
                <h3 class="set-header">${setName === 'E' ? 'Encore' : `Set ${setName}`}</h3>
                <table class="set-table">
                    <thead>
                        <tr>
                            <th>Song</th>
                            <th>Jam Chart</th>
                            <th>Gap</th>
                            <th>Rating (1-5)</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        songsBySet[setName].forEach(song => {
            // Convert song name to kebab-case for phish.net link
            const kebabSong = (song.song || '').toLowerCase()
                .replace(/[^a-z0-9\s]/g, '') // remove special chars
                .replace(/\s+/g, '-')        // spaces to hyphens
                .trim();

            const phishNetUrl = `https://phish.net/song/${kebabSong}`;

            setlistHTML += `
                <tr class="song-row">
                    <td class="song-name">
                        <a href="${phishNetUrl}" target="_blank" rel="noopener">
                            ${song.song || ''}
                        </a>
                    </td>
                    <td class="jam-chart">${song.isjamchart ? '✓' : ''}</td>
                    <td class="gap">${song.gap || 'N/A'}</td>
                    <td class="rating">
                        <select class="rating-select" onchange="updateSongRating(this)">
                            <option value="">--</option>
                            <option value="5">5 - Legendary</option>
                            <option value="4">4 - Great</option>
                            <option value="3">3 - Solid</option>
                            <option value="2">2 - Average</option>
                            <option value="1">1 - Below Average</option>
                        </select>
                    </td>
                    <td class="notes">
                        <input type="text" class="notes-input" placeholder="Add notes...">
                    </td>
                </tr>
            `;
        });

        setlistHTML += `
                    </tbody>
                </table>
            </div>
        `;
    });

    document.getElementById("setlist-table").innerHTML = setlistHTML;
}

// --- Search functions ---
function initializeShowSearch() {
    console.log("Initializing show search...");
    const searchInput = document.getElementById('show-search');
    const resultsContainer = document.getElementById('search-results');
    if (!searchInput || !resultsContainer) {
        console.error("Search elements not found");
        return;
    }

    searchInput.addEventListener('input', debounce(async function(e) {
        const searchTerm = e.target.value;
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        try {
            const shows = await fetchShows();
            console.log(`Fetched ${shows.length} shows`);

            const filteredShows = shows.filter(show =>
                show.showdate.includes(searchTerm) ||
                show.venue.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10);

            console.log(`Found ${filteredShows.length} matching shows`);

            if (filteredShows.length > 0) {
                resultsContainer.innerHTML = filteredShows.map(show => `
                    <div class="search-result" onclick="selectShow('${show.showdate}')">
                        <span class="result-date">${show.showdate}</span> -
                        <span class="result-venue">${show.venue}</span>
                    </div>
                `).join('');
            } else {
                resultsContainer.innerHTML = '<div class="search-result">No matches found</div>';
            }
        } catch (error) {
            console.error('Error searching shows:', error);
            resultsContainer.innerHTML = '<div class="search-error">Error searching shows</div>';
        }
    }, 200));

    // Close results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.innerHTML = '';
        }
    });
}

function selectShow(date) {
    console.log("Selecting show:", date);
    const searchInput = document.getElementById('show-search');
    const resultsContainer = document.getElementById('search-results');

    if (searchInput) searchInput.value = date;
    if (resultsContainer) resultsContainer.innerHTML = '';

    loadShow(date);
}

// --- Tab functions ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');

    if (tabId === 'song-rankings') {
        displaySongRankings();
    } else if (tabId === 'show-ratings') {
        displayShowRatings();
    }
}

// --- Ratings utility ---
function updateSongRating(selectElem) {
    calculateShowRating();
}

function calculateShowRating() {
    const setRatings = {};
    const setDetails = {};
    
    // Calculate ratings by set
    document.querySelectorAll('.song-row').forEach(row => {
        const ratingSelect = row.querySelector('.rating-select');
        const rating = parseInt(ratingSelect.value);
        const setHeader = row.closest('.set-section').querySelector('.set-header').textContent;
        
        // Extract set identifier (1, 2, E, etc.)
        const setId = setHeader === 'Encore' ? 'E' : setHeader.split(' ')[1];
        const setDisplayName = setHeader;
        
        if (!setDetails[setId]) {
            setDetails[setId] = { 
                displayName: setDisplayName,
                ratings: [],
                total: 0,
                count: 0
            };
        }
        
        if (!isNaN(rating)) {
            setDetails[setId].ratings.push(rating);
            setDetails[setId].total += rating;
            setDetails[setId].count += 1;
        }
    });
    
    // Calculate averages and build display
    let ratingsHTML = '';
    let overallTotal = 0;
    let overallCount = 0;
    let hasRatings = false;
    
    if (Object.keys(setDetails).length > 0) {
        ratingsHTML += '<div class="ratings-summary"><h3>Show Ratings</h3>';
        
        // Display set ratings
        ratingsHTML += '<div class="set-ratings">';
        Object.keys(setDetails).sort().forEach(setId => {
            const set = setDetails[setId];
            if (set.count > 0) {
                hasRatings = true;
                const average = set.total / set.count;
                setRatings[setId] = average;
                overallTotal += set.total;
                overallCount += set.count;
                
                ratingsHTML += `
                    <div class="set-rating">
                        <strong>${set.displayName}:</strong> ${average.toFixed(2)} (${set.count} songs)
                    </div>
                `;
            }
        });
        ratingsHTML += '</div>';
        
        // Display overall rating
        if (hasRatings) {
            const overallAverage = overallTotal / overallCount;
            ratingsHTML += `
                <div class="show-rating">
                    <strong>Overall Average:</strong> ${overallAverage.toFixed(2)} (${overallCount} songs rated)
                </div>
            `;
        }
        
        ratingsHTML += '</div>';
    }
    
    // Only update the main show-rating div to avoid duplication
    document.getElementById('show-rating').innerHTML = ratingsHTML;
}

// --- Random Show Generator ---
async function showRandomShow() {
    try {
        const shows = await fetchShows();
        if (shows.length === 0) return;
        const randomIdx = Math.floor(Math.random() * shows.length);
        const randomShow = shows[randomIdx];
        if (randomShow && randomShow.showdate) {
            loadShow(randomShow.showdate);
        }
    } catch (err) {
        alert("Could not load a random show.");
        console.error(err);
    }
}

// --- Display functions for rankings and ratings ---
function displaySongRankings() {
    // This function displays song rankings in the Song Rankings tab
    // Implementation would show statistics for all rated songs
    const songStats = storage.getAllSongStats();
    let rankingsHTML = '<h2>Song Rankings</h2>';
    
    if (Object.keys(songStats).length === 0) {
        rankingsHTML += '<p>No song ratings available yet. Rate some songs to see rankings!</p>';
    } else {
        rankingsHTML += `
            <table class="rankings-table">
                <thead>
                    <tr>
                        <th>Song</th>
                        <th>Average Rating</th>
                        <th>Times Rated</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Sort songs by average rating
        const sortedSongs = Object.entries(songStats)
            .map(([song, stats]) => ({
                song,
                average: stats.totalRating / stats.count,
                count: stats.count,
                lastUpdated: stats.lastUpdated
            }))
            .sort((a, b) => b.average - a.average);
        
        sortedSongs.forEach(song => {
            const lastUpdated = song.lastUpdated ? new Date(song.lastUpdated).toLocaleDateString() : 'N/A';
            rankingsHTML += `
                <tr>
                    <td>${song.song}</td>
                    <td>${song.average.toFixed(2)}</td>
                    <td>${song.count}</td>
                    <td>${lastUpdated}</td>
                </tr>
            `;
        });
        
        rankingsHTML += '</tbody></table>';
    }
    
    document.getElementById('song-rankings-table').innerHTML = rankingsHTML;
}

function displayShowRatings() {
    // This function displays show ratings in the Show Ratings tab
    const showRatings = storage.getAllShowRatings();
    let ratingsHTML = '<h2>Show Ratings</h2>';
    
    if (Object.keys(showRatings).length === 0) {
        ratingsHTML += '<p>No show ratings available yet. Rate some shows to see your ratings!</p>';
    } else {
        ratingsHTML += `
            <table class="rankings-table">
                <thead>
                    <tr>
                        <th>Show Date</th>
                        <th>Overall Rating</th>
                        <th>Set Ratings</th>
                        <th>Date Rated</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Sort shows by date (newest first)
        const sortedShows = Object.entries(showRatings)
            .sort(([a], [b]) => new Date(b) - new Date(a));
        
        sortedShows.forEach(([showDate, rating]) => {
            const setRatingsDisplay = Object.entries(rating.setRatings || {})
                .map(([set, avg]) => `${set === 'E' ? 'Encore' : `Set ${set}`}: ${avg.toFixed(2)}`)
                .join(', ');
            const dateRated = rating.timestamp ? new Date(rating.timestamp).toLocaleDateString() : 'N/A';
            
            ratingsHTML += `
                <tr>
                    <td>${showDate}</td>
                    <td>${rating.average.toFixed(2)}</td>
                    <td>${setRatingsDisplay || 'N/A'}</td>
                    <td>${dateRated}</td>
                </tr>
            `;
        });
        
        ratingsHTML += '</tbody></table>';
    }
    
    document.getElementById('show-ratings-table').innerHTML = ratingsHTML;
}

// --- Document ready ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Document ready, initializing...");
    initializeShowSearch();
    // If you need to load a show on page load, call loadShow() here
    // Optionally: showTab('default-tab-id');

    // Attach random show generator button handler
    const randomBtn = document.getElementById('random-show-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', showRandomShow);
    }
});
