import axios from "axios";
import supabase from '../supabase/client.js';
export class unstopScrapper {
    constructor() {
        this.baseUrl = "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons";
    }

    async scrapeUnstop() {
        try {
            let allEvents = [];
            let currentPage = 1;
            const maxPages = 3;

            while (currentPage <= maxPages) {
                const pageUrl = `${this.baseUrl}&page=${currentPage}`;

                const response = await axios.get(pageUrl);

                if (!response.data || !response.data.data) {
                    console.log(`❌ No data found on page ${currentPage}`);
                    break;
                }

                const paginatedData = response.data.data;
                const rawData = paginatedData.data;

                let eventsArray = [];
                if (Array.isArray(rawData)) {
                    eventsArray = rawData;
                } else if (typeof rawData === 'object' && rawData !== null) {
                    eventsArray = Object.values(rawData);
                } else {
                    break;
                }

                // If no data on this page, we've reached the end
                if (eventsArray.length === 0) {
                    console.log(`✅ No more data on page ${currentPage}, stopping`);
                    break;
                }

                // Process and filter the data
                const processedEvents = await this.processUnstopData(eventsArray);
                allEvents = allEvents.concat(processedEvents);

                // Check if we have more pages
                if (!paginatedData.next_page_url) {
                    break;
                }

                currentPage++;
            }

            console.log(`✅ Total processed ${allEvents.length} hackathon/tech events from Unstop`);
            return allEvents;

        } catch (error) {
            console.error('❌ Error fetching from Unstop API:', error.message);
            return [];
        }
    }
    
    async processUnstopData(rawData) {
        const events = [];

        for (let i = 0; i < rawData.length; i++) {
            try {
                const title = rawData[i]?.title;
                if (!title || title.length < 5) {
                    continue; // Skip events with invalid titles
                }

                const titleLower = title.toLowerCase();

                const endDate = rawData[i].end_date;
                if (endDate && this.isDatePast(endDate)) {
                    try {
                        const { data: deletedData, error: deleteError } = await supabase
                            .from('Event')
                            .delete({count: 'planned'})
                            .eq('title', title);
                        
                        if (deleteError) {
                            console.log(`❌ Error deleting expired event "${title}": ${deleteError.message}`);
                        } else {
                            console.log(`⏰ Deleted expired event: ${title}`);
                        }
                    } catch (error) {
                        console.log(`❌ Exception deleting expired event "${title}": ${error.message}`);
                    }
                    continue;
                }

                // Create event object
                const event = {
                    title: title,
                    description: this.extractDescription(rawData[i]),
                    type: 'hackathons',
                    startDate: this.formatDate(rawData[i].start_date),
                    endDate: this.formatDate(rawData[i].end_date),
                    deadline: this.extractDeadline(rawData[i]),
                    tags: this.extractTags(rawData[i], titleLower),
                    hostedBy: this.extractHostedBy(rawData[i]),
                    verified: true,
                    redirectURL: rawData[i].public_url ? `https://unstop.com/${rawData[i].public_url}` : "https://unstop.com"
                };

                events.push(event);
                console.log(`✅ Added event: ${event.title}`);

            } catch (error) {
                console.log(`❌ Error processing event: ${error.message}`);
            }
        }

        return events;
    }

    extractDescription(item) {
        if (!item) return 'Event description not available';

        let description = '';

        if (item.details) {
            // Remove HTML tags and clean up
            description = item.details.replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        // If no details, use featured_title or other fields
        if (!description || description.length < 20) {
            description = item.featured_title ||
                item.overall_prizes ||
                item.seo_details?.[0]?.description ||
                `${item.title || 'Hackathon'} - Competition/Hackathon on Unstop`;
        }

        return description.substring(0, 500);
    }

    extractDeadline(item) {
        if (item.regnRequirements?.end_regn_dt) {
            return this.formatDate(item.regnRequirements.remainingDaysArray);
        }
        return null;
    }

    extractTags(item, titleLower) {
        if (!item || !titleLower) return ['unstop'];

        const tags = ['unstop'];

        if (item.type === 'hackathons') {
            tags.push('hackathon');
        } else if (item.type === 'competitions') {
            tags.push('competition');
        }
        if (item.subtype) {
            tags.push(item.subtype.replace(/_/g, ' '));
        }

        // Add region tag
        if (item.region) {
            tags.push(item.region);
        }
        return [...new Set(tags)];
    }

    extractHostedBy(item) {
        if (!item) return 'Unstop';

        if (item.organisation?.name) {
            return item.organisation.name;
        }
        return 'Unstop';
    }

    formatDate(dateString) {
        if (!dateString) return null;

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;

            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        } catch (error) {
            console.log(`Error formatting date "${dateString}": ${error.message}`);
            return null;
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
}

export default new unstopScrapper();