import { generateEmbedding } from '../services/embeddingService.js';
import supabase from '../supabase/client.js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

let groq = null;
try {
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey !== 'your_groq_api_key_here') {
    groq = new Groq({ apiKey });
  }
} catch (e) {
  console.error('Failed to initialize Groq client:', e.message);
}

/**
 * Handles incoming chat messages, runs RAG pipeline against Supabase Vector,
 * and responds using Groq's Llama 3 model.
 */
export const handleChat = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!groq) {
    return res.status(500).json({ 
      error: 'Groq client not initialized. Please configure GROQ_API_KEY in the environment.' 
    });
  }

  try {
    // 1. Generate local 384-dimensional embedding for user's query
    const queryEmbedding = await generateEmbedding(message);

    // 2. Query Supabase for top matches using pgvector similarity RPC
    const { data: matchedEvents, error: searchError } = await supabase.rpc('match_events', {
      query_embedding: queryEmbedding,
      match_threshold: 0.25, // Similarity threshold for all-MiniLM-L6-v2 vectors
      match_count: 5
    });

    if (searchError) {
      console.error('Supabase pgvector search failed:', searchError.message);
      throw searchError;
    }

    // 3. Construct prompt context with matching hackathons
    const context = (matchedEvents || []).map(e => (
      `- Title: ${e.title}
        Host: ${e.hostedBy || 'Unknown'}
        Dates: ${e.startDate || 'TBD'} to ${e.endDate || 'TBD'}
        Deadline: ${e.deadline || 'None'}
        URL: ${e.redirectURL || 'https://unistop.vercel.app'}
        Tags: ${Array.isArray(e.tags) ? e.tags.join(', ') : 'None'}
        Description: ${e.description ? e.description.substring(0, 200) : 'No description'}...`
    )).join('\n\n');

    const systemPrompt = `You are UniStop Chatbot, an assistant for finding hackathons. 
A user will query you for specific hackathons (e.g. AI-based, online, beginner-friendly, etc.).

Here are the most relevant hackathons matching their query from our database:
${context}

Please respond to the user, answering their request and recommending relevant hackathons from the list above. 
Highlight why each recommended hackathon is a good fit (e.g. alignment with AI, online availability, etc.).
Include direct registration/redirect URLs for recommended events so the user can easily click them.
If no hackathons match or are relevant, state that clearly and offer general assistance. Use clean and professional formatting.`;

    // 4. Call Groq SDK for chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0].message.content;

    res.json({
      success: true,
      reply,
      sources: (matchedEvents || []).map(e => ({ id: e.id, title: e.title, url: e.redirectURL }))
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat query: ' + error.message });
  }
};
