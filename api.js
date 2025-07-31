const apiKey = "YOUR_API_KEY_HERE"; // Replace with your actual API key

async function fetchShows() {
    try {
        const response = await fetch(`https://api.phish.net/v5/shows/artist/phish.json?apikey=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching shows:", error);
        throw error;
    }
}

async function fetchSetlist(date) {
    try {
        const response = await fetch(`https://api.phish.net/v5/setlists/showdate/${date}.json?apikey=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching setlist:", error);
        throw error;
    }
}
