# Concept: RAG Chatbot Pipeline

The AI Navigator conversational discovery engine relies on **Retrieval-Augmented Generation (RAG)**. This document outlines how queries are semantically searched and answered.

---

## 1. Local Embedding Generation
To support semantic search, we translate textual data into 384-dimensional dense vectors.
- **Model**: `Xenova/all-MiniLM-L6-v2` (a lightweight transformer running locally on Node.js using `@xenova/transformers`).
- **Trigger**:
  1. **Scraping Phase**: Whenever an event is scraped from Unstop, Devfolio, Devpost, or Eventbrite, a text representation (title + hostedBy + tags + description) is built and passed to the embedding generator. The vector is saved to the `embedding` column in the `Event` table.
  2. **Query Phase**: When a user inputs a chat query, the exact same embedding model generates a 384-dimensional query vector.

---

## 2. Vector Database & Cosine Similarity Search
We use **Supabase (PostgreSQL)** with the `pgvector` extension. The similarity matching is performed by calling the `match_events` RPC:

```sql
CREATE OR REPLACE FUNCTION match_events (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id int,
  title text,
  description text,
  type text,
  "startDate" date,
  "endDate" date,
  deadline date,
  tags text[],
  "hostedBy" text,
  verified boolean,
  "redirectURL" text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    "Event".id::int,
    "Event".title::text,
    "Event".description::text,
    "Event".type::text,
    "Event"."startDate"::date,
    "Event"."endDate"::date,
    "Event".deadline::date,
    "Event".tags::text[],
    "Event"."hostedBy"::text,
    "Event".verified::boolean,
    "Event"."redirectURL"::text,
    (1 - ("Event".embedding <=> query_embedding))::float AS similarity
  FROM "Event"
  WHERE "Event".embedding IS NOT NULL 
    AND 1 - ("Event".embedding <=> query_embedding) > match_threshold
  ORDER BY "Event".embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 3. Groq Reasoning Context
The top 5 matching events retrieved via `match_events` are appended to the system prompt as structured markdown context.
- **LLM Provider**: **Groq Cloud API** using `groq-sdk`.
- **Model**: `llama-3.3-70b-versatile` (or llama-3-70b/8b fallback).
- **Prompt Structure**:
  - The model is instructed to match the user's intent against the retrieved events list.
  - It highlights matching event properties (e.g. "This is online", "This uses Python").
  - It includes direct hyperlink redirection URLs from the `sources` list so the user can easily register.
