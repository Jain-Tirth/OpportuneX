import express from 'express';
const router = express.Router();

import { getEvents, addEvents, scrapeEvents, getSampleEvents } from "../controllers/eventController.js";

router.get("/", getEvents);
router.post("/", addEvents);
router.get("/scrape", scrapeEvents);
router.get("/sample", getSampleEvents);

export default router;