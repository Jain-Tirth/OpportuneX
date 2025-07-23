import  unstopScrapper  from './unstopScrapper.js';
import devfolioScraper from './devfolioScraper.js';

export class mainScrapping {
    constructor() {
        this.unstopScrapper = unstopScrapper ;
        this.devfolioScraper = devfolioScraper; 
        // this.devPostScrapper = new devPostScrapper();
    }

    async scrapeHackathons() {
        console.log('Starting multi-platform hackathon scraping...');

        const allEvents = [];

        try {
            // Scrape Devfolio
            const devfolioEvents = await this.devfolioScraper.scrapeDevfolio();
            allEvents.push(...devfolioEvents);
            
            // Scrape Unstop
            const unstopEvents = await this.unstopScrapper.scrapeUnstop();
            allEvents.push(...unstopEvents);

            // Scrape Devpost 
            // const devPostEvent = await this.devPostScrapper.scrapeDevpost();
            // allEvents.push(...devPostEvent);
            
            console.log(`Total events found: ${allEvents.length}`);
            console.log(`- Devfolio: ${devfolioEvents.length}`);
            console.log(`- Unstop: ${unstopEvents.length}`);
            // console.log(`- Devpost: ${devPostEvent.length}`);

            return allEvents;

        } catch (error) {
            console.error('Error in multi-platform scraping:', error);
        }
    }
}
export default new mainScrapping();