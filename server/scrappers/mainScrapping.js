import  unstopScrapper  from './unstopScrapper.js';
import devfolioScraper from './devfolioScraper.js';
import devPostScrapper from './devPostScrapper.js';
export class mainScrapping {
    constructor() {
        this.unstopScrapper = unstopScrapper ;
        this.devfolioScraper = devfolioScraper; 
        this.devPostScrapper = devPostScrapper;
    }

    async scrapeHackathons() {
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
            return allEvents; // Return whatever we got so far
        }
    }
}
export default new mainScrapping();