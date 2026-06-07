import  unstopScrapper  from './unstopScrapper.js';
import devfolioScraper from './devfolioScraper.js';
import devPostScrapper from './devPostScrapper.js';
import eventbriteScrapper from './eventBriteScrapper.js';

export class mainScrapping {
    constructor() {
        this.unstopScrapper = unstopScrapper ;
        this.devfolioScraper = devfolioScraper; 
        this.devPostScrapper = devPostScrapper;
        this.eventbriteScrapper = eventbriteScrapper;
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

            const eventbriteEvents = await this.eventbriteScrapper.scrapeEventbrite();
            allEvents.push(...eventbriteEvents);
            
            return allEvents;

        } catch (error) {
            console.error('Error in multi-platform scraping:', error);
            return allEvents; 
        }
    }
}
export default new mainScrapping();