import scraper from './scrappers/devfolioScraper.js';

console.log('Testing Devfolio scraper only...');

try {
    const events = await scraper.scrapeDevfolioWithPuppeteer();
    console.log('\n=== DEVFOLIO SCRAPING RESULTS ===');
    console.log(`Found ${events.length} events:`);
    
    events.forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.title}`);
        console.log(`   Description: ${event.description.substring(0, 100)}...`);
        console.log(`   Start Date: ${event.startDate}`);
        console.log(`   End Date: ${event.endDate}`);
        console.log(`   Deadline: ${event.deadline}`);
        console.log(`   Tags: ${event.tags.join(', ')}`);
        console.log(`   Hosted By: ${event.hostedBy}`);
        console.log(`   URL: ${event.redirectURL}`);
    });
    
} catch (error) {
    console.error('Error testing Devfolio scraper:', error);
}

console.log('\nDevfolio test completed.');
