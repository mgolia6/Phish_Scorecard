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

    setlistHTML += `
        <div class="ratings-summary">
            <!-- Ratings summary will go here -->
        </div>
    `;

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

    // Tab content will be displayed but no dynamic loading for now
}

// --- Ratings utility ---
function updateSongRating(selectElem) {
    calculateShowRating();
}

function calculateShowRating() {
    const ratings = Array.from(document.querySelectorAll('.rating-select'))
        .map(select => parseInt(select.value))
        .filter(val => !isNaN(val));
    if (ratings.length === 0) {
        document.getElementById('show-rating').innerHTML = '';
        return;
    }
    const average = ratings.reduce((a, b) => a + b) / ratings.length;
    document.getElementById('show-rating').innerHTML = `
        <div class="rating-details">
            <h4>Show Rating: ${average.toFixed(2)}</h4>
            <p>Songs Rated: ${ratings.length}</p>
        </div>
    `;
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

    // Attach generate show rating button handler
    const generateRatingBtn = document.getElementById('generate-show-rating-btn');
    if (generateRatingBtn) {
        generateRatingBtn.addEventListener('click', calculateShowRating);
    }
});
