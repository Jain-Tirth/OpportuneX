import { MultiPlatformScraper } from './scrappers/devfolioScraper.js';

async function testScraper() {
    console.log('Testing Multi-Platform Scraper...\n');
    
    const scraper = new MultiPlatformScraper();
    
    try {
        console.log('1. Testing sample data:');
        const sampleData = scraper.getSampleData();
        console.log(`   Found ${sampleData.length} sample events`);
        console.log(`   Sample event: ${sampleData[0].title}`);
        console.log(`   Description: ${sampleData[0].description.substring(0, 100)}...`);
        console.log(`   Start Date: ${sampleData[0].startDate}`);
        console.log(`   End Date: ${sampleData[0].endDate}`);
        console.log(`   Deadline: ${sampleData[0].deadline}`);
        console.log(`   Prize Pool: ${sampleData[0].prizePool}`);
        console.log(`   Tags: ${sampleData[0].tags.join(', ')}`);
        console.log(`   Location: ${sampleData[0].location}`);
        console.log(`   Team Size: ${sampleData[0].teamSize}\n`);
        
        console.log('2. Testing live scraping from multiple platforms (this may take a few moments)...');
        const scrapedEvents = await scraper.scrapeHackathons();
        
        if (scrapedEvents && scrapedEvents.length > 0) {
            console.log(`   Successfully scraped ${scrapedEvents.length} events from all platforms!`);
            
            // Group events by platform
            const eventsByPlatform = {};
            scrapedEvents.forEach(event => {
                const platform = event.hostedBy;
                if (!eventsByPlatform[platform]) {
                    eventsByPlatform[platform] = [];
                }
                eventsByPlatform[platform].push(event);
            });
            
            console.log('\n   Events by platform:');
            Object.keys(eventsByPlatform).forEach(platform => {
                console.log(`   - ${platform}: ${eventsByPlatform[platform].length} events`);
            });
            
            console.log('\n   Sample scraped events:');
            scrapedEvents.slice(0, 3).forEach((event, index) => {
                console.log(`\n   Event ${index + 1} (${event.hostedBy}):`);
                console.log(`   Title: ${event.title || 'N/A'}`);
                console.log(`   Description: ${event.description ? event.description.substring(0, 100) + '...' : 'N/A'}`);
                console.log(`   Start Date: ${event.startDate || 'N/A'}`);
                console.log(`   End Date: ${event.endDate || 'N/A'}`);
                console.log(`   Deadline: ${event.deadline || 'N/A'}`);
                console.log(`   Prize Pool: ${event.prizePool || 'N/A'}`);
                console.log(`   Location: ${event.location || 'N/A'}`);
                console.log(`   Team Size: ${event.teamSize || 'N/A'}`);
                console.log(`   Tags: ${event.tags && event.tags.length > 0 ? event.tags.join(', ') : 'N/A'}`);
                console.log(`   URL: ${event.redirectURL || 'N/A'}`);
            });
        } else {
            console.log('   No events were scraped. This could be due to:');
            console.log('   - Network connectivity issues');
            console.log('   - Changes in website structures');
            console.log('   - Anti-bot measures');
            console.log('   - No active hackathons currently listed');
        }
        
    } catch (error) {
        console.error('Error testing scraper:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testScraper().then(() => {
    console.log('\nMulti-platform scraper test completed!');
    process.exit(0);
}).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
