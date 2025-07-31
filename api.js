const apiKey = "10645D7F59011FFA82A";

async function fetchShows() {
  try {
    console.log('Fetching shows...');
    const response = await fetch(`https://api.phish.net/v5/shows/artist/phish.json?apikey=${apiKey}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching shows:', error);
    throw error;
  }
}

async function fetchSetlist(date) {
    console.log("Fetching setlist for date:", date); // Add this line
    const response = await fetch(`https://api.phish.net/v5/setlists/showdate/${date}.json?apikey=${apiKey}`);
    const data = await response.json();
    console.log("API response:", data); // Add this line
    return data.data; // Make sure we're returning data.data
}
