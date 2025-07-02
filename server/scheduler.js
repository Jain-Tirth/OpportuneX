import cron from 'node-cron';
import mainScrapping from './scrappers/mainScrapping.js';

let isSchedulerRunning = false;
let lastRunTime = null;
let nextRunTime = null;
let scheduledJob = null;

const calculateNextRun = () => {
  const now = new Date();
  const hours = [0, 6, 12, 18];
  const next = new Date(now);
  let nextHour = hours.find(h => h > now.getHours()) || hours[0];
  if (nextHour <= now.getHours()) next.setDate(now.getDate() + 1);
  next.setHours(nextHour, 0, 0, 0);
  return next;
};

const performScheduledScraping = async () => {
  try {
    isSchedulerRunning = true;
    lastRunTime = new Date();

    const eventsData = await mainScrapping.scrapeHackathons();
    nextRunTime = calculateNextRun();
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
  } finally {
    isSchedulerRunning = false;
  }
};

export const startScheduler = () => {
  scheduledJob = cron.schedule('0 0,6,12,18 * * *', performScheduledScraping, {
    scheduled: true,
    timezone: 'UTC'
  });

  nextRunTime = calculateNextRun();
  performScheduledScraping();
};

export const stopScheduler = () => {
  if (scheduledJob) {
    scheduledJob.destroy();
    scheduledJob = null;
  }
};

export const triggerManualScraping = async () => {
  if (isSchedulerRunning) throw new Error('Scraping already in progress');
  await performScheduledScraping();
};

export const getSchedulerStatus = () => ({
  isRunning: !!scheduledJob,
  isCurrentlyScraping: isSchedulerRunning,
  lastRunTime,
  nextRunTime,
  schedule: 'Every 6 hours (UTC)'
});

export default {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerManualScraping
};
