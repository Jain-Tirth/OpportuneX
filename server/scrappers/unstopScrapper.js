import puppeteer from "puppeteer";
export class unstopScrapper {
    constructor() {
        this.platform = {
            unstop: {
                baseUrl: 'https://unstop.com',
                hackathonsUrl: 'https://unstop.com/hackathons',
                name: 'Unstop'
            }
        }
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

    /* Scrape Unstop using Puppeteer with XHR interception */
    async scrapeUnstopWithPuppeteer() {
        let browser;
        try {
            console.log('Launching browser for Unstop...');
            browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // Intercept network requests to capture API calls
            const apiResponses = [];
            await page.setRequestInterception(true);

            page.on('request', (request) => {
                request.continue();
            });

            page.on('response', async (response) => {
                const url = response.url();

                // Capture API responses that might contain competition/hackathon data
                if ((url.includes('/api/') ||
                    url.includes('/v1/') ||
                    url.includes('/competitions') ||
                    url.includes('/hackathon') ||
                    url.includes('.json') ||
                    (url.includes('unstop') && response.headers()['content-type']?.includes('application/json'))) &&
                    response.status() === 200) {

                    try {
                        const responseData = await response.json();
                        apiResponses.push({ url, data: responseData });
                        console.log(`Captured Unstop API response from: ${url}`);
                    } catch (e) {
                        // Not JSON, ignore
                    }
                }
            });

            // Try multiple Unstop URLs
            const unstopUrls = [
                'https://unstop.com/hackathons',
                'https://unstop.com/competitions',
                'https://unstop.com/hackathons?opportunity=Hackathons'
            ];

            let allEvents = [];

            for (const url of unstopUrls) {
                try {
                    console.log(`Navigating to Unstop URL: ${url}`);
                    await page.goto(url, {
                        waitUntil: 'networkidle2',
                        timeout: 60000
                    });

                    // Wait for XHR requests to complete
                    await this.waitForTimeout(page, 8000);

                    // Scroll to trigger lazy loading
                    await page.evaluate(() => {
                        window.scrollTo(0, document.body.scrollHeight);
                    });
                    await this.waitForTimeout(page, 3000);

                    // Try to extract from API responses first
                    console.log(`Found ${apiResponses.length} API responses for Unstop`);
                    for (const apiResponse of apiResponses) {
                        try {
                            const events = this.extractUnstopEventsFromApiResponse(apiResponse.data);
                            allEvents.push(...events);
                        } catch (error) {
                            console.log(`Error parsing Unstop API response: ${error.message}`);
                        }
                    }

                    // If no API data found, try DOM scraping
                    if (allEvents.length === 0) {
                        console.log('No Unstop API data found, trying DOM extraction...');

                        const domEvents = await this.extractUnstopEventsFromDOM(page);
                        allEvents.push(...domEvents);
                    }

                    if (allEvents.length > 0) {
                        break; // Found events, no need to try other URLs
                    }

                } catch (urlError) {
                    console.log(`Error with Unstop URL ${url}: ${urlError.message}`);
                    continue;
                }
            }

            console.log(`Found ${allEvents.length} events from Unstop`);
            return allEvents.slice(0, 3); // Limit to 3 events

        } catch (error) {
            console.error('Error scraping Unstop with Puppeteer:', error.message);
            return [];
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /* Extract events from Unstop API response data */
    extractUnstopEventsFromApiResponse(data) {
        const events = [];

        try {
            // Handle different API response structures for Unstop
            let competitionArray = [];

            if (Array.isArray(data)) {
                competitionArray = data;
            } else if (data.data && Array.isArray(data.data)) {
                competitionArray = data.data;
            } else if (data.competitions && Array.isArray(data.competitions)) {
                competitionArray = data.competitions;
            } else if (data.results && Array.isArray(data.results)) {
                competitionArray = data.results;
            } else if (data.opportunities && Array.isArray(data.opportunities)) {
                competitionArray = data.opportunities;
            }

            competitionArray.forEach(item => {
                // Filter for hackathon-related content
                const title = item.title || item.name || item.competition_name || '';
                const titleLower = title.toLowerCase();
                const isHackathonRelated = ['hackathon', 'hack', 'coding', 'programming', 'tech', 'innovation', 'startup', 'challenge'].some(keyword =>
                    titleLower.includes(keyword)
                );

                if (!isHackathonRelated || title.length < 5) return;

                const event = {
                    title: title,
                    description: item.description || item.about || item.summary || item.details || '',
                    type: 'hackathon',
                    startDate: item.start_date || item.startDate || item.begins_on || item.registration_start_date || null,
                    endDate: item.end_date || item.endDate || item.ends_on || item.registration_end_date || null,
                    deadline: item.deadline || item.registration_deadline || item.apply_by || item.last_date || null,
                    tags: ['hackathon', 'competition', 'unstop'],
                    hostedBy: 'Unstop',
                    verified: true,
                    redirectURL: ''
                };

                // Extract URL
                if (item.slug) {
                    event.redirectURL = `https://unstop.com/hackathons/${item.slug}`;
                } else if (item.url) {
                    event.redirectURL = item.url;
                } else if (item.id) {
                    event.redirectURL = `https://unstop.com/competition/${item.id}`;
                }

                // Extract additional tags
                if (item.tags && Array.isArray(item.tags)) {
                    event.tags = [...event.tags, ...item.tags.slice(0, 3)];
                } else if (item.category) {
                    event.tags.push(item.category.toLowerCase());
                }

                if (event.title && event.title.length > 5) {
                    events.push(event);
                }
            });

        } catch (error) {
            console.log(`Error extracting from Unstop API response: ${error.message}`);
        }

        return events;
    }

    /* Extract events from Unstop DOM */
    async extractUnstopEventsFromDOM(page) {
        return await page.evaluate(() => {
            const events = [];

            // Try multiple selectors for Unstop cards
            const cardSelectors = [
                '.competition-card',
                '.hackathon-card',
                '.event-card',
                '[class*="card"]',
                '.opportunity-card',
                '.listing-card',
                '[class*="competition"]',
                '[class*="opportunity"]',
                '.search-result',
                '.result-card'
            ];

            let foundCards = false;

            for (const selector of cardSelectors) {
                const cards = document.querySelectorAll(selector);
                if (cards.length > 0) {
                    console.log(`Found ${cards.length} Unstop cards with selector: ${selector}`);
                    foundCards = true;

                    cards.forEach((element, i) => {
                        if (i >= 5) return; // Limit to first 5 cards per selector

                        const event = {
                            title: '',
                            description: '',
                            type: 'hackathon',
                            startDate: null,
                            endDate: null,
                            deadline: null,
                            tags: ['hackathon', 'competition', 'unstop', 'online'],
                            hostedBy: 'Unstop',
                            verified: true,
                            redirectURL: window.location.href
                        };

                        // Extract title with multiple selectors
                        const titleSelectors = ['h1', 'h2', 'h3', '.title', '[class*="title"]', '.name', '[class*="name"]'];
                        for (const titleSel of titleSelectors) {
                            const titleEl = element.querySelector(titleSel);
                            if (titleEl && titleEl.textContent.trim() && titleEl.textContent.trim().length > 5) {
                                event.title = titleEl.textContent.trim();
                                break;
                            }
                        }

                        // Skip if no meaningful title
                        if (!event.title || event.title.length < 5) return;

                        // Filter for hackathon-related content
                        const titleLower = event.title.toLowerCase();
                        const isHackathonRelated = ['hackathon', 'hack', 'coding', 'programming', 'tech', 'innovation', 'startup', 'challenge'].some(keyword =>
                            titleLower.includes(keyword)
                        );

                        if (!isHackathonRelated) return;

                        // Extract description
                        const descSelectors = ['p', '.description', '[class*="description"]', '.summary', '[class*="summary"]'];
                        for (const descSel of descSelectors) {
                            const descEl = element.querySelector(descSel);
                            if (descEl && descEl.textContent.trim() && descEl.textContent.trim().length > 20) {
                                event.description = descEl.textContent.trim();
                                break;
                            }
                        }

                        // Extract URL
                        const linkSelectors = ['a', '[href]'];
                        for (const linkSel of linkSelectors) {
                            const linkEl = element.querySelector(linkSel);
                            const href = linkEl?.href || element.getAttribute('href');
                            if (href) {
                                event.redirectURL = href.startsWith('http') ? href : `https://unstop.com${href}`;
                                break;
                            }
                        }

                        // Extract tags from chip_text class
                        const tagElements = element.querySelectorAll('.chip_text');
                        if (tagElements.length > 0) {
                            tagElements.forEach(tagEl => {
                                const tagText = tagEl.textContent.trim();
                                if (tagText && tagText.length < 30 && !event.tags.includes(tagText.toLowerCase())) {
                                    event.tags.push(tagText.toLowerCase());
                                }
                            });
                        }

                        // Extract dates from text
                        const cardText = element.textContent;
                        const dateMatches = cardText.match(/(\w+ \d{1,2}, \d{4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{1,2} \w+ \d{4})/g);
                        if (dateMatches && dateMatches.length > 0) {
                            const uniqueDates = [...new Set(dateMatches)];
                            event.deadline = uniqueDates[0];
                            if (uniqueDates.length > 1) {
                                event.startDate = uniqueDates[0];
                                event.endDate = uniqueDates[uniqueDates.length - 1];
                            }
                        }

                        if (event.title && event.title.length > 5) {
                            events.push(event);
                        }
                    });

                    if (events.length > 0) {
                        break; // Found events, no need to try other selectors
                    }
                }
            }

            if (!foundCards) {
                console.log('No cards found with any selector on Unstop');
            }

            return events;
        });
    }
}

export default new unstopScrapper();