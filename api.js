const apiKey = "10645D7F59011FFA82A"; // Replace with your actual API key

async function fetchShows() {
    // Use mock data if available
    if (window.mockShows) {
        console.log("Using mock show data");
        return window.mockShows;
    }
    
    try {
        console.log("Fetching shows from API..."); // Debug log
        const response = await fetch(`https://api.phish.net/v5/shows/artist/phish.json?apikey=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.data ? data.data.length : 0} shows`); // Debug log
        return data.data || [];
    } catch (error) {
        console.error("Error fetching shows:", error);
        throw error;
    }
}

async function fetchSetlist(date) {
    // Use mock data if available
    if (window.mockSetlists && window.mockSetlists[date]) {
        console.log("Using mock setlist data for", date);
        return window.mockSetlists[date];
    }
    
    try {
        console.log('Fetching setlist for date:', date);
        const response = await fetch(`https://api.phish.net/v5/setlists/showdate/${date}.json?apikey=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Setlist API response:', data);
        return data.data;
    } catch (error) {
        console.error("Error fetching setlist:", error);
        throw error;
    }
}
