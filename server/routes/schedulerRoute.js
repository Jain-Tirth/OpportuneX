import express from 'express';
import scheduler from '../scheduler.js';

const router = express.Router();

// Get scheduler status
router.get('/status', (req, res) => {
    try {
        const status = scheduler.getSchedulerStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start scheduler
router.post('/start', (req, res) => {
    try {
        scheduler.startScheduler();
        res.json({
            success: true,
            message: 'Scheduler started successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stop scheduler
router.post('/stop', (req, res) => {
    try {
        scheduler.stopScheduler();
        res.json({
            success: true,
            message: 'Scheduler stopped successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Trigger scraping (for Vercel cron job or manual call)
router.get('/trigger', async (req, res) => {
    try {
        const result = await scheduler.triggerManualScraping();
        res.json({
            success: true,
            message: 'Scraping completed successfully',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
