import mainScrapping from '../scrappers/mainScrapping.js';
// Function to run scraping directly (for Node.js execution)
const runDemo = async () => {
    try {
        console.log('🚀 Starting demo scraping...');
        const events = await mainScrapping.scrapeHackathons();
        console.log(`✅ Demo scraping completed! Found ${events.length} events`);
        console.log('Events:', events.slice(0, 50)); // Show first 3 events as sample
        process.exit(0);
    } catch (error) {
        console.error('❌ Demo scraping failed:', error.message);
        process.exit(1);
    }
};

// Always run demo when this file is executed
runDemo();