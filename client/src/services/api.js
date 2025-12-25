import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Fetch all events from the server
export const getEvents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/events`);
    return response.data;
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
    const response = await axios.post(`${API_BASE_URL}/scheduler/trigger`);
    return response.data;
  } catch (error) {
    console.error('Manual Scraping API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to trigger manual scraping');
  }
};