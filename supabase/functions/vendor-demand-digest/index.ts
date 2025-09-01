import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting vendor demand digest job...')

    // Get new interest requests from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: newInterests, error: interestError } = await supabaseClient
      .from('service_discount_interest')
      .select(`
        service_id,
        vendor_id,
        agent_id,
        created_at,
        services (
          title,
          vendor_id,
          vendors (
            id,
            name,
            contact_email
          )
        )
      `)
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false })

    if (interestError) {
      console.error('Error fetching interest data:', interestError)
      throw interestError
    }

    console.log(`Found ${newInterests?.length || 0} new interest requests`)

    if (!newInterests || newInterests.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new interest requests to process',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group interests by vendor and service
    const vendorDigests = new Map()
    
    for (const interest of newInterests) {
      const vendorId = interest.services?.vendors?.id
      const vendorEmail = interest.services?.vendors?.contact_email
      const vendorName = interest.services?.vendors?.name
      const serviceTitle = interest.services?.title
      
      if (!vendorId || !vendorEmail) continue
      
      if (!vendorDigests.has(vendorId)) {
        vendorDigests.set(vendorId, {
          vendorName,
          vendorEmail,
          services: new Map(),
          totalInterests: 0
        })
      }
      
      const vendorData = vendorDigests.get(vendorId)
      
      if (!vendorData.services.has(interest.service_id)) {
        vendorData.services.set(interest.service_id, {
          title: serviceTitle,
          interests: []
        })
      }
      
      vendorData.services.get(interest.service_id).interests.push({
        agentId: interest.agent_id,
        createdAt: interest.created_at
      })
      
      vendorData.totalInterests++
    }

    console.log(`Processing digests for ${vendorDigests.size} vendors`)

    // For now, just log the digest data (email functionality can be added later)
    let processedCount = 0
    
    for (const [vendorId, digest] of vendorDigests) {
      console.log(`Vendor ${digest.vendorName} (${digest.vendorEmail}):`)
      console.log(`  Total new interests: ${digest.totalInterests}`)
      
      for (const [serviceId, serviceData] of digest.services) {
        console.log(`  Service "${serviceData.title}": ${serviceData.interests.length} new interests`)
      }
      
      // Create a background job record for future email processing
      await supabaseClient
        .from('background_jobs')
        .insert({
          job_type: 'vendor_demand_notification',
          job_data: {
            vendor_id: vendorId,
            vendor_email: digest.vendorEmail,
            vendor_name: digest.vendorName,
            digest_summary: {
              total_interests: digest.totalInterests,
              services_count: digest.services.size,
              period: '24h'
            },
            services: Array.from(digest.services.entries()).map(([id, data]) => ({
              service_id: id,
              title: data.title,
              interests_count: data.interests.length
            }))
          },
          status: 'pending',
          priority: 5
        })
      
      processedCount++
    }

    console.log(`Successfully processed ${processedCount} vendor digests`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedCount} vendor demand digests`,
        processed: processedCount,
        totalInterests: newInterests.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in vendor demand digest:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})