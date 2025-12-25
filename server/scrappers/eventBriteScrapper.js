import * as cheerio from "cheerio";
import axios from 'axios';

export class eventbriteScrapper {
    constructor() {
        this.platform = {
            eventbrite: {
                hackathonsUrl: 'https://www.eventbrite.com/d/online/hackathon/',
                name: 'Eventbrite'
            }
        }
    }

    /* Scrape Eventbrite using Cheerio */
    async scrapeEventbrite() {
        try {
            console.log('Scraping Eventbrite...');
            const response = await axios.get(this.platform.eventbrite.hackathonsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                }
            });

            const $ = cheerio.load(response.data);
            const events = [];

            // Look for event cards on Eventbrite
            $('.event-card, .search-event-card, [class*="event-card"], .eds-event-card').each((i, element) => {
                const $el = $(element);

                const event = {
                    title: '',
                    description: '',
                    type: 'hackathon',
                    startDate: null,
                    endDate: null,
                    deadline: null,
                    tags: [],
                    hostedBy: 'Eventbrite',
                    verified: true,
                    redirectURL: ''
                };

                // Extract title
                const title = $el.find('h1, h2, h3, .event-title, [class*="title"]').first().text().trim();
                if (title) event.title = title;

                // Filter out spam/scam events
                const spamKeywords = [
                    'recover lost crypto',
                    'crypto scam',
                    'fake investment',
                    'get rich quick',
                    'miracle cure',
                    'work from home',
                    'make money fast',
                    'investment opportunity',
                    'bitcoin recovery',
                    'forex trading'
                ];

                const titleLower = title.toLowerCase();
                const isSpam = spamKeywords.some(keyword => titleLower.includes(keyword));

                if (isSpam) {
                    return; // Skip spam events
                }

                // Only include events that actually contain hackathon-related keywords
                const hackathonKeywords = [
                    'hackathon',
                    'hack day',
                    'coding competition',
                    'programming contest',
                    'developer challenge',
                    'tech challenge',
                    'innovation challenge',
                    'startup weekend',
                    'code sprint',
                    'dev fest'
                ];

                const isHackathonRelated = hackathonKeywords.some(keyword => titleLower.includes(keyword));

                if (!isHackathonRelated) {
                    return; // Skip non-hackathon events
                }

                // Extract description
                const desc = $el.find('p, .event-description, [class*="description"]').first().text().trim();
                if (desc && desc.length > 20) event.description = desc;

                // Extract URL
                const href = $el.find('a').first().attr('href') || $el.attr('href');
                if (href) {
                    event.redirectURL = href.startsWith('http') ? href : `https://www.eventbrite.com${href}`;
                }

                // Extract date and time
                const dateTime = $el.find('.event-date, .date-time, [class*="date"]').first().text().trim();
                if (dateTime) {
                    event.startDate = dateTime;
                    event.deadline = dateTime;
                }

                // Extract price (if free, note it)
                const price = $el.find('.event-price, .price, [class*="price"]').first().text().trim();
                if (price && price.toLowerCase().includes('free')) {
                    event.tags.push('free');
                }

                // Add default tags
                event.tags.push('hackathon', 'eventbrite');

                if (event.title && event.title.length > 3) {
                    events.push(event);
                }
            });

            console.log(`Found ${events.length} legitimate hackathon events from Eventbrite`);
            return events.slice(0, 3); // Limit to 3 quality events

        } catch (error) {
            console.error('Error scraping Eventbrite:', error.message);
            return [];
        }
    }
}
export default new eventbriteScrapper();