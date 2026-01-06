import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
export class devfolioScraper {
    constructor() {
        this.baseURL = process.env.DEVFOLIO_API_URL;
    }

    async scrapeDevfolio() {
        try {
            for (let i = 1; i <= 2; i++) {
                const response = await axios.get(`${this.baseURL}?&page=${i}`);
                const data = response.data.result || [];
                const events = [];


                for (let i = 0; i < data.length; i++) {
                    let event = data[i];
                    events.push({
                        title: event.name,
                        description: event.desc,
                        tags: event.tagline ? [event.tagline] : ['hackathon'], // Convert string to array
                        startDate: this.normalizeDate(event.starts_at),
                        endDate: this.normalizeDate(event.ends_at),
                        redirectURL: `https://${event.slug}.devfolio.co`,
                        hostedBy: 'Devfolio',
                        verified: true,
                        type: 'hackathon',
                        deadline: this.normalizeDate(event.hackathon_setting.reg_ends_at),
                    });
                }
            }
            return events;

        } catch (error) {
            return [];
        }
    }

    isDatePast(dateString) {
        if (!dateString) return false;

        try {
            const date = new Date(dateString);
            const now = new Date();
            return date < now;
        } catch (error) {
            return false;
        }
    }

    normalizeDate(dateString) {
        if (!dateString) return null;

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;

            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error(`Error formatting date "${dateString}": ${error.message}`);
            return null;
        }
    }
}
export default new devfolioScraper();
