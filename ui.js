// UI functions for Phish Scorecard

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