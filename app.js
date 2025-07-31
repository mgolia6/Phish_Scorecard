async function init() {
  try {
    const shows = await fetchShows();
    const sortedShows = shows.sort((a, b) => new Date(b.showdate) - new Date(a.showdate));
    populateShowDropdown(sortedShows);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

async function loadShow() {
  const date = document.getElementById("showdate").value;
  if (!date) return alert("Please select a show date.");

  try {
    const setlistData = await fetchSetlist(date);
    displaySetlist(setlistData);
  } catch (error) {
    alert('Error loading show data: ' + error.message);
  }
}

function submitRatings() {
  // Your existing submit ratings logic
}

// Initialize the app
init();
async function loadShow() {
    const date = document.getElementById("showdate").value;
    if (!date) return alert("Please select a show date.");

    try {
        const setlistData = await fetchSetlist(date);
        if (setlistData && setlistData.length > 0) {
            const showData = setlistData[0];
            displayShowDetails(showData);
            displayShowNotes(showData.setlistnotes);
            displaySetlist(renderSetlistByGroup(setlistRaw);
        } else {
            throw new Error('No show data found');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading show data. Please try again.');
    }
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
