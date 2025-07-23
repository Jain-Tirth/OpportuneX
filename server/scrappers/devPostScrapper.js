import axios from 'axios';

export class devPostScrapper {
    constructor() {
        this.baseURL = 'https://devpost.com/api/hackathons/';
    }

    async scrapeDevpost() {
      let page = 1;
      while(page <= 4){
        const pageURL = `${this.baseURL}?${page}`;
        const events = await axios.get(pageURL);
        console.log(events.data);
      }
    }
}
export default new devPostScrapper();
