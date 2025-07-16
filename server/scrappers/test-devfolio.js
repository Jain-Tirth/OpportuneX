import devfolioScraper from "./devfolioScraper.js";

async function testDevfolioScraper() {
    console.log('🚀 Starting Devfolio scraper test...');
    
    try {
        const events = await devfolioScraper.scrapeDevfolio();
        console.log(`✅ Found ${events.length} events from Devfolio`);
        console.log("Type of events",typeof events);
        if (events.length > 0) {
            console.log('\n📋 Events found:');
            events.forEach((event, index) => {
                console.log(`${index + 1}. ${event.title || event.name || 'Unnamed Event'}`);
                console.log(`   Description: ${event.description?.substring(0, 100) || 'No description'}...`);
                console.log(`Start date ${event.start_date}, End date${event.end_date}`);
                console.log('---');
            });
        } else {
            console.log('❌ No events found');
        }
        
    } catch (error) {
        console.error('❌ Error testing Devfolio scraper:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

testDevfolioScraper();