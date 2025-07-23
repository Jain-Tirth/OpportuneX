import supabase from '../supabase/client.js';
import mainScrapping from '../scrappers/mainScrapping.js';

export const scrapeEvents = async (req, res) => {
    try {
        const events = await mainScrapping.scrapeHackathons();
        
        if (!events || events.length === 0) {
            console.log('No events found, using sample data...');
            const sampleEvents = mainScrapping.getSampleData();
            return res.status(200).json({
                message: 'No events scraped, returned sample data',
                events: sampleEvents,
                count: sampleEvents.length
            });
        }

        const savedEvents = [];
        for (const event of events) {
            try {
                const { data: existingEvent, error: existingError } = await supabase
                .from('Event')
                .select('id')
                .eq('title', event.title)
                .eq('hostedBy', event.hostedBy)
                .limit(1);
                
                if (existingEvent && existingEvent.length > 0) {
                    console.log('Duplicate event found, skipping:', event.title);
                    continue;
                }
                
                const { data, error } = await supabase
                .from('Event')
                .insert([event])
                    .select();
                    
                    if (error) {
                        console.log('Error saving event:', event.title, error.message);
                    } else {
                        savedEvents.push(data[0]);
                    console.log('Saved event:', event.title);
                }
            } catch (saveError) {
                console.log('Exception saving event:', event.title, saveError.message);
            }
        }

    } catch (error) {
        console.error('Error in scrapeEvents:', error);
    }
};

export const deleteExpireEvents = async() => {
    try {
        const today = new Date().toISOString().split('T')[0]; 
    
        const { data: deletedData, error: deleteError } = await supabase
            .from('Event')
            .delete({ count: 'exact' })
            .lt('endDate', today)
            .select();
        
        if (deleteError) {
            console.log('❌ Error deleting expired events:', deleteError.message);
            return { success: false, error: deleteError.message };
        }
        
        
    } catch (error) {
    }
}

// ...existing code...
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
