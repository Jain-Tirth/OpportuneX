import { unstopScrapper } from './unstopScrapper.js';
import { eventbriteScrapper } from './eventBriteScrapper.js';
import { devfolioScraper } from './devfolioScraper.js';
import{devpostScrapper} from './devPostScrapper.js';
/* Scrape events and hackathon from multiple platform*/
export class mainScrapping {
    constructor() {
        this.unstopScrapper = new unstopScrapper();
        this.eventbriteScrapper = new eventbriteScrapper();
        this.devfolioScraper = new devfolioScraper();
        this.devpostScrapper = new devpostScrapper();
    }

    /* Main scraping method - scrapes from all platforms */
    async scrapeHackathons() {
        console.log('Starting multi-platform hackathon scraping...');

        const allEvents = [];

        try {
            // Scrape Devfolio
            const devfolioEvents = await this.devfolioScraper.scrapeDevfolio();
            allEvents.push(...devfolioEvents);

            // Scrape Unstop
            const unstopEvents = await this.unstopScrapper.scrapeUnstopWithPuppeteer();
            allEvents.push(...unstopEvents);

            // Scrape Eventbrite
            const eventbriteEvents = await this.eventbriteScrapper.scrapeEventbrite();
            allEvents.push(...eventbriteEvents);
            // Scrape Devpost 
            const devPostEvent = await this.devPostScrapper.scrapeDevpost();
            allEvents.push(...devPostEvent);
            
            console.log(`Total events found: ${allEvents.length}`);
            console.log(`- Devfolio: ${devfolioEvents.length}`);
            console.log(`- Unstop: ${unstopEvents.length}`);
            console.log(`- Eventbrite: ${eventbriteEvents.length}`);
            console.log(`- Eventbrite: ${devPostEvent.length}`);

            // Process and normalize dates
            const processedEvents = this.processEventDates(allEvents);

            return processedEvents;

        } catch (error) {
            console.error('Error in multi-platform scraping:', error);

            // Fallback to sample data if all scraping fails
            console.log('Falling back to sample data...');
            return this.getSampleData();
        }
    }

    /* Process and normalize date formats for database compatibility */
    processEventDates(events) {
        return events.map(event => {
            const processedEvent = { ...event };

            // Normalize date formats
            processedEvent.startDate = this.normalizeDate(event.startDate);
            processedEvent.endDate = this.normalizeDate(event.endDate);
            processedEvent.deadline = this.normalizeDate(event.deadline);

            return processedEvent;
        });
    }

