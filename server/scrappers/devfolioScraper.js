import axios from 'axios';
import supabase from '../supabase/client.js';
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
            // await this.insertData(events);
            return events;

        } catch (error) {
            return [];
        }
    }
    // async insertData(events) {
    //     try {
    //         for (let i = 0; i < events.length; i++) {
    //             try {
    //                 const { data: existingEvent, error: existingError } = await supabase
    //                     .from('Event')
    //                     .select('id')
    //                     .eq('title', events[i].title)
    //                     .eq('hostedBy', events[i].hostedBy)
    //                     .limit(1);
                    
    //                 if (existingError) {
    //                     continue;
    //                 }
    //                 if(this.isDatePast(events[i].endDate)){
    //                     const{data:deletedData,error:deleteError}=await supabase
    //                     .from('Event')
    //                     .delete({count: 'planned'})
    //                     .eq('title', events[i].title);
    //                     if(deleteError){
    //                         continue;
    //                     }
    //                 }
    //                 if (existingEvent && existingEvent.length > 0) {
    //                     continue;
    //                 }
    //                 const { data, error } = await supabase
    //                     .from('Event')
    //                     .insert([events[i]])
    //                     .select();
                    
    //                 if (error) {
    //                     continue;
    //                 }
    //             } catch (eventError) {
    //                 continue;
    //             }
    //         }
    //     } catch (error) {
    //         console.log("Error in inserting the data:", error.message);
    //     }
    // }

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
            console.log(`Error formatting date "${dateString}": ${error.message}`);
            return null;
        }
    }
}
export default new devfolioScraper();
