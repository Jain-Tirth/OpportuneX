import axios from 'axios';

// For React apps, environment variables must be prefixed with REACT_APP_
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL ||'http://localhost:5000/api';

// Fetch all events from the server
export const getEvents = async () => {
  try {
    console.log('Fetching events from server...');
    const response = await axios.get(`${API_BASE_URL}/events`);
    console.log('Server response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch events');
  }
};

// Add event to the server
export const addEvent = async (eventData) => {
  try {
    console.log('Adding event to server...', eventData);
    const response = await axios.post(`${API_BASE_URL}/events`, eventData);
    console.log('Add event response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to add event');
  }
};

// Scrape events from mainScrapping.js
export const scrapeEvents = async () => {
  try {
    console.log('Triggering event scraping...');
    const response = await axios.get(`${API_BASE_URL}/events/scrape`);
    console.log('Scrape response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Scrape API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to scrape events');
  }
};

// Get sample events
export const getSampleEvents = async () => {
  try {
    console.log('Fetching sample events...');
    const response = await axios.get(`${API_BASE_URL}/events/sample`);
    console.log('Sample events response:', response.data);
    return response.data.events;
  } catch (error) {
    console.error('Sample API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch sample events');
  }
};

// Scheduler API functions
export const getSchedulerStatus = async () => {
  try {
    console.log('Fetching scheduler status...');
    const response = await axios.get(`${API_BASE_URL}/scheduler/status`);
    console.log('Scheduler status response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Scheduler Status API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch scheduler status');
  }
};

export const startScheduler = async () => {
  try {
    console.log('Starting scheduler...');
    const response = await axios.post(`${API_BASE_URL}/scheduler/start`);
    console.log('Start scheduler response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Start Scheduler API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to start scheduler');
  }
};

export const stopScheduler = async () => {
  try {
    console.log('Stopping scheduler...');
    const response = await axios.post(`${API_BASE_URL}/scheduler/stop`);
    console.log('Stop scheduler response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Stop Scheduler API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to stop scheduler');
  }
};

export const triggerManualScraping = async () => {
  try {
    console.log('Triggering manual scraping...');
    const response = await axios.post(`${API_BASE_URL}/scheduler/trigger`);
    console.log('Manual scraping response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Manual Scraping API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to trigger manual scraping');
  }
};