    /* Normalize date to a consistent format */
    normalizeDate(dateString) {
        if (!dateString || typeof dateString !== 'string') {
            return null;
        }

        // Remove any non-date strings
        const nonDateStrings = ['online', 'offline', 'virtual', 'tbd', 'tba'];
        if (nonDateStrings.some(str => dateString.toLowerCase().includes(str))) {
            return null;
        }

        try {
            // Try parsing various date formats
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                // Try alternative parsing for formats like "25-07-13"
                const patterns = [
                    /(\d{2})-(\d{2})-(\d{2})/, // YY-MM-DD or DD-MM-YY
                    /(\d{2})\/(\d{2})\/(\d{2})/, // YY/MM/DD or DD/MM/YY
                    /(\d{1,2})\s+(\w+)\s+(\d{4})/, // DD Month YYYY
                    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/ // Month DD, YYYY
                ];

                for (const pattern of patterns) {
                    const match = dateString.match(pattern);
                    if (match) {
                        // For patterns like "25-07-13", assume it's YY-MM-DD if year is < 50, else DD-MM-YY
                        if (pattern.source.includes('-') || pattern.source.includes('/')) {
                            const [, p1, p2, p3] = match;
                            if (p1.length === 2 && p2.length === 2 && p3.length === 2) {
                                // Determine if it's YY-MM-DD or DD-MM-YY
                                const year = parseInt(p1) < 50 ? 2000 + parseInt(p1) : 1900 + parseInt(p1);
                                const parsedDate = new Date(year, parseInt(p2) - 1, parseInt(p3));
                                if (!isNaN(parsedDate.getTime())) {
                                    return parsedDate.toISOString().split('T')[0];
                                }
                                // Try DD-MM-YY format
                                const year2 = parseInt(p3) < 50 ? 2000 + parseInt(p3) : 1900 + parseInt(p3);
                                const parsedDate2 = new Date(year2, parseInt(p2) - 1, parseInt(p1));
                                if (!isNaN(parsedDate2.getTime())) {
                                    return parsedDate2.toISOString().split('T')[0];
                                }
                            }
                        }
                        break;
                    }
                }

                return null;
            }

            // Return in YYYY-MM-DD format
            return date.toISOString().split('T')[0];

        } catch (error) {
            console.log(`Error parsing date "${dateString}": ${error.message}`);
            return null;
        }
    }

    /* Get sample/mock data for testing*/
    getSampleData() {
        return [
            {
                title: "HackThis Fall 2025",
                description: "India's biggest online hackathon with amazing prizes and opportunities. Build innovative solutions, network with like-minded developers, and compete for exciting prizes worth ₹10 lakhs! This hackathon focuses on solving real-world problems using cutting-edge technology including AI, blockchain, IoT, and web development.",
                type: "hackathon",
                startDate: "July 15, 2025",
                endDate: "July 17, 2025",
                deadline: "July 10, 2025",
                tags: ["hackathon", "programming", "innovation", "AI", "blockchain", "web development"],
                hostedBy: "Devfolio",
                verified: true,
                redirectURL: "https://devfolio.co/hackathons/hackthisfall2025"
            },
            {
                title: "MLH Local Hack Day: Build",
                description: "Build, learn, and share with your local developer community in this 12-hour hackathon. Perfect for beginners and experienced developers alike. Join us for workshops, mentorship, and amazing networking opportunities. Focus on open source projects and community building.",
                type: "hackathon",
                startDate: "August 1, 2025",
                endDate: "August 1, 2025",
                deadline: "July 25, 2025",
                tags: ["hackathon", "local", "community", "workshops", "open source", "MLH"],
                hostedBy: "Major League Hacking",
                verified: true,
                redirectURL: "https://devfolio.co/hackathons/mlh-local-hack-day"
            },
            {
                title: "Smart India Hackathon 2025",
                description: "National level hackathon organized by Government of India to solve real-world problems faced by various ministries and departments. Students get chance to work on live projects and contribute to nation building. Focus on digital governance, healthcare, education, and rural development.",
                type: "hackathon",
                startDate: "September 15, 2025",
                endDate: "September 17, 2025",
                deadline: "August 20, 2025",
                tags: ["hackathon", "government", "national", "smart india", "digital governance", "healthcare"],
                hostedBy: "Government of India",
                verified: true,
                redirectURL: "https://devfolio.co/hackathons/sih2025"
            },
            {
                title: "AngelHack Global Virtual",
                description: "Join developers from around the world in this global virtual hackathon. Focus on sustainability, fintech, and emerging technologies. Winner gets funding opportunity and mentorship from top VCs. Build solutions that can make a real impact on society and the environment.",
                type: "hackathon",
                startDate: "October 5, 2025",
                endDate: "October 7, 2025",
                deadline: "September 30, 2025",
                tags: ["hackathon", "global", "virtual", "sustainability", "fintech", "funding", "VC"],
                hostedBy: "AngelHack",
                verified: true,
                redirectURL: "https://devfolio.co/hackathons/angelhack-global"
            },
            {
                title: "HackerEarth Deep Learning Challenge",
                description: "Advanced hackathon focused on deep learning and artificial intelligence. Solve complex machine learning problems using state-of-the-art techniques. Perfect for data scientists, ML engineers, and AI researchers looking to showcase their skills.",
                type: "hackathon",
                startDate: "November 12, 2025",
                endDate: "November 14, 2025",
                deadline: "November 5, 2025",
                tags: ["hackathon", "deep learning", "AI", "machine learning", "data science", "research"],
                hostedBy: "HackerEarth",
                verified: true,
                redirectURL: "https://devfolio.co/hackathons/hackerearth-dl-challenge"
            },
            {
                title: "Unstop Tech Challenge 2025",
                description: "Compete with thousands of developers in this mega tech challenge. Showcase your coding skills across multiple domains including web development, mobile apps, and system design. Great opportunity to network with industry professionals.",
                type: "hackathon",
                startDate: "December 1, 2025",
                endDate: "December 3, 2025",
                deadline: "November 25, 2025",
                tags: ["hackathon", "tech challenge", "coding", "unstop", "networking"],
                hostedBy: "Unstop",
                verified: true,
                redirectURL: "https://unstop.com/hackathons/tech-challenge-2025"
            }
        ];
    }
}
export default new mainScrapping();