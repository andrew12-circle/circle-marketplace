
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MASTER_PROMPT = `You are a senior research analyst specializing in real estate technology and services. Generate comprehensive, actionable research for real estate professionals that goes beyond surface-level information.

IMPORTANT: You are NOT affiliated with AgentAdvice.com or any other specific platform. Do not mention AgentAdvice.com, reference it, or claim any association with it in your research. Focus on providing independent, unbiased analysis.

Your research should be comprehensive and agent-tier aware. Focus on:

1. **Executive Summary**: Clear, jargon-free overview that answers "What is this and why should I care?"

2. **Who It's Best For**: Segment by agent performance tiers:
   - New Agents (0-10 transactions/year): Focus on foundational tools, cost-effectiveness
   - Rising Agents (11-50 transactions/year): Growth acceleration, efficiency gains
   - Established Agents (51-100 transactions/year): Scale optimization, team building
   - Top 10% Agents (100+ transactions/year): Competitive advantage, market dominance

3. **Where It Works / Where It Fails**: Be brutally honest about limitations, geographic constraints, market dependencies

4. **Performance Benchmarks**: Cite specific metrics, conversion rates, ROI figures with sources

5. **Implementation Plan**: 30/60/90-day milestones with actionable checklists

6. **Pairing & Stack**: What tools/services amplify results when used together

7. **ROI Models**: Conservative, base, and aggressive scenarios with clear assumptions

8. **Budget & Time Investment**: Real cost breakdowns including hidden costs and time commitments

9. **Risks & Compliance**: RESPA considerations, legal implications, potential pitfalls

10. **Geo/Seasonality**: How performance varies by market type and timing

11. **KPIs to Track**: Leading and lagging indicators for success measurement

12. **FAQs & Objections**: Address common concerns and skepticism

13. **Citations**: Include source links and dates for credibility

Write in a professional yet accessible tone. Be data-driven and cite specific examples where possible.`;

interface ServiceRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  retail_price: string;
  pro_price: string;
  rating: number;
  vendors?: { name: string; website_url?: string; };
}

interface BulkRequest {
  masterPrompt?: string;
  mode: 'overwrite' | 'missing-only';
  limit: number;
  offset: number;
  dryRun: boolean;
  marketIntelligence: boolean;
  sources?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Authenticate and verify admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log('🔐 User authenticated:', user.id);

    // Enhanced admin verification with multiple fallback methods
    let isAdmin = false;
    let adminCheckDetails = {};

    try {
      // Method 1: Try enhanced admin self-check RPC
      console.log('🔍 Attempting enhanced admin self-check...');
      const { data: enhancedCheck, error: enhancedError } = await supabase.rpc('admin_self_check_enhanced');
      
      if (!enhancedError && enhancedCheck?.admin_checks?.any_admin_method) {
        isAdmin = true;
        adminCheckDetails.method = 'enhanced_rpc';
        adminCheckDetails.result = enhancedCheck;
        console.log('✅ Admin verified via enhanced RPC');
      } else {
        console.log('⚠️ Enhanced RPC failed or returned false:', enhancedError || 'No admin access');
        adminCheckDetails.enhanced_error = enhancedError;
      }
    } catch (error) {
      console.log('⚠️ Enhanced RPC error:', error);
      adminCheckDetails.enhanced_exception = error.message;
    }

    // Method 2: Fallback to basic admin status RPC
    if (!isAdmin) {
      try {
        console.log('🔍 Attempting basic admin status RPC...');
        const { data: basicCheck, error: basicError } = await supabase.rpc('get_user_admin_status');
        
        if (!basicError && basicCheck === true) {
          isAdmin = true;
          adminCheckDetails.method = 'basic_rpc';
          console.log('✅ Admin verified via basic RPC');
        } else {
          console.log('⚠️ Basic RPC failed or returned false:', basicError || 'No admin access');
          adminCheckDetails.basic_error = basicError;
        }
      } catch (error) {
        console.log('⚠️ Basic RPC error:', error);
        adminCheckDetails.basic_exception = error.message;
      }
    }

