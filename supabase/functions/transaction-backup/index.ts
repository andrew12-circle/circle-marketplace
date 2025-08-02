import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionBackupRequest {
  transaction_id: string
  transaction_type: 'point_allocation' | 'point_transaction' | 'point_charge'
  transaction_data: any
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

    const requestBody: TransactionBackupRequest = await req.json()
    console.log('Backing up transaction:', requestBody.transaction_id)

    // Create real-time transaction backup
    const backupData = {
      transaction_id: requestBody.transaction_id,
      transaction_type: requestBody.transaction_type,
      transaction_data: requestBody.transaction_data,
      backup_timestamp: new Date().toISOString()
    }

    // Calculate checksum for the transaction
    const dataString = JSON.stringify(backupData)
    const encoder = new TextEncoder()
    const data = encoder.encode(dataString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Store transaction backup
    const { data: backup, error: backupError } = await supabase
      .from('financial_data_backups')
      .insert({
        backup_type: 'transaction',
        data_hash: hashHex,
        backup_data: backupData,
        backup_size: dataString.length
      })
      .select()
      .single()

    if (backupError) {
      console.error('Transaction backup failed:', backupError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Transaction backup failed: ${backupError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create audit log checksum for immutability
    if (requestBody.transaction_type === 'point_transaction') {
      // Get related audit log entries
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_log')
        .select('*')
        .or(`new_data->>id.eq.${requestBody.transaction_id},old_data->>id.eq.${requestBody.transaction_id}`)

      if (!auditError && auditLogs) {
        for (const auditLog of auditLogs) {
          const auditDataString = JSON.stringify(auditLog)
          const auditData = encoder.encode(auditDataString)
          const auditHashBuffer = await crypto.subtle.digest('SHA-256', auditData)
          const auditHashArray = Array.from(new Uint8Array(auditHashBuffer))
          const auditHashHex = auditHashArray.map(b => b.toString(16).padStart(2, '0')).join('')

          await supabase
            .from('audit_log_checksums')
            .insert({
              audit_log_id: auditLog.id,
              checksum: auditHashHex
            })
        }
      }
    }

    // Log security event
    await supabase
      .from('security_events')
      .insert({
        event_type: 'transaction_backup_created',
        event_data: {
          transaction_id: requestBody.transaction_id,
          transaction_type: requestBody.transaction_type,
          backup_id: backup.id,
          timestamp: new Date().toISOString()
        }
      })

    console.log('Transaction backup completed:', backup.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        backup_id: backup.id,
        checksum: hashHex
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transaction backup error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Transaction backup error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})