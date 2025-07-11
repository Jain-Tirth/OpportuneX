import puppeteer from 'puppeteer';

/* Scrapes hackathons and events from devfolio platform*/
export class devfolioScraper {
    constructor() {
        this.baseUrl = 'https://devfolio.co';
        this.hackathonsUrl = 'https://devfolio.co/hackathons';
        this.name = 'Devfolio';
    }

    /* Helper method for Puppeteer timeout compatibility */
    async waitForTimeout(page, ms) {
        try {
            await page.waitForTimeout(ms);
        } catch (error) {
            try {
                await page.waitFor(ms);
            } catch (fallbackError) {
                // If both fail, use a simple Promise timeout
                await new Promise(resolve => setTimeout(resolve, ms));
            }
        }
    }

    /* Scrape Devfolio using Puppeteer with XHR interception*/
    async scrapeDevfolio() {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // Intercept network requests to capture API calls
            const apiResponses = [];
            await page.setRequestInterception(true);

            page.on('request', (request) => {
                // Allow all requests to proceed
                request.continue();
            });

            page.on('response', async (response) => {
                const url = response.url();

                // Capture API responses that might contain hackathon data
                if (url.includes('/api/') ||url.includes('hackathon') ||
                    url.includes('.json') || (url.includes('devfolio') && response.headers()['content-type']?.includes('application/json'))) {

                    try {
                        const responseData = await response.json();
                        apiResponses.push({ url, data: responseData });
                    } catch (error) {
                    }
                }
            });
            await page.goto(this.hackathonsUrl, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            // Wait longer for XHR requests to complete
            await this.waitForTimeout(page, 8000);

            // Try to trigger more content loading by scrolling
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await this.waitForTimeout(page, 3000);

            const hackathons = [];

            // First, try to extract from API responses
            for (const apiResponse of apiResponses) {
                try {
                    const events = this.extractEventsFromApiResponse(apiResponse.data);
                    hackathons.push(...events);
                } catch (error) {
                }
            }

            // If no API data found, try DOM scraping
            if (hackathons.length === 0) {;
                // Get hackathon links from DOM
                const hackathonLinks = await page.evaluate(() => {
                    const links = [];

                    // Try multiple selectors for hackathon links
                    const selectors = [
                        'a[href*="/hackathons/"]',
                        '[class*="hackathon"] a',
                        '[class*="card"] a[href*="/hackathons/"]',
                        'a[href*="/h/"]' // Sometimes Devfolio uses short URLs
                    ];

                    selectors.forEach(selector => {
                        const linkElements = document.querySelectorAll(selector);
                        linkElements.forEach(link => {
                            const href = link.href;
                            if (href && !href.includes('/hackathons?') && href !== 'https://devfolio.co/hackathons') {
                                links.push(href);
                            }
                        });
                    });

                    return [...new Set(links)];
                });

                console.log(`Found ${hackathonLinks.length} Devfolio hackathon links from DOM`);

                // Visit individual hackathon pages
                for (let i = 0; i < Math.min(hackathonLinks.length, 5); i++) {
                    const hackathonUrl = hackathonLinks[i];
                    console.log(`Scraping Devfolio hackathon ${i + 1}: ${hackathonUrl}`);

                    try {
                        await page.goto(hackathonUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                        await this.waitForTimeout(page, 5000); // Wait longer for XHR

                        const hackathonData = await this.extractHackathonDataFromPage(page);

                        // Try to get more details from application page
                        if (hackathonData && hackathonData.title) {
                            await this.enrichHackathonWithApplicationData(page, hackathonData);
                            hackathons.push(hackathonData);
                            console.log(`Successfully scraped: ${hackathonData.title}`);
                        }

                    } catch (error) {
                        console.error(`Error scraping ${hackathonUrl}:`, error.message);
                    }
                }
            }

            return hackathons;

        } catch (error) {
            console.error('Error scraping Devfolio with Puppeteer:', error);
            return [];
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /* Extract events from API response data */
    extractEventsFromApiResponse(data) {
        const events = [];

        try {
            // Handle different API response structures
            let hackathonArray = [];

            if (Array.isArray(data)) {
                hackathonArray = data;
            } else if (data.data && Array.isArray(data.data)) {
                hackathonArray = data.data;
            } else if (data.hackathons && Array.isArray(data.hackathons)) {
                hackathonArray = data.hackathons;
            } else if (data.results && Array.isArray(data.results)) {
                hackathonArray = data.results;
            }

            hackathonArray.forEach(item => {
                const event = {
                    title: '',
                    description: '',
                    type: 'hackathon',
                    startDate: null,
                    endDate: null,
                    deadline: null,
                    tags: [],
                    hostedBy: 'Devfolio',
                    verified: true,
                    redirectURL: ''
                };

                // Extract title
                event.title = item.title || item.name || item.hackathon_name || '';

                // Extract description
                event.description = item.description || item.about || item.summary || '';

                // Extract dates
                event.startDate = item.start_date || item.startDate || item.starts_at || null;
                event.endDate = item.end_date || item.endDate || item.ends_at || null;
                event.deadline = item.deadline || item.registration_deadline || item.apply_by || null;

                // Extract URL
                if (item.slug) {
                    event.redirectURL = `https://devfolio.co/hackathons/${item.slug}`;
                } else if (item.url) {
                    event.redirectURL = item.url;
                } else if (item.id) {
                    event.redirectURL = `https://devfolio.co/hackathons/${item.id}`;
                }

                // Extract tags
                if (item.tags && Array.isArray(item.tags)) {
                    event.tags = item.tags;
                } else {
                    event.tags = ['hackathon', 'devfolio'];
                }

                if (event.title && event.title.length > 3) {
                    events.push(event);
                }
            });

        } catch (error) {
            console.log(`Error extracting from API response: ${error.message}`);
        }

        return events;
    }

    /* Extract hackathon data from individual page */
    async extractHackathonDataFromPage(page) {
        return await page.evaluate(() => {
            const event = {
                title: '',
                description: '',
                type: 'hackathon',
                startDate: null,
                endDate: null,
                deadline: null,
                tags: [],
                hostedBy: 'Devfolio',
                verified: true,
                redirectURL: window.location.href
            };

            // Extract title with multiple selectors
            const titleSelectors = [
                'h1',
                'h2',
                'h3.sc-dkzDqf.lecwTx',
                'h3[class*="sc-dkzDqf"][class*="lecwTx"]',
                'h3',
                '[data-testid="hackathon-title"]',
                '.hackathon-title',
                '.title'
            ];

            for (const selector of titleSelectors) {
                const titleEl = document.querySelector(selector);
                if (titleEl && titleEl.textContent.trim()) {
                    event.title = titleEl.textContent.trim();
                    break;
                }
            }

            if (!event.title && document.title) {
                event.title = document.title.replace(/ - Devfolio.*/, '').trim();
            }

            // Extract description
            const descSelectors = [
                '[data-testid="hackathon-description"]',
                '.hackathon-description',
                '.description',
                '.about p',
                '.overview p',
                'meta[name="description"]'
            ];

            for (const selector of descSelectors) {
                if (selector === 'meta[name="description"]') {
                    const metaDesc = document.querySelector(selector);
                    if (metaDesc && metaDesc.getAttribute('content')) {
                        event.description = metaDesc.getAttribute('content').trim();
                        break;
                    }
                } else {
                    const descEl = document.querySelector(selector);
                    if (descEl && descEl.textContent.trim() && descEl.textContent.trim().length > 30) {
                        event.description = descEl.textContent.trim();
                        break;
                    }
                }
            }

            // Extract start date using specific class
            const startDateEl = document.querySelector('.sc-dkzDqf.cqgLqK') ||
                document.querySelector('[class*="sc-dkzDqf"][class*="cqgLqK"]');
            if (startDateEl && startDateEl.textContent.trim()) {
                event.startDate = startDateEl.textContent.trim();
            }

            // Extract other dates as fallback
            const bodyText = document.body.textContent;
            const datePatterns = [
                /(\w+\s+\d{1,2},\s+\d{4})/g,
                /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
                /(\d{1,2}\s+\w+\s+\d{4})/g
            ];

            const allDates = [];
            datePatterns.forEach(pattern => {
                const matches = bodyText.match(pattern);
                if (matches) {
                    allDates.push(...matches);
                }
            });

            // Set end date if we have multiple dates
            if (allDates.length > 1) {
                const uniqueDates = [...new Set(allDates)];
                if (!event.startDate) {
                    event.startDate = uniqueDates[0];
                }
                event.endDate = uniqueDates[uniqueDates.length - 1];
            }

            // Extract tags
            const tagSelectors = ['.tag', '.badge', '[class*="tag"]', '[class*="badge"]'];
            tagSelectors.forEach(selector => {
                const tagElements = document.querySelectorAll(selector);
                tagElements.forEach(tag => {
                    const tagText = tag.textContent.trim();
                    if (tagText && tagText.length < 50 && !event.tags.includes(tagText)) {
                        event.tags.push(tagText);
                    }
                });
            });

            if (event.tags.length === 0) {
                event.tags = ['hackathon', 'devfolio'];
            }

            return event;
        });
    }

    /* Enrich hackathon data with application page details */
    async enrichHackathonWithApplicationData(page, hackathonData) {
        try {
            // Look for application page link
            const applicationUrl = await page.evaluate(() => {
                const applyButtons = document.querySelectorAll('a[href*="apply"], a[href*="register"], button[class*="apply"], button[class*="register"]');
                for (const button of applyButtons) {
                    const href = button.href;
                    if (href && href.includes('/apply')) {
                        return href;
                    }
                }
                return null;
            });

            if (applicationUrl) {
                console.log(`Visiting application page: ${applicationUrl}`);
                await page.goto(applicationUrl, { waitUntil: 'networkidle2', timeout: 20000 });
                await this.waitForTimeout(page, 3000);

                // Extract deadline from application page
                const deadlineData = await page.evaluate(() => {
                    // Look for deadline with specific Devfolio class
                    const deadlineSelectors = [
                        '.sc-dkzDqf.QUFtN',
                        '[class*="sc-dkzDqf"][class*="QUFtN"]',
                        '.deadline',
                        '.apply-deadline',
                        '.registration-deadline',
                        '[class*="deadline"]'
                    ];

                    for (const selector of deadlineSelectors) {
                        const deadlineEl = document.querySelector(selector);
                        if (deadlineEl && deadlineEl.textContent.trim()) {
                            return deadlineEl.textContent.trim();
                        }
                    }

                    // Look for any date that might be deadline
                    const bodyText = document.body.textContent;
                    const deadlinePatterns = [
                        /deadline[:\s]*(\w+\s+\d{1,2},\s+\d{4})/i,
                        /apply\s+by[:\s]*(\w+\s+\d{1,2},\s+\d{4})/i,
                        /registration\s+ends[:\s]*(\w+\s+\d{1,2},\s+\d{4})/i
                    ];

                    for (const pattern of deadlinePatterns) {
                        const match = bodyText.match(pattern);
                        if (match) {
                            return match[1];
                        }
                    }

                    return null;
                });

                if (deadlineData && !hackathonData.deadline) {
                    hackathonData.deadline = deadlineData;
                    console.log(`Found deadline: ${deadlineData}`);
                }
            }

        } catch (error) {
            console.log(`Error enriching hackathon data: ${error.message}`);
        }
    }
}

export default new devfolioScraper();
