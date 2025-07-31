function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });

  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
}

function populateShowDropdown(shows) {
  const showSelect = document.getElementById('showdate');
  showSelect.innerHTML = '<option value="">-- Choose a date --</option>';
  shows.forEach(show => {
    const option = document.createElement('option');
    option.value = show.showdate;
    option.textContent = `${show.showdate} - ${show.venue}`;
    showSelect.appendChild(option);
  });
}

function displaySetlist(setlistData) {
  const showDetails = document.getElementById("show-details");
  const showNotes = document.getElementById("show-notes");
  const setlistTable = document.getElementById("setlist-table");

  const show = setlistData.data[0];
  const setlistRaw = show.setlistdata || "";

  // Show Details
  showDetails.innerHTML = `
    <h2>Show Details</h2>
    <p><strong>Date:</strong> ${show.showdate}</p>
    <p><strong>Venue:</strong> ${show.venue}</p>
    <p><strong>Location:</strong> ${show.city}, ${show.state}, ${show.country}</p>
  `;

  // Show Notes
  showNotes.innerHTML = `
    <div class="show-notes">
      <strong>Notes:</strong> ${show.setlistnotes || "No notes available."}
    </div>
  `;

  // Render grouped setlist
  renderSetlistByGroup(setlistRaw);
}
function renderSetlistByGroup(setlistRaw) {
  const container = document.getElementById("setlist-table");
  container.innerHTML = "";

  const sets = setlistRaw.split(/\n(?=Set|Encore)/); // Split by "Set 1", "Set 2", "Encore", etc.

  sets.forEach((setBlock, setIndex) => {
    const lines = setBlock.trim().split(/\n|,|>/).filter(line => line.trim());
    const setLabel = lines.shift(); // First line is "Set 1", "Encore", etc.

    let html = `<h3 style="color:#ff6600;">${setLabel}</h3><table><tr>
      <th>Song</th><th>Jam Chart</th><th>Gap</th><th>Rating</th><th>Notes</th></tr>`;

    lines.forEach((song, i) => {
      html += `<tr>
        <td>${song}</td>
        <td><input type="text" /></td>
        <td><input type="text" /></td>
        <td>
          <select id="rating-${setIndex}-${i}">
            <option value="">--</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </td>
        <td><textarea id="notes-${setIndex}-${i}" rows="1"></textarea></td>
      </tr>`;
    });

    html += "</table>";
    container.innerHTML += html;
  });
}


function calculateAverage() {
  // Your existing average calculation logic
}
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
    let setlistHTML = `
        <h2>Setlist & Ratings</h2>
        <table>
            <thead>
                <tr>
                    <th>Set</th>
                    <th>Song</th>
                    <th>Jam Chart</th>
                    <th>Gap</th>
                    <th>Rating (1-5)</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (setlistData.length <= 1) {
        setlistHTML += '<tr><td colspan="6">No setlist data available for this show.</td></tr>';
    } else {
        // Skip the first entry as it's the show info
        for (let i = 1; i < setlistData.length; i++) {
            const entry = setlistData[i];
            setlistHTML += `
                <tr>
                    <td>${entry.set || ''}</td>
                    <td>${entry.song || ''}</td>
                    <td>${entry.jamchart ? '✓' : ''}</td>
                    <td>${entry.gap || 'N/A'}</td>
                    <td>
                        <select style="width: 60px;">
                            <option value="">--</option>
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                        </select>
                    </td>
                    <td><input type="text" style="width: 100%;" placeholder="Add notes..."></td>
                </tr>
            `;
        }
    }

    setlistHTML += `
        </tbody>
    </table>
    <div style="margin-top: 20px; text-align: right;">
        <button onclick="calculateAverage()">Calculate Show Rating</button>
        <span id="show-rating" style="margin-left: 10px;"></span>
    </div>
    `;

    document.getElementById("setlist-table").innerHTML = setlistHTML;
}
