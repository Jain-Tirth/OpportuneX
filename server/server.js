import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { startScheduler } from './scheduler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

import eventRoutes from './routes/eventRoute.js';
app.use('/api/events', eventRoutes);

// Scheduler routes
import schedulerRoutes from './routes/schedulerRoute.js';
app.use('/api/scheduler', schedulerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler - must be last
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', requestedUrl: req.originalUrl });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    
    // Start the automated scraping scheduler
    console.log('🚀 Starting automated event scraping scheduler...');
    startScheduler();
});
