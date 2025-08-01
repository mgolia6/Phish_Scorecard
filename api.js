const apiKey = "10645D7F59011FFA82A"; // Replace with your actual API key

// Mock data for testing
const mockShows = [
    {
        showdate: "2023-07-28",
        venue: "Madison Square Garden",
        city: "New York",
        state: "NY",
        country: "USA"
    },
    {
        showdate: "2023-08-01",
        venue: "Merriweather Post Pavilion",
        city: "Columbia",
        state: "MD", 
        country: "USA"
    }
];

const mockSetlistData = {
    "2023-07-28": [
        {
            showdate: "2023-07-28",
            venue: "Madison Square Garden",
            city: "New York",
            state: "NY",
            country: "USA",
            setlistnotes: "Tweezer reprise tease in Set 2. First 'Destiny Unbound' since 2019."
        },
        { set: "1", song: "AC/DC Bag", position: 1, isjamchart: true, gap: 5 },
        { set: "1", song: "Destiny Unbound", position: 2, isjamchart: false, gap: 100 },
        { set: "1", song: "Wilson", position: 3, isjamchart: false, gap: 20 },
        { set: "2", song: "Tweezer", position: 1, isjamchart: true, gap: 2 },
        { set: "2", song: "Ghost", position: 2, isjamchart: true, gap: 15 },
        { set: "E", song: "Loving Cup", position: 1, isjamchart: false, gap: 10 }
    ],
    "2023-08-01": [
        {
            showdate: "2023-08-01",
            venue: "Merriweather Post Pavilion",
            city: "Columbia",
            state: "MD",
            country: "USA",
            setlistnotes: "Great jamming throughout. Fluffhead closer was epic."
        },
        { set: "1", song: "Fluffhead", position: 1, isjamchart: true, gap: 3 },
        { set: "1", song: "Maze", position: 2, isjamchart: false, gap: 25 },
        { set: "2", song: "Weekapaug Groove", position: 1, isjamchart: true, gap: 8 },
        { set: "E", song: "Bold As Love", position: 1, isjamchart: false, gap: 50 }
    ]
};

async function fetchShows() {
    try {
        console.log("Fetching shows from API..."); // Debug log
        
        // Try real API first, fallback to mock data
        try {
            const response = await fetch(`https://api.phish.net/v5/shows/artist/phish.json?apikey=${apiKey}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Fetched ${data.data ? data.data.length : 0} shows`); // Debug log
            return data.data || [];
        } catch (apiError) {
            console.log("API failed, using mock data");
            return mockShows;
        }
    } catch (error) {
        console.error("Error fetching shows:", error);
        // Return mock data as fallback
        return mockShows;
    }
}

async function fetchSetlist(date) {
    try {
        console.log('Fetching setlist for date:', date);
        
        // Try real API first, fallback to mock data
        try {
            const response = await fetch(`https://api.phish.net/v5/setlists/showdate/${date}.json?apikey=${apiKey}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Setlist API response:', data);
            return data.data;
        } catch (apiError) {
            console.log("Setlist API failed, using mock data for", date);
            return mockSetlistData[date] || [];
        }
    } catch (error) {
        console.error("Error fetching setlist:", error);
        // Return mock data as fallback
        return mockSetlistData[date] || [];
    }
}
