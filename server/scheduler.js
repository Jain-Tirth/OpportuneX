import cron from 'node-cron';
import mainScrapping from './scrappers/mainScrapping.js';
import { scrapeEvents, deleteExpireEvents} from './controllers/eventController.js';
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
    await deleteExpireEvents();
    if((await scrapeEvents(eventsData)).success){
      console.log('✅ Scheduled scraping completed successfully');
    }  
    nextRunTime = calculateNextRun();
    
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

export const getSchedulerStatus = () => ({
  isRunning: !!scheduledJob,
  isCurrentlyScraping: isSchedulerRunning,
  lastRunTime,
  nextRunTime,
  schedule: 'Every hour at 0 minutes (UTC)'
});

export const triggerManualScraping = async () => {
  if (isSchedulerRunning) {
    throw new Error('Scraping is already in progress');
  }
  
  try {
    isSchedulerRunning = true;
    lastRunTime = new Date();
    console.log('🔄 Starting manual scraping (triggered via API)...');
    
    const eventsData = await mainScrapping.scrapeHackathons();
    await deleteExpireEvents();
    const result = await scrapeEvents(eventsData);
    
    if (result.success) {
      console.log('✅ Manual scraping completed successfully');
      console.log(`   Scraped: ${result.scraped}, Saved: ${result.saved}`);
    }
    
    nextRunTime = calculateNextRun();
    return result;
    
  } catch (error) {
    console.error('❌ Manual scraping failed:', error.message);
    throw error;
  } finally {
    isSchedulerRunning = false;
  }
};

export const startScheduler = () => {
  if (!scheduledJob) {
    throw new Error('Scheduler is not initialized');
  }
  scheduledJob.start();
  nextRunTime = calculateNextRun();
  console.log('✅ Scheduler started');
};

export const stopScheduler = () => {
  if (!scheduledJob) {
    throw new Error('Scheduler is not initialized');
  }
  scheduledJob.stop();
  console.log('⏸️ Scheduler stopped');
};

export default {
  getSchedulerStatus,
  triggerManualScraping,
  startScheduler,
  stopScheduler
};
