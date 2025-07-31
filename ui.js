// Utility functions should be defined first
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

// Display functions
function displayShowDetails(show) {
    document.getElementById("show-details").innerHTML = `
        <h2>Show Details</h2>
        <p><strong>Date:</strong> ${show.showdate || 'N/A'}</p>
        <p><strong>Venue:</strong> ${show.venue || 'N/A'}</p>
        <p><strong>Location:</strong> ${show.city || 'N/A'}, ${show.state || 'N/A'}, ${show.country || 'N/A'}</p>
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
                <h3 class=ss="set-header">${setName === 'E' ? 'Encore' : `Set ${setName}`}</h3>
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
            setlistHTML += `
                <tr class="song-row">
                    <td class="song-name">${song.song || ''}</td>
                    <td class="jam-chart">${song.jamchart ? '✓' : ''}</td>
                    <td class="gap">${song.gap || 'N/A'}</td>
                    <td class="rating">
                        <select class="rating-select" onchange="updateSongRating(this)">
                            <option value=ue="">--</option>
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

    setlistHTML += `
        <div class="ratings-summary">
            <h3>Set Ratings</h3>
            <div class="set-ratings">
                ${Object.keys(songsBySet).map(setName => `
                    <div class="set-rating">
                        <span>${setName === 'E' ? 'Encore' : `Set ${setName}`}:</span>
                        <span id="set-${setName}-rating">-</span>
                    </div>
                `).join('')}
            </div>
            <div class="show-rating-container">
                <button onclick="calculateShowRating()" class="calculate-button">Calculate Show Rating</button>
                <div id="show-rating" class="show-rating"></div>
            </div>
        </div>
    `;

    document.getElementById("setlist-table").innerHTML = setlistHTML;
}

// Rating functions
function updateSongRating(selectElement) {
    calculateSetRatings();
}

function calculateSetRatings() {
    const sets = {};
    document.querySelectorAll('.set-section').forEach(section => {
        const setName = section.querySelector('.set-header').textContent;
        const ratings = Array.from(section.querySelectorAll('.rating-select'))
            .map(select => parseInt(select.value))
            .filter(rating => !isNaN(rating));
        
        if (ratings.length > 0) {
            const average = ratings.reduce((a, b) => a + b) / ratings.length;
            sets[setName] = average;
            document.getElementById(`set-${setName === 'Encore' ? 'E' : setName.split(' ')[1]}-rating`)
                .textContent = average.toFixed(2);
        }
    });
    return sets;
}

function calculateShowRating() {
    const setRatings = calculateSetRatings();
    const ratings = Object.values(setRatings);
    
    if (ratings.length === 0) {
        document.getElementById('show-rating').innerHTML = 
            '<p class="no-ratings">No ratings entered yet</p>';
        return;
    }

    const average = ratings.reduce((a, b) => a + b) / ratings.length;
    const formattedRating = average.toFixed(2);
    
    const ratedSongs = document.querySelectorAll('.rating-select')
        .length;
    
    document.getElementById('show-rating').innerHTML = `
        <div class="rating-details">
            <h4>Show Rating: ${formattedRating}</h4>
            <p>Songs Rated: ${ratedSongs}</p>
            <div class="rating-breakdown">
                ${Object.entries(setRatings).map(([set, rating]) => `
                    <p>${set}: ${rating.toFixed(2)}</p>
                `).join('')}
            </div>
        </div>
    `;
}

// Search functions
function initializeShowSearch() {
    console.log("Initializing show search...");
    const searchInput = document.getElementById('show-search');
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchInput || !resultsContainer) {
        console.error("Search elements not found");
        return;
    }

    searchInput.addEventListener('input', async function(e) {
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
    });

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

// Tab functions
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

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("Document ready, initializing...");
    initializeShowSearch();
});
