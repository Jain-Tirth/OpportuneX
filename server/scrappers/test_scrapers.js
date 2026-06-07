import dotenv from 'dotenv';
dotenv.config();
import unstopScrapper from './unstopScrapper.js';
import devfolioScraper from './devfolioScraper.js';
import devPostScrapper from './devPostScrapper.js';
import eventbriteScrapper from './eventBriteScrapper.js';

async function runTest() {
    console.log('Testing Unstop Scraper...');
    try {
        const unstopEvents = await unstopScrapper.scrapeUnstop();
        console.log(`Unstop: Scraped ${unstopEvents.length} events.`);
        if (unstopEvents.length > 0) {
            console.log('First Unstop Event:', JSON.stringify(unstopEvents[0], null, 2));
        }
    } catch (e) {
        console.error('Unstop failed:', e);
    }

    console.log('\nTesting Devfolio Scraper...');
    try {
        const devfolioEvents = await devfolioScraper.scrapeDevfolio();
        console.log(`Devfolio: Scraped ${devfolioEvents.length} events.`);
        if (devfolioEvents.length > 0) {
            console.log('First Devfolio Event:', JSON.stringify(devfolioEvents[0], null, 2));
        }
    } catch (e) {
        console.error('Devfolio failed:', e);
    }

    console.log('\nTesting Devpost Scraper...');
    try {
        const devPostEvents = await devPostScrapper.scrapeDevpost();
        console.log(`Devpost: Scraped ${devPostEvents.length} events.`);
        if (devPostEvents.length > 0) {
            console.log('First Devpost Event:', JSON.stringify(devPostEvents[0], null, 2));
        }
    } catch (e) {
        console.error('Devpost failed:', e);
    }

    console.log('\nTesting Eventbrite Scraper...');
    try {
        const eventbriteEvents = await eventbriteScrapper.scrapeEventbrite();
        console.log(`Eventbrite: Scraped ${eventbriteEvents.length} events.`);
        if (eventbriteEvents.length > 0) {
            console.log('First Eventbrite Event:', JSON.stringify(eventbriteEvents[0], null, 2));
        }
    } catch (e) {
        console.error('Eventbrite failed:', e);
    }
}

runTest();
