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

    let data = run.result;

    // 1. Handle nested result string e.g. { result: "```json..." }
    if (data && typeof data === 'object' && typeof data.result === 'string') {
      data = data.result;
    }

    // 2. Parse string if necessary
    if (typeof data === 'string') {
      try {
        // Clean markdown backticks if present
        const jsonMatch = data.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : data;
        data = JSON.parse(jsonText.trim());
      } catch (parseErr) {
        console.error(`[TinyFish] Failed to parse JSON from result string:`, parseErr.message);
        return null;
      }
    }

    // 3. Extract events array (handles raw arrays or objects with 'events' key)
    let events = null;
    if (Array.isArray(data)) {
      events = data;
    } else if (data && Array.isArray(data.events)) {
      events = data.events;
    }

    if (!events) {
      console.error(`[TinyFish] Extracted result could not be parsed into an events array for ${platformName}:`, run.result);
      return null;
    }
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

