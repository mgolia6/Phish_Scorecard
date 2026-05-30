// Vercel serverless function for shows endpoint
import fetch from 'node-fetch';

// Cache for shows data
let showsCache = null;
let cacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour

async function fetchPhishNetShows() {
  try {
    // Check cache first
    if (showsCache && Date.now() - cacheTime < CACHE_DURATION) {
      console.log('Using cached shows');
      return showsCache;
    }

    console.log('Fetching shows from Phish.net API...');
    
    // Fetch shows from Phish.net API
    const response = await fetch('https://api.phish.net/v5/shows/artist/phish?limit=500', {
      headers: {
        'User-Agent': 'Phishow-Scorecard/2.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Phish.net API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Transform data
    const shows = (data.data || []).map(show => ({
      showdate: show.showdate,
      venue: show.venue,
      city: show.city,
      state: show.state,
      country: show.country,
      url: show.url
    }));

    // Cache the results
    showsCache = shows;
    cacheTime = Date.now();

    console.log(`Successfully fetched ${shows.length} shows`);
    return shows;
  } catch (error) {
    console.error('Error fetching shows:', error);
    // Return empty array on error
    return [];
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const shows = await fetchPhishNetShows();
    
    // Handle search query
    const { q } = req.query;
    
    if (q) {
      const query = q.toLowerCase();
      const filtered = shows.filter(show => 
        show.showdate.includes(query) ||
        show.venue.toLowerCase().includes(query) ||
        show.city.toLowerCase().includes(query) ||
        show.state.toLowerCase().includes(query)
      );
      res.status(200).json(filtered);
    } else {
      res.status(200).json(shows);
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: error.message });
  }
}
