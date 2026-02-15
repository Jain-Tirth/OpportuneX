import supabase from '../supabase/client.js';
import mainScrapping from '../scrappers/mainScrapping.js';

export const scrapeEvents = async (events) => {
    try {
        const resolvedEvents = await Promise.resolve(events);
        
        if (!resolvedEvents || resolvedEvents.length === 0) {
            console.log('No events received to process');
            return { success: false, message: 'No events to process' };
        }

        const savedEvents = [];
        for (let i = 0; i < resolvedEvents.length; i++) {
            try {
                const event = resolvedEvents[i];
                
                const { data: existingEvent, error: existingError } = await supabase
                    .from('Event')
                    .select('id')
                    .eq('title', event.title)
                    .eq('hostedBy', event.hostedBy)
                    .limit(1);

                if (existingEvent && existingEvent.length > 0) {
                    continue;
                }

                const { data, error } = await supabase
                    .from('Event')
                    .insert([event])
                    .select();
                    
                if (error) {
                    console.error('Error saving event:', event.title, error.message);
                } else {
                    savedEvents.push(data[0]);
                }
            } catch (saveError) {
                console.error('Exception saving event:', resolvedEvents[i]?.title, saveError.message);
            }
        }
        
        return { 
            success: true, 
            scraped: resolvedEvents.length, 
            saved: savedEvents.length,
            events: savedEvents 
        };

    } catch (error) {
        console.error('Error in scrapeEvents:', error);
        return { success: false, error: error.message };
    }
};

export const deleteExpireEvents = async () => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayStart = new Date(`${todayStr}T00:00:00Z`);

        const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';

        const isPastDate = (value) => {
            if (isBlank(value)) return false;

            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                    return trimmed < todayStr;
                }
                const parsed = new Date(trimmed);
                if (Number.isNaN(parsed.getTime())) return false;
                return parsed < todayStart;
            }

            if (value instanceof Date) {
                return value < todayStart;
            }

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) return false;
            return parsed < todayStart;
        };

        const { data: events, error: fetchError } = await supabase
            .from('Event')
            .select('id, deadline, startDate, endDate');

        if (fetchError) {
            console.error('❌ Error fetching events for cleanup:', fetchError.message);
            return { success: false, error: fetchError.message };
        }

        const idsToDelete = (events || [])
            .filter((event) => {
                const deadlinePast = isPastDate(event.deadline);
                const startPast = isPastDate(event.startDate);
                const endPast = isPastDate(event.endDate);

                return deadlinePast || startPast || endPast;
            })
            .map((event) => event.id);

        if (idsToDelete.length === 0) {
            return { success: true, deleted: 0 };
        }

        const { error: deleteError, count } = await supabase
            .from('Event')
            .delete()
            .in('id', idsToDelete);

        if (deleteError) {
            console.error('❌ Error deleting expired events:', deleteError.message);
            return { success: false, error: deleteError.message };
        }

        return { success: true, deleted: count || idsToDelete.length };
    } catch (error) {
        console.error('Exception in deleteExpireEvents:', error.message);
    }
};


export const getEvents = async (req, res) => {
    const { data, error } = await supabase.from('Event').select('*').order('deadline', { ascending: true });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
}

export const addEvents = async (req, res) => {
    // Map the incoming data to match your table structure
    const newEvent = {
        title: req.body.title,
        type: req.body.type,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        deadline: req.body.deadline,
        tags: req.body.tags || [],
        hostedBy: req.body.hosted_by || req.body.hostedBy,
        verified: req.body.verified === 'TRUE' || req.body.verified === true,
        redirectURL: req.body.redirectURL
    };

    try {
        const { data, error } = await supabase
            .from('Event')
            .insert([newEvent])
            .select();

        if (error) {
            return res.status(400).json({ error: error.message || 'Database error' });
        }
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
}

// Route handler for scraping events via API
export const scrapeEventsHandler = async (req, res) => {
    try {
        console.log('🔄 Starting manual scraping...');
        
        // Send immediate response
        res.status(202).json({
            success: true,
            message: 'Scraping started in background',
            status: 'processing'
        });
        
        // Run scraping in background (don't await)
        (async () => {
            try {
                // Scrape events from all platforms
                const eventsData = await mainScrapping.scrapeHackathons();
                
                // Delete expired events
                await deleteExpireEvents();
                
                // Save scraped events to database
                const result = await scrapeEvents(eventsData);
                
                if (result.success) {
                    console.log('✅ Manual scraping completed successfully');
                    console.log(`   Scraped: ${result.scraped}, Saved: ${result.saved}`);
                } else {
                    console.error('⚠️ Scraping completed with issues:', result.message);
                }
            } catch (error) {
                console.error('❌ Background scraping failed:', error.message);
            }
        })();
        
    } catch (error) {
        console.error('❌ Failed to start scraping:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to start scraping',
            error: error.message
        });
    }
}
