import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, url, title, tags } = await req.json();

    if (!type || (!content && !url)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and (content or url)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedText = content;
    let documentTitle = title || 'Untitled Document';

    // Fetch content from URL if provided
    if (type === 'url' && url) {
      const { text, title: extractedTitle } = await fetchUrlContent(url);
      processedText = text;
      documentTitle = extractedTitle || title || 'Web Document';
    } else if (type === 'pdf') {
      throw new Error('PDF processing not yet implemented');
    }

    if (!processedText) {
      throw new Error('No content to process');
    }

    // Insert document metadata
    const { data: document, error: docError } = await supabase
      .from('kb_documents')
      .insert([{
        title: documentTitle,
        source: type === 'url' ? 'url' : 'manual',
        url: url || null,
        tags: tags || []
      }])
      .select()
      .single();

    if (docError) throw docError;

    // Chunk the text
    const chunks = chunkText(processedText, 1000, 100);
    
    let processedChunks = 0;
    let errors = [];

    // Process chunks and generate embeddings
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk);
        
        const { error: chunkError } = await supabase
          .from('kb_chunks')
          .insert([{
            document_id: document.id,
            content: chunk,
            embedding: embedding,
            metadata: { 
              chunk_index: processedChunks,
              total_chunks: chunks.length 
            }
          }]);

        if (chunkError) throw chunkError;
        processedChunks++;
      } catch (error) {
        console.error(`Error processing chunk ${processedChunks}:`, error);
        errors.push(`Chunk ${processedChunks}: ${error.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      document_id: document.id,
      chunks_processed: processedChunks,
      total_chunks: chunks.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in concierge-ingest:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function fetchUrlContent(url: string): Promise<{ text: string; title: string }> {
  const response = await fetch(url);
  const html = await response.text();
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Web Document';
  
  // Extract text content (remove script and style tags)
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return { text: textContent, title };
}

function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;
    
    if (potentialChunk.length <= maxChunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
        
        // Handle overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 10)); // Rough word-based overlap
        currentChunk = overlapWords.join(' ') + (overlapWords.length > 0 ? '. ' : '') + trimmedSentence;
      } else {
        // Single sentence is too long, split it
        const words = trimmedSentence.split(' ');
        for (let i = 0; i < words.length; i += maxChunkSize / 10) {
          const wordChunk = words.slice(i, i + maxChunkSize / 10).join(' ');
          chunks.push(wordChunk);
        }
        currentChunk = '';
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}