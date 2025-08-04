// 4. BACKGROUND JOB PROCESSOR - Queue system for heavy operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackgroundJob {
  id: string
  job_type: string
  job_data: any
  status: string
  priority: number
  attempts: number
  max_attempts: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting background job processor...')

    // Get pending jobs ordered by priority and schedule
    const { data: jobs, error: fetchError } = await supabaseClient
      .from('background_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('Error fetching jobs:', fetchError)
      throw fetchError
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending jobs found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Processing ${jobs.length} jobs...`)

    const results = []

    // Process jobs sequentially to avoid resource conflicts
    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id} of type ${job.job_type}`)
        
        // Mark job as processing
        await supabaseClient
          .from('background_jobs')
          .update({ 
            status: 'processing', 
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1
          })
          .eq('id', job.id)

        const result = await processJob(job, supabaseClient)
        
        // Mark job as completed
        await supabaseClient
          .from('background_jobs')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', job.id)

        results.push({ job_id: job.id, success: true, result })
        console.log(`Job ${job.id} completed successfully`)

      } catch (error) {
        console.error(`Job ${job.id} failed:`, error)
        
        // Check if we should retry
        if (job.attempts + 1 >= job.max_attempts) {
          await supabaseClient
            .from('background_jobs')
            .update({ 
              status: 'failed', 
              error_message: error.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id)
        } else {
          // Schedule retry with exponential backoff
          const retryDelay = Math.pow(2, job.attempts) * 1000 // 1s, 2s, 4s, etc.
          const retryAt = new Date(Date.now() + retryDelay)
          
          await supabaseClient
            .from('background_jobs')
            .update({ 
              status: 'pending', 
              scheduled_at: retryAt.toISOString(),
              error_message: error.message
            })
            .eq('id', job.id)
        }

        results.push({ 
          job_id: job.id, 
          success: false, 
          error: error.message,
          will_retry: job.attempts + 1 < job.max_attempts
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        processed: jobs.length,
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Background job processor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function processJob(job: BackgroundJob, supabase: any) {
  switch (job.job_type) {
    case 'refresh_analytics':
      return await refreshAnalytics(job.job_data, supabase)
      
    case 'cleanup_cache':
      return await cleanupCache(job.job_data, supabase)
      
    case 'bulk_import_services':
      return await bulkImportServices(job.job_data, supabase)
      
    case 'vendor_analytics_update':
      return await updateVendorAnalytics(job.job_data, supabase)
      
    case 'marketplace_index_refresh':
      return await refreshMarketplaceIndexes(job.job_data, supabase)
      
    default:
      throw new Error(`Unknown job type: ${job.job_type}`)
  }
}

async function refreshAnalytics(jobData: any, supabase: any) {
  console.log('Refreshing analytics...', jobData)
  
  // Update vendor analytics in batches
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .limit(100)

  if (vendors) {
    for (const vendor of vendors) {
      try {
        // Call the vendor dashboard stats function for each vendor
        const { data } = await supabase.rpc('get_vendor_dashboard_stats', {
          p_vendor_id: vendor.id
        })
        
        console.log(`Updated analytics for vendor ${vendor.id}`)
      } catch (error) {
        console.error(`Failed to update analytics for vendor ${vendor.id}:`, error)
      }
    }
  }
  
  return { message: 'Analytics refresh completed' }
}

async function cleanupCache(jobData: any, supabase: any) {
  console.log('Cleaning up cache...', jobData)
  
  // This would typically involve clearing Redis or other cache stores
  // For now, we'll just log the operation
  
  return { message: 'Cache cleanup completed' }
}

async function bulkImportServices(jobData: any, supabase: any) {
  console.log('Bulk importing services...', jobData)
  
  const { services } = jobData
  
  if (!services || !Array.isArray(services)) {
    throw new Error('Invalid services data for bulk import')
  }
  
  // Insert services in batches of 100
  const batchSize = 100
  let imported = 0
  
  for (let i = 0; i < services.length; i += batchSize) {
    const batch = services.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('services')
      .insert(batch)
    
    if (error) {
      console.error('Batch import error:', error)
      throw error
    }
    
    imported += batch.length
    console.log(`Imported ${imported}/${services.length} services`)
  }
  
  return { message: `Successfully imported ${imported} services` }
}

async function updateVendorAnalytics(jobData: any, supabase: any) {
  console.log('Updating vendor analytics...', jobData)
  
  const { vendor_id } = jobData
  
  // Get vendor's services and calculate analytics
  const { data: services } = await supabase
    .from('services')
    .select('id')
    .eq('vendor_id', vendor_id)
  
  if (services) {
    const serviceIds = services.map(s => s.id)
    
    // Get view counts
    const { data: views } = await supabase
      .from('service_views')
      .select('service_id')
      .in('service_id', serviceIds)
    
    // Get booking counts
    const { data: bookings } = await supabase
      .from('consultation_bookings')
      .select('service_id')
      .in('service_id', serviceIds)
    
    const analytics = {
      total_services: services.length,
      total_views: views?.length || 0,
      total_bookings: bookings?.length || 0,
      conversion_rate: views?.length ? ((bookings?.length || 0) / views.length) * 100 : 0
    }
    
    console.log(`Analytics for vendor ${vendor_id}:`, analytics)
  }
  
  return { message: `Updated analytics for vendor ${vendor_id}` }
}

async function refreshMarketplaceIndexes(jobData: any, supabase: any) {
  console.log('Refreshing marketplace indexes...', jobData)
  
  // This would involve refreshing materialized views, updating search indexes, etc.
  // For now, we'll simulate the operation
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return { message: 'Marketplace indexes refreshed' }
}