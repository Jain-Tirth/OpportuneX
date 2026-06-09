# Development Log & Milestones

This log registers the chronological timeline of major system changes, architectural integrations, and styling adaptations in the UniStop project.

---

## [2026-06-08] - Styling Integration & Navigation Restructure
- **UI Refactoring**: Applied the "AI Hackathon Discovery Hub" Stitch style guide (Indigo Horizon) with a pure **white/light theme** across the application. Defined CSS tokens on `:root` in `App.css` and updated `index.css`, `Landing.css`, `Saved.css`, and `EventCard.css`.
- **Navigation Redesign**: Changed the navigation structure to offer three main menu tabs:
  - **Hub**: A homepage dashboard summary of trending and closing-soon hackathons.
  - **Filter**: Dedicated search/filtering engine with advanced search slide drawer.
  - **AI Navigator**: First-class, full-page chatbot workspace.
- **Backend Chat Update**: Modified `chatController.js` to return the complete Event objects inside sources, enabling the AI Navigator to render horizontal cards beneath replies.

---

## [2026-06-07] - RAG Chatbot Integration
- **Local Embedding Service**: Created `embeddingService.js` to instantiate a local model (`Xenova/all-MiniLM-L6-v2`) which translates textual queries into 384-dimensional dense vectors.
- **Supabase RPC (`match_events`)**: Compiled the Postgres similarity matching function using pgvector `<=>` cosine distance, resolving returns table conflicts by introducing explicit type casts.
- **Groq Llama 3 Router**: Set up Groq client reasoning inside `chatController.js` using the Llama 3 model to respond to natural language questions with contextual matching events.
- **Embedding Generation during Scraping**: Configured scrapers controller to generate and upload embeddings for new events dynamically during the scraping loop.

---

## [2026-06-06] - TinyFish Scraper Migration
- **Dependency Integration**: Installed `@tiny-fish/sdk` on the Express backend.
- **Scraper Rewrite**: Migrated Cheerio-based scrapers (Unstop, Devfolio, Devpost, Eventbrite) to use dynamic LLM browser agent automation (`client.agent.run`).
- **Data Standarization**: Ensured all scrapers output standardized JSON objects containing title, description, deadline, startDate, endDate, hostedBy, and tags.
