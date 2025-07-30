// script.js
const API_KEY = 10645D7F59011FFA82A; // or import from config.js if secure
const BASE_URL = 'https://api.phish.net/v5/setlists';

async function fetchSetlist(showDate) {
  const url = `${BASE_URL}?apikey=${API_KEY}&showdate=${showDate}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    displaySetlist(data);
  } catch (error) {
    console.error('Error fetching setlist:', error);
  }
}
