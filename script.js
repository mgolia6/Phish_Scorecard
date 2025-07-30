// Sample data structure (replace with actual API call or JSON file)
const data = {
  data: [
    {
      showdate: "2023-07-28",
      venue: "Madison Square Garden",
      city: "New York",
      state: "NY",
      country: "USA",
      setlistnotes: "Tweezer reprise tease in Set 2. First 'Destiny Unbound' since 2019."
    }
  ],
  setlistdata: [
    { set: "Set 1", song: "AC/DC Bag", position: 1, jamchart: true, gap: 5 },
    { set: "Set 1", song: "Destiny Unbound", position: 2, jamchart: false, gap: 100 },
    { set: "Set 2", song: "Tweezer", position: 1, jamchart: true, gap: 2 },
    { set: "Encore", song: "Loving Cup", position: 1, jamchart: false, gap: 10 }
  ]
};

// Show Details
const show = data.data[0];
const songCount = data.setlistdata.length;

document.getElementById("show-details").innerHTML = `
  <h2>📅 Show Details</h2>
  <p><strong>Date:</strong> ${show.showdate}</p>
  <p><strong>Venue:</strong> ${show.venue}</p>
  <p><strong>Location:</strong> ${show.city}, ${show.state}, ${show.country}</p>
  <p><strong>Song Count:</strong> ${songCount}</p>
`;

// Show Notes
document.getElementById("show-notes").innerHTML = `
  <h2>📝 Show Notes</h2>
  <p>${show.setlistnotes}</p>
`;

// Rating Guide
document.getElementById("rating-guide").innerHTML = `
  <h2>🎚️ Rating Guide</h2>
  <ul>
    <li><strong>5:</strong> Legendary performance</li>
    <li><strong>4:</strong> Must-hear version</li>
    <li><strong>3:</strong> Solid, above average</li>
    <li><strong>2:</strong> Standard, nothing special</li>
    <li><strong>1:</strong> Below average or flubbed</li>
  </ul>
`;

// Setlist Table
let tableHTML = `
  <h2>🎶 Setlist Ratings</h2>
  <table>
    <thead>
      <tr>
        <th>Set</th>
        <th>Song</th>
        <th>Position</th>
        <th>Jam Chart</th>
        <th>Gap</th>
        <th>Rating</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
`;

data.setlistdata.forEach((song, index) => {
  tableHTML += `
    <tr>
      <td>${song.set}</td>
      <td>${song.song}</td>
      <td>${song.position}</td>
      <td>${song.jamchart ? "✅" : ""}</td>
      <td>${song.gap}</td>
      <td>
        <select id="rating-${index}">
          <option value="">--</option>
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>
      </td>
      <td><textarea id="notes-${index}" rows="1"></textarea></td>
    </tr>
  `;
});

tableHTML += `</tbody></table>`;
document.getElementById("setlist-table").innerHTML = tableHTML;