    // Method 3: Fallback to direct profile lookup
    if (!isAdmin) {
      try {
        console.log('🔍 Attempting direct profile lookup...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin, specialties, display_name')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile lookup error:', profileError);
          adminCheckDetails.profile_error = profileError;
        } else {
          console.log('📄 Profile found:', { 
            is_admin: profile?.is_admin, 
            specialties: profile?.specialties,
            display_name: profile?.display_name 
          });
          
          // Check both is_admin flag and specialties array
          const hasAdminFlag = profile?.is_admin === true;
          const hasAdminSpecialty = profile?.specialties && Array.isArray(profile.specialties) && 
                                  profile.specialties.includes('admin');
          
          if (hasAdminFlag || hasAdminSpecialty) {
            isAdmin = true;
            adminCheckDetails.method = 'profile_lookup';
            adminCheckDetails.profile = profile;
            console.log('✅ Admin verified via profile lookup');
          } else {
            console.log('❌ Profile does not indicate admin access');
            adminCheckDetails.profile = profile;
          }
        }
      } catch (error) {
        console.log('⚠️ Profile lookup error:', error);
        adminCheckDetails.profile_exception = error.message;
      }
    }

    // Final admin verification
    if (!isAdmin) {
      console.error('❌ Admin verification failed for user:', user.id);
      console.error('Admin check details:', JSON.stringify(adminCheckDetails, null, 2));
      
      return new Response(
        JSON.stringify({ 
          error: 'Admin privileges required',
          details: adminCheckDetails,
          user_id: user.id
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Admin status confirmed for user:', user.id, 'Method:', adminCheckDetails.method);

    const {
      masterPrompt = DEFAULT_MASTER_PROMPT,
      mode = 'missing-only',
      limit = 10,
      offset = 0,
      dryRun = false,
      marketIntelligence = false,
      sources = []
    }: BulkRequest = await req.json();

    console.log(`🚀 Starting bulk research generation v2 - mode: ${mode}, limit: ${limit}, offset: ${offset}, dryRun: ${dryRun}`);
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id, title, description, category, tags, retail_price, pro_price, rating,
        vendors (name, website_url)
      `)
      .order('title')
      .range(offset, offset + limit - 1);

    if (servicesError) {
      throw new Error(`Failed to fetch services: ${servicesError.message}`);
    }

    if (!services || services.length === 0) {
      return new Response(JSON.stringify({
        processed: 0,
        updated: 0,
        skipped: 0,
        nextOffset: offset,
        hasMore: false,
        errors: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const service of services) {
      try {
        processed++;

        // Check if research already exists
        if (mode === 'missing-only') {
          const { data: existing } = await supabase
            .from('service_ai_knowledge')
            .select('id')
            .eq('service_id', service.id)
            .eq('knowledge_type', 'research')
            .eq('is_active', true)
            .limit(1);

          if (existing && existing.length > 0) {
            console.log(`⏭️ Skipping ${service.title} - research already exists`);
            skipped++;
            continue;
          }
        }

        console.log(`🔍 Generating research for: ${service.title}`);

        // Gather service context
        const serviceContext = await gatherServiceContext(supabase, service);
        
        // Build research prompt
        const researchPrompt = buildResearchPrompt(masterPrompt, service, serviceContext, sources);

        if (dryRun) {
          console.log(`📋 Dry run for ${service.title} - would generate research`);
          updated++;
          continue;
        }

        // Generate research using OpenAI
        if (!openAIApiKey) {
          throw new Error('OpenAI API key not configured');
        }

        const researchContent = await generateResearchContent(researchPrompt);

        // Create research entry
        const researchTitle = `Deep Research: ${service.title}`;
        
        // Extract tags from content and service
        const extractedTags = extractTags(researchContent, service);

        const knowledgeEntry = {
          service_id: service.id,
          title: researchTitle,
          knowledge_type: 'research',
          content: researchContent,
          tags: extractedTags,
          priority: 8,
          is_active: true,
          created_by: user.id
        };

        if (mode === 'overwrite') {
          // Delete existing research entries
          await supabase
            .from('service_ai_knowledge')
            .delete()
            .eq('service_id', service.id)
            .eq('knowledge_type', 'research');
        }

        // Insert new entry
        const { error: insertError } = await supabase
          .from('service_ai_knowledge')
          .insert(knowledgeEntry);

        if (insertError) {
          throw new Error(`Failed to insert research: ${insertError.message}`);
        }

        console.log(`✅ Generated research for: ${service.title}`);
        updated++;

      } catch (error) {
        const errorMsg = `Error processing ${service.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    const nextOffset = offset + limit;
    const hasMore = services.length === limit;

    console.log(`📊 Batch complete - processed: ${processed}, updated: ${updated}, skipped: ${skipped}, errors: ${errors.length}`);

    return new Response(JSON.stringify({
      processed,
      updated,
      skipped,
      nextOffset,
      hasMore,
      errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-generate-service-research:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      processed: 0,
      updated: 0,
      skipped: 0,
      nextOffset: 0,
      hasMore: false,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gatherServiceContext(supabase: any, service: ServiceRecord) {
  try {
    // Get service performance metrics
    const { data: metrics } = await supabase
      .rpc('get_service_tracking_metrics', { 
        p_service_id: service.id,
        p_time_period: '30d'
      });

    // Check if service is in bestsellers
    const { data: bestsellers } = await supabase
      .rpc('get_bestseller_services', {
        p_period: '30d',
        p_top_pct: 0.20,
        p_min_count: 5,
        p_max_count: 50
      });

    const isBestseller = bestsellers?.some((b: any) => b.service_id === service.id);

    // Get bundles containing this service
    const { data: bundles } = await supabase
      .from('ai_service_bundles')
      .select('bundle_name, bundle_type, target_challenges')
      .contains('service_ids', [service.id])
      .eq('is_active', true);

    // Get related services by category
    const { data: relatedServices } = await supabase
      .from('services')
      .select('id, title, rating, retail_price')
      .eq('category', service.category)
      .neq('id', service.id)
      .order('rating', { ascending: false })
      .limit(5);

    return {
      metrics: metrics || {},
      isBestseller,
      bundles: bundles || [],
      relatedServices: relatedServices || [],
      vendor: service.vendors
    };
  } catch (error) {
    console.error('Error gathering service context:', error);
    return {};
  }
}

function buildResearchPrompt(masterPrompt: string, service: ServiceRecord, context: any, sources: string[]) {
  let prompt = `${masterPrompt}\n\n`;
  
  prompt += `SERVICE TO RESEARCH:\n`;
  prompt += `Title: ${service.title}\n`;
  prompt += `Category: ${service.category}\n`;
  prompt += `Description: ${service.description}\n`;
  prompt += `Pricing: Retail $${service.retail_price}, Pro $${service.pro_price}\n`;
  prompt += `Rating: ${service.rating}/5\n`;
  prompt += `Tags: ${service.tags?.join(', ') || 'None'}\n`;
  
  if (context.vendor) {
    prompt += `Vendor: ${context.vendor.name}\n`;
    if (context.vendor.website_url) {
      prompt += `Website: ${context.vendor.website_url}\n`;
    }
  }
  
  prompt += `\n`;

  if (context.metrics && Object.keys(context.metrics).length > 0) {
    prompt += `PERFORMANCE DATA:\n`;
    prompt += `- Total Views: ${context.metrics.total_views || 0}\n`;
    prompt += `- Total Clicks: ${context.metrics.total_clicks || 0}\n`;
    prompt += `- Conversion Rate: ${context.metrics.conversion_rate || 0}%\n`;
    prompt += `- Revenue Attributed: $${context.metrics.revenue_attributed || 0}\n`;
    if (context.isBestseller) {
      prompt += `- Status: BESTSELLER (Top 20% performer)\n`;
    }
    prompt += `\n`;
  }

  if (context.bundles && context.bundles.length > 0) {
    prompt += `BUNDLE INCLUSIONS:\n`;
    context.bundles.forEach((bundle: any) => {
      prompt += `- ${bundle.bundle_name} (${bundle.bundle_type})\n`;
      if (bundle.target_challenges) {
        prompt += `  Addresses: ${bundle.target_challenges.join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }

  if (context.relatedServices && context.relatedServices.length > 0) {
    prompt += `RELATED SERVICES IN ${service.category}:\n`;
    context.relatedServices.forEach((related: any) => {
      prompt += `- ${related.title} ($${related.retail_price}, ${related.rating}/5)\n`;
    });
    prompt += `\n`;
  }

  if (sources && sources.length > 0) {
    prompt += `REFERENCE SOURCES TO CONSIDER:\n`;
    sources.forEach(source => {
      prompt += `- ${source}\n`;
    });
    prompt += `\n`;
  }

  prompt += `Generate comprehensive research following the structure outlined in the master prompt. Focus on agent-tier segmentation and provide specific, actionable insights with real-world applicability.`;

  return prompt;
}

async function generateResearchContent(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a senior business research analyst specializing in real estate technology and services. Generate comprehensive, well-structured research reports in Markdown format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

function extractTags(content: string, service: ServiceRecord): string[] {
  const tags = new Set<string>();
  
  // Add service category and existing tags
  tags.add(service.category.toLowerCase());
  service.tags?.forEach(tag => tags.add(tag.toLowerCase()));
  
  // Extract keywords from content
  const contentLower = content.toLowerCase();
  const keywords = [
    'roi', 'implementation', 'conversion', 'lead generation', 'marketing',
    'automation', 'crm', 'compliance', 'respa', 'brand', 'social media',
    'photography', 'video', 'website', 'seo', 'ppc', 'direct mail',
    'print marketing', 'settlement', 'title', 'mortgage', 'insurance',
    'transaction management', 'listing', 'buyer', 'seller', 'referral'
  ];
  
  keywords.forEach(keyword => {
    if (contentLower.includes(keyword)) {
      tags.add(keyword);
    }
  });
  
  // Add tier-specific tags
  if (contentLower.includes('new agent') || contentLower.includes('beginner')) {
    tags.add('new-agents');
  }
  if (contentLower.includes('rising agent') || contentLower.includes('growing')) {
    tags.add('rising-agents');
  }
  if (contentLower.includes('established') || contentLower.includes('experienced')) {
    tags.add('established-agents');
  }
  if (contentLower.includes('top 10%') || contentLower.includes('high-volume')) {
    tags.add('top-producers');
  }
  
  return Array.from(tags).slice(0, 15); // Limit to 15 tags
}
