import { pipeline } from '@xenova/transformers';

let extractor = null;

// Initialize extractor lazily
async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

/**
 * Generates a 384-dimensional vector embedding for the input text locally.
 * @param {string} text - The input text to embed.
 * @returns {Promise<Array<number>>} - Resolves to the embedding vector.
 */
export async function generateEmbedding(text) {
  try {
    const extract = await getExtractor();
    const cleanText = text.replace(/\n/g, ' ').trim();
    
    // Generate the raw output tensor
    const output = await extract(cleanText, { pooling: 'mean', normalize: true });
    
    // Convert the float tensor to a standard JS Array of numbers
    return Array.from(output.data);
  } catch (error) {
    console.error('[Embedding] Local embedding generation failed:', error.message);
    throw error;
  }
}

/**
 * Builds a clean text blob from event properties to use for embedding.
 * @param {Object} event - The event object.
 * @returns {string} - The concatenated text blob.
 */
export function buildEventTextBlob(event) {
  const title = event.title || '';
  const description = event.description || '';
  const hostedBy = event.hostedBy || '';
  const tags = Array.isArray(event.tags) ? event.tags.join(', ') : '';
  return `Title: ${title}. Description: ${description}. Host: ${hostedBy}. Tags: ${tags}.`;
}
