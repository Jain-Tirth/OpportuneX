import express from 'express';
const router = express.Router();

import { getEvents, addEvents, scrapeEventsHandler } from "../controllers/eventController.js";

router.get("/", getEvents);
router.post("/", addEvents);
router.get("/scrape", scrapeEventsHandler);

export default router;