import  unstopScrapper  from './unstopScrapper.js';
import devfolioScraper from './devfolioScraper.js';
import devPostScrapper from './devPostScrapper.js';

export class mainScrapping {
    constructor() {
        this.unstopScrapper = unstopScrapper ;
        this.devfolioScraper = devfolioScraper; 
        this.devPostScrapper = new devPostScrapper();
    }

    async scrapeHackathons() {
        console.log('Starting multi-platform hackathon scraping...');

        const allEvents = [];

        try {
            const devfolioEvents = await this.devfolioScraper.scrapeDevfolio();
            allEvents.push(...devfolioEvents);
            
            const unstopEvents = await this.unstopScrapper.scrapeUnstop();
            allEvents.push(...unstopEvents);

            const devPostEvent = await this.devPostScrapper.scrapeDevpost();
            allEvents.push(...devPostEvent);

            return allEvents;

        } catch (error) {
            console.error('Error in multi-platform scraping:', error);
        }
    }
}
export default new mainScrapping();