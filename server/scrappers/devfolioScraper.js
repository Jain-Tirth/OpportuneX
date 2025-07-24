import axios from 'axios';
export class devfolioScraper {
    constructor() {
        this.baseURL = 'https://api.devfolio.co/api/hackathons?filter=application_open&page=1';
    }

    async scrapeDevfolio() {
        try {
            const response = await axios.get(this.baseURL);
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
                    deadline: this.normalizeDate(event.submission_ends_at),
                });
            }
            return events;

        } catch (error) {
            return [];
        }
    }

    isDatePast(dateString){
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
