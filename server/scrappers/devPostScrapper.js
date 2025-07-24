import axios from 'axios';

export class devPostScrapper {
    constructor() {
        this.baseURL = 'https://devpost.com/api/hackathons/';
    }

    async scrapeDevpost() {
      let page = 1;
      let events = []
      while(page <= 4){
        const pageURL = `${this.baseURL}?${page}`;
        const response = await axios.get(pageURL);
        const data = response.data.hackathons;
        for(let i = 0; i < data.length; i++){
            const { startDate, endDate } = this.getDate(data[i].submission_period_dates);
            const deadline = this.getDeadline(data[i].submission_period_dates);
            events.push({
                title: data[i].title,
                description: data[i].description,
                tags: data[i].themes.map(theme => theme.name),
                startDate: startDate,
                endDate: endDate,
                deadline:deadline,
                redirectURL: data[i].url,
                hostedBy: 'Devpost',
                verified: true,
                type: 'hackathon',
            })
        }
        page++;
      }
      return events;
    }

    getDeadline(deadline){
        try {
            const daysLeftMatch = deadline.match(/(\d+)\s+days?\s+left/i);
            if (daysLeftMatch) {
                const daysLeft = parseInt(daysLeftMatch[1]);
                const deadlineDate = new Date();
                deadlineDate.setDate(deadlineDate.getDate() + daysLeft);
                return deadlineDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
            
            // Handle other date formats (fallback)
            const dateMatch = deadline.match(/\d+/);
            if (dateMatch) {
                return dateMatch[0];
            }
            
            return null;
        } catch (error) {
            console.log(`Error parsing deadline "${deadline}":`, error.message);
            return null;
        }
    }
    getDate(dateString) {
        try {
            if (!dateString) return { startDate: null, endDate: null };
            
            const parts = dateString.split(' - ');
            if (parts.length !== 2) return { startDate: null, endDate: null };
            
            const startPart = parts[0].trim(); 
            const endPart = parts[1].trim();   
            
            const yearMatch = endPart.match(/(\d{4})/);
            const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
            
            // Parse start date: "June 23" + year
            const startDateStr = `${startPart}, ${year}`;
            const startDate = new Date(startDateStr);
            
            const endDate = new Date(endPart);
            
            // Format to YYYY-MM-DD
            const formatDate = (date) => {
                if (isNaN(date.getTime())) return null;
                return date.toISOString().split('T')[0];
            };
            
            return {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate)
            };
            
        } catch (error) {
            console.log(`Error parsing date "${dateString}":`, error.message);
            return { startDate: null, endDate: null };
        }
    }
}

export default new devPostScrapper();
