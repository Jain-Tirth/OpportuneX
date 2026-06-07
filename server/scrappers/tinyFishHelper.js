import { TinyFish, RunStatus } from '@tiny-fish/sdk';
import dotenv from 'dotenv';
dotenv.config();



let client = null;
try {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (apiKey && apiKey !== 'your_tinyfish_api_key_here') {
    client = new TinyFish({ apiKey });
  }
} catch (e) {
  console.error('Failed to initialize TinyFish client:', e.message);
}

/**
 * Scrapes a platform URL using TinyFish Web Agent.
 * @param {string} url - The URL of the page to scrape.
 * @param {string} platformName - The name of the platform (e.g. Devfolio, Unstop).
 * @returns {Promise<Array|null>} - Resolves to an array of scraped events, or null if TinyFish failed/not configured.
 */
export async function scrapeWithTinyFish(url, platformName) {
  if (!client) {
    console.warn(`[TinyFish] Client not initialized. Cannot scrape ${platformName} with TinyFish.`);
    return null;
  }

  try {
    console.log(`[TinyFish] Scraping ${platformName} from ${url}...`);
    const run = await client.agent.run({
      url,
      goal: `Identify all active or upcoming hackathons listed on this page. For each hackathon, extract the title, description, startDate, endDate, deadline, redirectURL, tags, and hostedBy. Ensure all date fields are strings in YYYY-MM-DD format. Please structure the final output as a JSON object with a single key "events" containing the array of hackathons.`,
    });

    if (run.status !== RunStatus.COMPLETED) {
      console.error(`[TinyFish] Agent run failed for ${platformName} with status: ${run.status}`);
      return null;
    }

    const result = run.result;
    if (!result || !result.events || !Array.isArray(result.events)) {
      console.error(`[TinyFish] Extracted result is missing 'events' array for ${platformName}:`, result);
      return null;
    }

    const events = result.events;
    console.log(`[TinyFish] Successfully scraped ${events.length} events for ${platformName}`);
    return events.map(event => ({
      ...event,
      type: 'hackathon',
      verified: true,
      hostedBy: event.hostedBy || platformName
    }));
  } catch (error) {
    console.error(`[TinyFish] Exception during scraping of ${platformName}:`, error.message);
    return null;
  }
}

