import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackupResponse {
  success: boolean
  backup_id?: string
  error?: string
  data_size?: number
  verification_result?: boolean
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting daily financial data backup...')

    // Create backup using database function
    const { data: backupResult, error: backupError } = await supabase
      .rpc('backup_financial_data', { backup_type_param: 'daily' })

    if (backupError) {
      console.error('Backup creation failed:', backupError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Backup failed: ${backupError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const backupId = backupResult as string
    console.log(`Backup created with ID: ${backupId}`)

    // Verify backup integrity
    const { data: verificationResult, error: verificationError } = await supabase
      .rpc('verify_backup_integrity', { backup_id_param: backupId })

    if (verificationError) {
      console.error('Backup verification failed:', verificationError)
      // Still return success since backup was created, but note verification issue
    }

    // Get backup details for response
    const { data: backupDetails, error: detailsError } = await supabase
      .from('financial_data_backups')
      .select('backup_size, status, created_at')
      .eq('id', backupId)
      .single()

    const response: BackupResponse = {
      success: true,
      backup_id: backupId,
      data_size: backupDetails?.backup_size || 0,
      verification_result: verificationResult as boolean
    }

    console.log('Daily backup completed successfully:', response)

    // Log security event for backup
    await supabase
      .from('security_events')
      .insert({
        event_type: 'daily_backup_completed',
        event_data: {
          backup_id: backupId,
          backup_size: backupDetails?.backup_size,
          verification_passed: verificationResult,
          timestamp: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Daily backup function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Backup system error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})