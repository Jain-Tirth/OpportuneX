import express from 'express';
const router = express.Router();

import { getEvents, addEvents, scrapeEvents} from "../controllers/eventController.js";

router.get("/", getEvents);
router.post("/", addEvents);
router.get("/scrape", scrapeEvents);

export default router;