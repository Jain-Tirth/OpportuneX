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
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);

    const search = String(req.query.search || '').trim();
    const platform = String(req.query.platform || 'all').trim().toLowerCase();
    const sortBy = String(req.query.sortBy || 'newest').trim();
    const filterFree = String(req.query.free || '').toLowerCase() === 'true';
    const filterOnline = String(req.query.online || '').toLowerCase() === 'true';
    const filterBeginner = String(req.query.beginner || '').toLowerCase() === 'true';
    const filterPrize = String(req.query.prize || '').toLowerCase() === 'true';
    const locationQuery = String(req.query.location || '').trim();

    const normalizeText = (value) => (value || '').toString().toLowerCase();
    const getEventSearchBlob = (event) => {
        const tags = Array.isArray(event.tags) ? event.tags.join(' ') : '';
        return normalizeText(
            `${event.title || ''} ${event.description || ''} ${tags} ${event.hostedBy || ''} ${event.location || ''}`
        );
    };
    const hasKeyword = (blob, keywords) =>
        keywords.some((keyword) => blob.includes(keyword));
    const isEventFree = (event) => hasKeyword(getEventSearchBlob(event), ['free', 'no fee', 'zero fee', 'free entry']);
    const isEventOnline = (event) => hasKeyword(getEventSearchBlob(event), [
        'online',
        'virtual',
        'remote',
        'zoom',
        'discord',
        'google meet',
        'meet.google'
    ]);
    const isEventBeginner = (event) => hasKeyword(getEventSearchBlob(event), [
        'beginner',
        'beginners',
        'first time',
        'first-time',
        'no experience',
        'novice',
        'introductory',
        'freshers'
    ]);
    const isEventPrize = (event) => hasKeyword(getEventSearchBlob(event), [
        'prize',
        'cash',
        'award',
        'scholarship',
        '$',
        'inr',
        'usd',
        'swag'
    ]);

    const { data: allEvents, error } = await supabase
        .from('Event')
        .select('*');

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    let filtered = [...(allEvents || [])];

    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((event) =>
            event.title?.toLowerCase().includes(searchLower) ||
            event.description?.toLowerCase().includes(searchLower) ||
            event.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
        );
    }

    if (platform === 'unstop') {
        filtered = filtered.filter((event) => event.tags?.includes('unstop'));
    }

    if (platform !== 'all' && platform !== 'unstop') {
        filtered = filtered.filter((event) => event.hostedBy?.toLowerCase() === platform);
    }

    if (filterFree) {
        filtered = filtered.filter(isEventFree);
    }

    if (filterOnline) {
        filtered = filtered.filter(isEventOnline);
    }

    if (filterBeginner) {
        filtered = filtered.filter(isEventBeginner);
    }

    if (filterPrize) {
        filtered = filtered.filter(isEventPrize);
    }

    if (locationQuery) {
        const locationLower = locationQuery.toLowerCase();
        filtered = filtered.filter((event) => getEventSearchBlob(event).includes(locationLower));
    }

    switch (sortBy) {
        case 'newest':
            filtered.sort((a, b) => {
                const today = new Date();
                const aEndDate = new Date(a.endDate);
                const bEndDate = new Date(b.endDate);

                if (aEndDate >= today && bEndDate >= today) {
                    return aEndDate - bEndDate;
                }
                if (aEndDate < today && bEndDate < today) {
                    return bEndDate - aEndDate;
                }
                if (aEndDate >= today && bEndDate < today) {
                    return -1;
                }
                if (bEndDate >= today && aEndDate < today) {
                    return 1;
                }
                return 0;
            });
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            break;
        case 'deadline':
            filtered.sort((a, b) => {
                const today = new Date();
                const aDeadline = new Date(a.deadline || a.endDate);
                const bDeadline = new Date(b.deadline || b.endDate);

                if (aDeadline >= today && bDeadline >= today) {
                    return aDeadline - bDeadline;
                }
                if (aDeadline < today && bDeadline < today) {
                    return bDeadline - aDeadline;
                }
                if (aDeadline >= today && bDeadline < today) {
                    return -1;
                }
                if (bDeadline >= today && aDeadline < today) {
                    return 1;
                }
                return 0;
            });
            break;
        case 'endingSoon':
            filtered.sort((a, b) => {
                const today = new Date();
                const aTarget = new Date(a.deadline || a.endDate);
                const bTarget = new Date(b.deadline || b.endDate);

                if (aTarget >= today && bTarget >= today) {
                    return aTarget - bTarget;
                }
                if (aTarget < today && bTarget < today) {
                    return bTarget - aTarget;
                }
                if (aTarget >= today && bTarget < today) {
                    return -1;
                }
                if (bTarget >= today && aTarget < today) {
                    return 1;
                }
                return 0;
            });
            break;
        case 'alphabetical':
            filtered.sort((a, b) => a.title?.localeCompare(b.title));
            break;
        default:
            break;
    }

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);
    const from = (safePage - 1) * limit;
    const data = filtered.slice(from, from + limit);

    return res.status(200).json({
        data,
        page: safePage,
        limit,
        total,
        totalPages
    });
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
        console.log('Starting manual scraping...');
        
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
                    console.log('Manual scraping completed successfully');
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
