import cron from 'node-cron';
import mainScrapping from './scrappers/mainScrapping.js';

let isSchedulerRunning = false;
let lastRunTime = null;
let nextRunTime = null;
let scheduledJob = null;

const calculateNextRun = () => {
  const now = new Date(); 
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next;
};

// Auto-start scheduler when module loads
scheduledJob = cron.schedule('0 0 * * * *', async () => {
  try {
    isSchedulerRunning = true;
    lastRunTime = new Date();
    console.log('🕐 Starting scheduled scraping...');
    
    const eventsData = await mainScrapping.scrapeHackathons();
    nextRunTime = calculateNextRun();
    
    console.log('✅ Scheduled scraping completed');
  } catch (error) {
    console.error('❌ Scheduled scraping failed:', error.message);
  } finally {
    isSchedulerRunning = false;
  }
}, {
  scheduled: true,
  timezone: 'UTC'
});

nextRunTime = calculateNextRun();
console.log('🚀 Scheduler auto-started - next run:', nextRunTime);

export const getSchedulerStatus = () => ({
  isRunning: !!scheduledJob,
  isCurrentlyScraping: isSchedulerRunning,
  lastRunTime,
  nextRunTime,
  schedule: 'Every hour at 0 minutes (UTC)'
});

export default {
  getSchedulerStatus
};
