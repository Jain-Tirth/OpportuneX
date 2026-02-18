import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Fetch all events from the server
export const getEvents = async ({
  page = 1,
  limit = 12,
  search,
  platform,
  sortBy,
  free,
  online,
  beginner,
  prize,
  location
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (search) params.set('search', search);
    if (platform && platform !== 'all') params.set('platform', platform);
    if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
    if (free) params.set('free', 'true');
    if (online) params.set('online', 'true');
    if (beginner) params.set('beginner', 'true');
    if (prize) params.set('prize', 'true');
    if (location) params.set('location', location);

    const url = params.toString()
      ? `${API_BASE_URL}/events?${params.toString()}`
      : `${API_BASE_URL}/events`;

    const response = await axios.get(url);
    let payload = response.data;

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (parseError) {
        console.error('Events API returned non-JSON string:', payload);
      }
    }

    if (!payload || !Array.isArray(payload.data)) {
      console.error('Events API payload shape mismatch:', payload);
      throw new Error('Invalid events response. Expected paginated payload.');
    }

    return payload;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch events');
  }
};

// Add event to the server
export const addEvent = async (eventData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/events`, eventData);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to add event');
  }
};

// Scrape events from mainScrapping.js
export const scrapeEvents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/events/scrape`);
    return response.data;
  } catch (error) {
    console.error('Scrape API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to scrape events');
  }
};

// Scheduler API functions
export const getSchedulerStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scheduler/status`);
    return response.data.data;
  } catch (error) {
    console.error('Scheduler Status API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch scheduler status');
  }
};

export const startScheduler = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scheduler/start`);
    return response.data;
  } catch (error) {
    console.error('Start Scheduler API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to start scheduler');
  }
};

export const stopScheduler = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scheduler/stop`);
    return response.data;
  } catch (error) {
    console.error('Stop Scheduler API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to stop scheduler');
  }
};

export const triggerManualScraping = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scheduler/trigger`);
    return response.data;
  } catch (error) {
    console.error('Manual Scraping API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to trigger manual scraping');
  }
};