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
    const { type, content, url, title, tags = [] } = await req.json();

    let textContent = content;
    let documentTitle = title || 'Untitled Document';

    // Handle different input types
    if (type === 'url' && url) {
      const urlContent = await fetchUrlContent(url);
      textContent = urlContent.text;
      documentTitle = urlContent.title || new URL(url).hostname;
    } else if (type === 'pdf') {
      throw new Error('PDF processing not implemented yet');
    }

    if (!textContent) {
      throw new Error('No content to process');
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('kb_documents')
      .insert({
        title: documentTitle,
        source: type === 'qa' ? 'trainer' : (type === 'url' ? 'url' : 'kb'),
        url: url || null,
        tags
      })
      .select()
      .single();

    if (docError) {
      throw docError;
    }

    // Chunk the content
    const chunks = chunkText(textContent, 500, 50);
    let totalChunks = 0;
    let successfulChunks = 0;

    for (const chunk of chunks) {
      totalChunks++;
      
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk);
        
        // Store chunk with embedding
        const { error: chunkError } = await supabase
          .from('kb_chunks')
          .insert({
            document_id: document.id,
            content: chunk,
            embedding: embedding,
            metadata: {
              chunk_index: totalChunks - 1,
              source_type: type,
              document_title: documentTitle
            }
          });

        if (!chunkError) {
          successfulChunks++;
        } else {
          console.error('Error storing chunk:', chunkError);
        }
      } catch (error) {
        console.error('Error processing chunk:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      document_id: document.id,
      stats: {
        total_chunks: totalChunks,
        successful_chunks: successfulChunks,
        failed_chunks: totalChunks - successfulChunks
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in concierge-ingest:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchUrlContent(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Basic HTML text extraction (in production, use a proper parser)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    return { text: textContent, title };
  } catch (error) {
    throw new Error(`Failed to fetch URL content: ${error.message}`);
  }
}

function chunkText(text: string, maxChunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
        
        // Create overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-overlap).join(' ');
        currentChunk = overlapWords + '. ' + trimmedSentence;
      } else {
        // Single sentence is too long, split by words
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

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}