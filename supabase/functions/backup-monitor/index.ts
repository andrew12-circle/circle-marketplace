import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackupStatus {
  total_backups: number
  successful_backups: number
  failed_backups: number
  last_backup_date: string | null
  integrity_checks_passed: number
  integrity_checks_failed: number
  total_backup_size: number
  oldest_backup_date: string | null
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

    console.log('Running backup monitoring checks...')

    // Get backup statistics
    const { data: backups, error: backupsError } = await supabase
      .from('financial_data_backups')
      .select('*')
      .order('created_at', { ascending: false })

    if (backupsError) {
      throw new Error(`Failed to fetch backups: ${backupsError.message}`)
    }

    // Get monitoring results
    const { data: monitoring, error: monitoringError } = await supabase
      .from('backup_monitoring')
      .select('*')
      .order('checked_at', { ascending: false })

    if (monitoringError) {
      throw new Error(`Failed to fetch monitoring data: ${monitoringError.message}`)
    }

    // Calculate statistics
    const totalBackups = backups?.length || 0
    const successfulBackups = backups?.filter(b => b.status === 'completed').length || 0
    const failedBackups = backups?.filter(b => b.status === 'failed').length || 0
    const totalBackupSize = backups?.reduce((sum, b) => sum + (b.backup_size || 0), 0) || 0
    
    const integrityChecksPassed = monitoring?.filter(m => 
      m.check_type === 'integrity' && m.check_result === true
    ).length || 0
    
    const integrityChecksFailed = monitoring?.filter(m => 
      m.check_type === 'integrity' && m.check_result === false
    ).length || 0

    const lastBackupDate = backups?.[0]?.created_at || null
    const oldestBackupDate = backups?.[backups.length - 1]?.created_at || null

    const status: BackupStatus = {
      total_backups: totalBackups,
      successful_backups: successfulBackups,
      failed_backups: failedBackups,
      last_backup_date: lastBackupDate,
      integrity_checks_passed: integrityChecksPassed,
      integrity_checks_failed: integrityChecksFailed,
      total_backup_size: totalBackupSize,
      oldest_backup_date: oldestBackupDate
    }

    // Check for issues and create alerts
    const alerts = []
    
    // Check if last backup is too old (more than 25 hours ago)
    if (lastBackupDate) {
      const lastBackup = new Date(lastBackupDate)
      const hoursAgo = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60)
      if (hoursAgo > 25) {
        alerts.push({
          type: 'warning',
          message: `Last backup was ${Math.round(hoursAgo)} hours ago`,
          severity: 'high'
        })
      }
    } else {
      alerts.push({
        type: 'error',
        message: 'No backups found',
        severity: 'critical'
      })
    }

    // Check for failed integrity checks
    if (integrityChecksFailed > 0) {
      alerts.push({
        type: 'error',
        message: `${integrityChecksFailed} backup integrity checks failed`,
        severity: 'high'
      })
    }

    // Check for failed backups
    if (failedBackups > 0) {
      alerts.push({
        type: 'error',
        message: `${failedBackups} backups have failed`,
        severity: 'high'
      })
    }

    // Run integrity check on latest backup if it exists
    if (backups && backups.length > 0) {
      const latestBackup = backups[0]
      console.log('Running integrity check on latest backup:', latestBackup.id)
      
      const { data: verificationResult, error: verificationError } = await supabase
        .rpc('verify_backup_integrity', { backup_id_param: latestBackup.id })

      if (verificationError) {
        console.error('Verification failed:', verificationError)
        alerts.push({
          type: 'error',
          message: 'Latest backup integrity verification failed',
          severity: 'high'
        })
      } else if (!verificationResult) {
        alerts.push({
          type: 'error',
          message: 'Latest backup failed integrity check',
          severity: 'critical'
        })
      }
    }

    // Log monitoring event
    await supabase
      .from('security_events')
      .insert({
        event_type: 'backup_monitoring_completed',
        event_data: {
          status,
          alerts,
          timestamp: new Date().toISOString()
        }
      })

    console.log('Backup monitoring completed:', status)

    return new Response(
      JSON.stringify({ 
        success: true, 
        status,
        alerts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Backup monitoring error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Backup monitoring error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})