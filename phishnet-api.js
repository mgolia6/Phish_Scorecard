const axios = require('axios');

const API_KEY = process.env.PHISH_NET_API_KEY || '10645D7F59011FFA82A';
const BASE_URL = 'https://api.phish.net/v5';

// Cache for shows to reduce API calls
const showsCache = {
  data: null,
  timestamp: null,
  ttl: 3600000 // 1 hour in milliseconds
};

// Fetch all shows from Phish.net
async function fetchAllShows() {
  // Check cache
  if (showsCache.data && Date.now() - showsCache.timestamp < showsCache.ttl) {
    console.log('Returning cached shows');
    return showsCache.data;
  }

  try {
    console.log('Fetching shows from Phish.net API...');
    const response = await axios.get(`${BASE_URL}/shows/artist/phish.json`, {
      params: { apikey: API_KEY }
    });

    const shows = response.data.data || [];
    
    // Update cache
    showsCache.data = shows;
    showsCache.timestamp = Date.now();

    console.log(`Fetched and cached ${shows.length} shows`);
    return shows;
  } catch (error) {
    console.error('Error fetching shows from Phish.net:', error.message);
    throw new Error('Failed to fetch shows from Phish.net API');
  }
}

// Fetch setlist for a specific show date
async function fetchSetlist(showDate) {
  try {
    console.log(`Fetching setlist for ${showDate}...`);
    const response = await axios.get(`${BASE_URL}/setlists/showdate/${showDate}.json`, {
      params: { apikey: API_KEY }
    });

    const setlistData = response.data.data || [];
    console.log(`Fetched setlist with ${setlistData.length} entries`);
    return setlistData;
  } catch (error) {
    console.error(`Error fetching setlist for ${showDate}:`, error.message);
    throw new Error(`Failed to fetch setlist for ${showDate}`);
  }
}

// Search shows by date or venue
async function searchShows(searchTerm) {
  try {
    const shows = await fetchAllShows();
    
    const filtered = shows.filter(show =>
      show.showdate.includes(searchTerm) ||
      (show.venue && show.venue.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (show.city && show.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.slice(0, 20); // Limit to 20 results
  } catch (error) {
    console.error('Error searching shows:', error.message);
    throw error;
  }
}

// Get random show
async function getRandomShow() {
  try {
    const shows = await fetchAllShows();
    if (shows.length === 0) throw new Error('No shows available');
    
    const randomIndex = Math.floor(Math.random() * shows.length);
    return shows[randomIndex];
  } catch (error) {
    console.error('Error getting random show:', error.message);
    throw error;
  }
}

module.exports = {
  fetchAllShows,
  fetchSetlist,
  searchShows,
  getRandomShow
};
