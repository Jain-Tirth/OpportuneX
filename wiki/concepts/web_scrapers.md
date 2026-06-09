# Concept: TinyFish Web Scrapers

UniStop aggregates coding opportunities from multiple platforms. Rather than relying on fragile CSS selectors or undocumented private APIs, we use **TinyFish Web Agent SDK** (`@tiny-fish/sdk`).

---

## 1. Scraper Configurations

Each platform has a dedicated scraper module under `server/scrappers/`:

| Platform | Target URL | Scraper Module |
| :--- | :--- | :--- |
| **Unstop** | `https://unstop.com/hackathons` | [unstopScrapper.js](file:///c:/Code/Unistop/server/scrappers/unstopScrapper.js) |
| **Devfolio** | `https://devfolio.co/hackathons` | [devfolioScraper.js](file:///c:/Code/Unistop/server/scrappers/devfolioScraper.js) |
| **Devpost** | `https://devpost.com/hackathons` | [devPostScrapper.js](file:///c:/Code/Unistop/server/scrappers/devPostScrapper.js) |
| **Eventbrite** | `https://www.eventbrite.com/d/online/hackathon/` | [eventBriteScrapper.js](file:///c:/Code/Unistop/server/scrappers/eventBriteScrapper.js) |

---

## 2. TinyFish Execution Flow
The scrapers invoke `client.agent.run` by providing instructions and a target schema:

1. **Browser Navigation**: TinyFish spins up a headless browser and loads the URL.
2. **Dynamic Crawling**: The agent scrolls to load lazy-loaded elements.
3. **Structured Extraction**: The agent parses page content and extracts items matching this output schema:
   ```json
   {
     "title": "Hackathon Title",
     "description": "Short description of the event",
     "hostedBy": "Organizing platform or company",
     "startDate": "YYYY-MM-DD",
     "endDate": "YYYY-MM-DD",
     "deadline": "YYYY-MM-DD",
     "tags": ["AI", "React", "Rust"],
     "redirectURL": "Link to registration page"
   }
   ```
4. **Data Normalization**: Dates are parsed to ISO standard, and tags are mapped to lowercase tokens.

---

## 3. Database Upserting
During upserting (in `eventController.js`):
- We check if the event already exists by comparing `title` and `hostedBy` keys or matching `redirectURL` to prevent duplication.
- New events prompt a call to `embeddingService` to generate the 384-dimensional vector embedding prior to database insertion.
