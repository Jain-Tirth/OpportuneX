import axios from 'axios';

export class devPostScrapper {
    constructor() {
        this.baseURL = 'https://devpost.com/api/hackathons/';
    }

    async scrapeDevpost() {
        try {
            let page = 1;
            let events = [];
            const maxPages = 4;

            while (page <= maxPages) {
                try {
                    const response = await axios.get(`${this.baseURL}?page=${page}`);

                    if (!response.data || !response.data.hackathons) {
                        break;
                    }

                    const data = response.data.hackathons;

                    if (!Array.isArray(data) || data.length === 0) {
                        break;
                    }

                    for (let i = 0; i < data.length; i++) {
                        try {
                            const hackathon = data[i];

                            const { startDate, endDate } = this.getDate(hackathon.submission_period_dates);
                            const deadline = this.getDeadline(hackathon.submission_period_dates);

                            const event = {
                                title: hackathon.title,
                                description: hackathon.description || 'DevPost hackathon',
                                tags: hackathon.themes ? hackathon.themes.map(theme => theme.name) : ['devpost'],
                                startDate: startDate,
                                endDate: endDate,
                                deadline: deadline,
                                redirectURL: hackathon.url || 'https://devpost.com',
                                hostedBy: 'Devpost',
                                verified: true,
                                type: 'hackathon',
                            };

                            events.push(event);

                        } catch (eventError) {
                            console.error(`❌ Error processing DevPost event:`, eventError.message);
                        }
                    }

                    page++;

                } catch (pageError) {
                    console.error(`❌ Error fetching DevPost page ${page}:`, pageError.message);
                    break;
                }
            }
            return events;

        } catch (error) {
            console.error('❌ Error in DevPost scraping:', error.message);
            return [];
        }
    }

    getDeadline(deadline) {
        try {
            if (!deadline) return null;

            // Handle "X days left" format
            const daysLeftMatch = deadline.match(/(\d+)\s+days?\s+left/i);
            if (daysLeftMatch) {
                const daysLeft = parseInt(daysLeftMatch[1]);
                const deadlineDate = new Date();
                deadlineDate.setDate(deadlineDate.getDate() + daysLeft);
                return deadlineDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            }

            // Try to parse as a date range and use end date
            const { endDate } = this.getDate(deadline);
            if (endDate) {
                return endDate;
            }

            return null;
        } catch (error) {
            console.log(`Error parsing deadline "${deadline}":`, error.message);
            return null;
        }
    }
    getDate(dateString) {
        try {
            const parts = dateString.split(' - ');
            if (parts.length !== 2) {
                return { startDate: null, endDate: null };
            }

            const startPart = parts[0].trim();
            const endPart = parts[1].trim();

            // Extract year from end part
            const yearMatch = endPart.match(/(\d{4})/);
            const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

            // Parse start date: "June 23" + year
            const startDateStr = `${startPart}, ${year}`;
            const startDate = new Date(startDateStr);

            // Parse end date - check if month is missing
            let endDateStr;
            if (endPart.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
                endDateStr = endPart;
            } else {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = monthNames[startDate.getMonth()];
                endDateStr = `${monthName} ${endPart}`;
            }

            const endDate = new Date(endDateStr);

            // Format to YYYY-MM-DD with validation
            const formatDate = (date, label) => {
                if (!date || isNaN(date.getTime())) {
                    return null;
                }
                return date.toISOString().split('T')[0];
            };

            const formattedStartDate = formatDate(startDate, 'start');
            const formattedEndDate = formatDate(endDate, 'end');

            return {
                startDate: formattedStartDate,
                endDate: formattedEndDate
            };

        } catch (error) {
            console.log(`❌ Error parsing date "${dateString}":`, error.message);
            return { startDate: null, endDate: null };
        }
    }
}
export default new devPostScrapper();
