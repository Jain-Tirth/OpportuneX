import mainScrapping from './scrappers/mainScrapping.js';
import { scrapeEvents, deleteExpireEvents } from './controllers/eventController.js';

let isSchedulerRunning = false;
let lastRunTime = null;

// This function can be called by an API route or Vercel cron job
export const runScrapingJob = async () => {
  if (isSchedulerRunning) {
    throw new Error('Scraping is already in progress');
  }
  try {
    isSchedulerRunning = true;
    lastRunTime = new Date();
    console.log('Starting scraping job...');
    const eventsData = await mainScrapping.scrapeHackathons();
    await deleteExpireEvents();
    const result = await scrapeEvents(eventsData);
    if (result.success) {
      console.log('Scraping completed successfully');
    }
    return result;
  } catch (error) {
    console.error('Scraping failed:', error.message);
    throw error;
  } finally {
    isSchedulerRunning = false;
  }
};


export const getSchedulerStatus = () => ({
  isCurrentlyScraping: isSchedulerRunning,
  lastRunTime,
});


// triggerManualScraping is now an alias for runScrapingJob
export const triggerManualScraping = runScrapingJob;


// startScheduler and stopScheduler are no-ops in serverless/cronless environment
export const startScheduler = () => {
  console.log('startScheduler called (no-op on Vercel)');
};
export const stopScheduler = () => {
  console.log('stopScheduler called (no-op on Vercel)');
};

export default {
  getSchedulerStatus,
  triggerManualScraping,
  startScheduler,
  stopScheduler
};
