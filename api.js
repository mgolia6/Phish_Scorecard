const apiKey = "10645D7F59011FFA82A"; // Replace with your actual API key

// Mock shows data for testing
const mockShows = [
    { showdate: "2023-07-28", venue: "Madison Square Garden", city: "New York", state: "NY", country: "USA" },
    { showdate: "2023-07-29", venue: "Madison Square Garden", city: "New York", state: "NY", country: "USA" },
    { showdate: "2023-12-31", venue: "Madison Square Garden", city: "New York", state: "NY", country: "USA" },
    { showdate: "2024-04-20", venue: "The Sphere", city: "Las Vegas", state: "NV", country: "USA" },
    { showdate: "2024-04-21", venue: "The Sphere", city: "Las Vegas", state: "NV", country: "USA" }
];

async function fetchShows() {
    try {
        console.log("Fetching shows from API..."); // Debug log
        
        // Try actual API first, fallback to mock data if blocked
        try {
            const response = await fetch(`https://api.phish.net/v5/shows/artist/phish.json?apikey=${apiKey}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`Fetched ${data.data ? data.data.length : 0} shows`); // Debug log
                return data.data || [];
            }
        } catch (apiError) {
            console.log("API blocked, using mock data");
        }
        
        // Return mock data
        console.log(`Using mock data: ${mockShows.length} shows`);
        return mockShows;
    } catch (error) {
        console.error("Error fetching shows:", error);
        throw error;
    }
}

// Mock setlist data for testing
const mockSetlists = {
    "2023-07-28": [
        { showdate: "2023-07-28", venue: "Madison Square Garden", city: "New York", state: "NY", country: "USA", setlistnotes: "Incredible first night back at the Garden. Hood opener was a surprise!" },
        { set: "1", song: "Harry Hood", position: 1, isjamchart: false, gap: 0 },
        { set: "1", song: "Sample in a Jar", position: 2, isjamchart: false, gap: 15 },
        { set: "1", song: "Wolfman's Brother", position: 3, isjamchart: true, gap: 25 },
        { set: "1", song: "Fluffhead", position: 4, isjamchart: false, gap: 40 },
        { set: "1", song: "You Enjoy Myself", position: 5, isjamchart: true, gap: 2 },
        { set: "2", song: "Tweezer", position: 1, isjamchart: true, gap: 1 },
        { set: "2", song: "Carini", position: 2, isjamchart: false, gap: 15 },
        { set: "2", song: "Harry Hood", position: 3, isjamchart: true, gap: 8 },
        { set: "2", song: "Character Zero", position: 4, isjamchart: false, gap: 20 },
        { set: "E", song: "Loving Cup", position: 1, isjamchart: false, gap: 5 }
    ],
    "2023-12-31": [
        { showdate: "2023-12-31", venue: "Madison Square Garden", city: "New York", state: "NY", country: "USA", setlistnotes: "NYE show with incredible third set and countdown jam!" },
        { set: "1", song: "Wilson", position: 1, isjamchart: false, gap: 0 },
        { set: "1", song: "Divided Sky", position: 2, isjamchart: false, gap: 10 },
        { set: "1", song: "Ghost", position: 3, isjamchart: true, gap: 5 },
        { set: "1", song: "The Moma Dance", position: 4, isjamchart: false, gap: 30 },
        { set: "2", song: "Simple", position: 1, isjamchart: true, gap: 2 },
        { set: "2", song: "Piper", position: 2, isjamchart: true, gap: 12 },
        { set: "2", song: "Free", position: 3, isjamchart: false, gap: 25 },
        { set: "3", song: "Auld Lang Syne", position: 1, isjamchart: false, gap: 0 },
        { set: "3", song: "Down with Disease", position: 2, isjamchart: true, gap: 1 },
        { set: "E", song: "Tweezer Reprise", position: 1, isjamchart: false, gap: 3 }
    ]
};

async function fetchSetlist(date) {
    try {
        console.log('Fetching setlist for date:', date);
        
        // Try actual API first, fallback to mock data if blocked
        try {
            const response = await fetch(`https://api.phish.net/v5/setlists/showdate/${date}.json?apikey=${apiKey}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Setlist API response:', data);
                return data.data;
            }
        } catch (apiError) {
            console.log("API blocked, using mock data");
        }
        
        // Return mock data if available
        if (mockSetlists[date]) {
            console.log(`Using mock setlist for ${date}`);
            return mockSetlists[date];
        } else {
            console.log(`No mock data available for ${date}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching setlist:", error);
        throw error;
    }
}
