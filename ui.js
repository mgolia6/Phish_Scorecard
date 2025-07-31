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
    if (!setlistData || setlistData.length <= 1) {
        document.getElementById("setlist-table").innerHTML = "<p>No setlist data available.</p>";
        return;
    }

    // Group songs by set
    const songsBySet = {};
    for (let i = 1; i < setlistData.length; i++) {
        const entry = setlistData[i];
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
            setlistHTML += `
                <tr class="song-row">
                    <td class="song-name">${song.song || ''}</td>
                    <td class="jam-chart">${song.jamchart ? '✓' : ''}</td>
                    <td class="gap">${song.gap || 'N/A'}</td>
                    <td class="rating">
                        <select class="rating-select" onchange="updateSongRating(this)">
                            <option value="">--</option>
                            <option value="5">5 - Legendary</option>
                            <option value="4">4 - Great</option>
                            <option value="3">3 - Soliolid</option>
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

function displaySongRankings() {
    const songStats = storage.getAllSongStats();
    const sortedSongs = Object.entries(songStats)
        .map(([song, stats]) => ({
            song,
            averageRating: stats.totalRating / stats.count,
            count: stats.count
        }))
        .sort((a, b) => b.averageRating - a.averageRating);

    let html = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th>Song</th>
                    <th>Average Rating</th>
                    <th>Times Rated</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (sortedSongs.length === 0) {
        html += `
            <tr>
                <td colspan="3" style="text-align: center;">No ratings yet</td>
            </tr>
        `;
    } else {
        sortedSongs.forEach(song => {
            html += `
                <tr>
                    <td>${song.song}</td>
                    <td>${song.averageRating.toFixed(2)}</td>
                    <td>${song.count}</td>
                </tr>
            `;
        });
    }

    html += `
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
            rating: typeof rating === 'number' ? rating : rating.average || rating,
            timestamp: new Date().toISOString()
        }))
        .sort((a, b) => b.rating - a.rating);

    let html = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Rating</th>
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (sortedShows.length === 0) {
        html += `
            <tr>
                <td colspan="3" style="text-align: center;">No shows rated yet</td>
            </tr>
        `;
    } else {
        sortedShows.forEach(show => {
            html += `
                <tr>
                    <td>${show.date}</td>
                    <td>${show.rating.toFixed(2)}</td>
                    <td>${new Date(show.timestamp).toLocaleDateString()}</td>
                </tr>
            `;
        });
    }

    html += `
            </tbody>
        </table>
    `;

    document.getElementById('show-ratings-table').innerHTML = html;
}

function initializeShowSearch() {
    const searchInput = document.getElementById('show-search');
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchInput || !resultsContainer) return;
    
    searchInput.addEventListener('input', debounce(async (e) => {
        const searchTerm = e.target.value;
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        try {
            const shows = await fetchShows();
            const filteredShows = shows.filter(show => 
                show.showdate.includes(searchTerm) ||
                show.venue.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10);

            resultsContainer.innerHTML = filteredShows.map(show => `
                <div class="search-result" onclick="selectShow('${show.showdate}')">
                    <span class="result-date">${show.showdate}</span>
                    <span class="result-venue">${show.venue}</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error searching shows:', error);
            resultsContainer.innerHTML = '<div class="search-error">Error searching shows</div>';
        }
    }, 300));
}

function selectShow(date) {
    document.getElementById('show-search').value = date;
    document.getElementById('search-results').innerHTML = '';
    loadShow(date);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeShowSearch();
});
