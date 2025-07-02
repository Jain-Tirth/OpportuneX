import puppeteer from 'puppeteer';

export class devPostScrapper {
    constructor() {
        this.baseURL = 'https://devpost.com';
        this.hackathonsUrl = 'https://devpost.com/hackathons';
        this.name = 'Devpost';
    }
    async scrapeDevpost(limit = 5) {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        const url = 'https://devpost.com/hackathons';
        const hackathons = [];

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.waitForSelector('.hackathon-tile');

            const links = await page.evaluate(() => {
                const anchorEls = Array.from(document.querySelectorAll('a.hackathon-tile'));
                return anchorEls.map(a => a.href);
            });

            for (let i = 0; i < Math.min(limit, links.length); i++) {
                const hackathonUrl = links[i];
                await page.goto(hackathonUrl, { waitUntil: 'networkidle2' });
                await page.waitForTimeout(2000);

                const data = await page.evaluate(() => {
                    const getText = (selector) => document.querySelector(selector)?.innerText.trim() || 'N/A';

                    const title = document.querySelector('.content .mb-4')?.innerText.trim() || 'N/A';
                    const description = getText('.challenge-description');

                    let startDate = 'N/A';
                    let endDate = 'N/A';
                    const submissionPeriod = document.querySelector('.submission-period');
                    if (submissionPeriod) {
                        const text = submissionPeriod.innerText.trim();
                        const match = text.match(/([A-Za-z]+ \d{1,2})\s*[-–]\s*([A-Za-z]+ \d{1,2}),\s*(\d{4})/);
                        if (match) {
                            startDate = `${match[1]}, ${match[3]}`;
                            endDate = `${match[2]}, ${match[3]}`;
                        }
                    }

                    let deadline = null;
                    const deadlineEl = document.querySelector('.submission-deadline time');
                    if (deadlineEl) deadline = deadlineEl.getAttribute('datetime');

                    const tagElements = document.querySelectorAll('.fa-check-square');
                    const tags = Array.from(tagElements).map(el => el.parentElement?.innerText.trim()).filter(Boolean);

                    return {
                        title,
                        description,
                        redirectURL: window.location.href,
                        deadline: deadline || 'N/A',
                        startDate,
                        endDate,
                        tags: tags.length ? tags : ['hackathon', 'devpost'],
                        hostedBy: 'Devpost',
                        verified: true,
                        type: 'hackathon'
                    };
                });

                hackathons.push(data);
            }
        } catch (error) {
            console.error('❌ Error scraping Devpost:', error);
        } finally {
            await browser.close();
        }

        return hackathons;
    }
}
export default new devPostScrapper();
