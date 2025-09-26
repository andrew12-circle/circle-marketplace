import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
// import { Resend } from "npm:resend@2.0.0"; // Temporarily disabled to fix build

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// const resend = new Resend(Deno.env.get('RESEND_API_KEY')); // Temporarily disabled

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthMetrics {
  errorCount: number;
  criticalSecurityEvents: number;
  edgeFunctionFailures: number;
  dbResponseTime: number;
  activeIncidents: number;
}

interface Alert {
  type: 'error_spike' | 'security_threat' | 'system_failure' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  details: string;
  metrics: HealthMetrics;
}

const THRESHOLDS = {
  error_spike: { count: 10, window: '5 minutes' },
  security_events: { count: 5, window: '10 minutes' },
  edge_failures: { count: 3, window: '5 minutes' },
  db_slow: { ms: 5000 },
  performance_degradation: { error_rate: 0.1 }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting health monitoring check...');
    
    const metrics = await gatherHealthMetrics();
    const alerts = analyzeMetrics(metrics);
    
    console.log('📊 Health metrics:', metrics);
    console.log('🚨 Generated alerts:', alerts);

    // Process alerts
    for (const alert of alerts) {
      await processAlert(alert, metrics);
    }

    // Update system health status
    await updateSystemHealth(metrics, alerts);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        metrics,
        alerts: alerts.length,
        status: alerts.some(a => a.severity === 'critical') ? 'critical' : 
                alerts.some(a => a.severity === 'high') ? 'degraded' : 'healthy'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('❌ Health monitoring error:', error);
    
    // Create critical alert for monitoring system failure
    await createIncident({
      title: 'Health Monitoring System Failure',
      severity: 'critical',
      details: `Monitoring system encountered error: ${error.message}`,
      status: 'open'
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function gatherHealthMetrics(): Promise<HealthMetrics> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // Gather error metrics
  const { count: errorCount } = await supabase
    .from('client_errors')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', fiveMinutesAgo.toISOString());

  // Gather security events
  const { count: securityCount } = await supabase
    .from('security_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', tenMinutesAgo.toISOString())
    .in('event_type', ['unauthorized_access', 'suspicious_activity', 'security_violation']);

  // Check active incidents
  const { count: activeIncidents } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  // Measure DB response time
  const dbStart = Date.now();
  await supabase.from('app_config').select('id').limit(1);
  const dbResponseTime = Date.now() - dbStart;

  return {
    errorCount: errorCount || 0,
    criticalSecurityEvents: securityCount || 0,
    edgeFunctionFailures: 0, // Will be enhanced with actual edge function metrics
    dbResponseTime,
    activeIncidents: activeIncidents || 0
  };
}

function analyzeMetrics(metrics: HealthMetrics): Alert[] {
  const alerts: Alert[] = [];

  // Error spike detection
  if (metrics.errorCount >= THRESHOLDS.error_spike.count) {
    alerts.push({
      type: 'error_spike',
      severity: metrics.errorCount > 50 ? 'critical' : metrics.errorCount > 25 ? 'high' : 'medium',
      title: `Error Spike Detected: ${metrics.errorCount} errors in 5 minutes`,
      details: `Unusual error activity detected. Error count: ${metrics.errorCount}`,
      metrics
    });
  }

  // Security threat detection
  if (metrics.criticalSecurityEvents >= THRESHOLDS.security_events.count) {
    alerts.push({
      type: 'security_threat',
      severity: 'high',
      title: `Security Events Detected: ${metrics.criticalSecurityEvents} events`,
      details: `Multiple security events detected in the last 10 minutes`,
      metrics
    });
  }

  // Performance degradation
  if (metrics.dbResponseTime >= THRESHOLDS.db_slow.ms) {
    alerts.push({
      type: 'performance_degradation',
      severity: 'medium',
      title: `Database Performance Degraded: ${metrics.dbResponseTime}ms response time`,
      details: `Database response time is above threshold`,
      metrics
    });
  }

  return alerts;
}

async function processAlert(alert: Alert, metrics: HealthMetrics) {
  console.log(`🚨 Processing ${alert.severity} alert: ${alert.title}`);

  // Check if similar incident already exists
  const { data: existingIncident } = await supabase
    .from('incidents')
    .select('id')
    .eq('status', 'open')
    .eq('title', alert.title)
    .maybeSingle();

  if (existingIncident) {
    console.log('⏭️ Similar incident already exists, skipping...');
    return;
  }

  // Create incident
  const incident = await createIncident({
    title: alert.title,
    severity: alert.severity,
    details: JSON.stringify({
      alert_type: alert.type,
      details: alert.details,
      metrics,
      timestamp: new Date().toISOString()
    }),
    status: 'open'
  });

  // Send email alert for high/critical severity
  if (alert.severity === 'high' || alert.severity === 'critical') {
    await sendEmailAlert(alert, incident.id);
  }

  // Auto-trigger system actions for critical alerts
  if (alert.severity === 'critical') {
    await triggerEmergencyActions(alert);
  }
}

async function createIncident(incident: any) {
  const { data, error } = await supabase
    .from('incidents')
    .insert(incident)
    .select()
    .single();

  if (error) {
    console.error('Failed to create incident:', error);
    throw error;
  }

  console.log('📝 Created incident:', data.id);
  return data;
}

async function sendEmailAlert(alert: Alert, incidentId: string) {
  const alertEmails = Deno.env.get('ALERT_EMAILS');
  if (!alertEmails) {
    console.warn('⚠️ ALERT_EMAILS not configured, skipping email alert');
    return;
  }

  const emails = alertEmails.split(',').map(email => email.trim());
  
  const severityEmoji = {
    low: '🟡',
    medium: '🟠', 
    high: '🔴',
    critical: '🚨'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
        ${severityEmoji[alert.severity]} System Alert - ${alert.severity.toUpperCase()}
      </h1>
      
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #dc2626;">${alert.title}</h2>
        <p style="color: #374151; line-height: 1.6;">${alert.details}</p>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">System Metrics</h3>
        <ul style="color: #6b7280; line-height: 1.8;">
          <li>Client Errors (5min): ${alert.metrics.errorCount}</li>
          <li>Security Events (10min): ${alert.metrics.criticalSecurityEvents}</li>
          <li>DB Response Time: ${alert.metrics.dbResponseTime}ms</li>
          <li>Active Incidents: ${alert.metrics.activeIncidents}</li>
        </ul>
      </div>

      <div style="background: #eff6ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #1e40af;">
          <strong>Incident ID:</strong> ${incidentId}<br>
          <strong>Time:</strong> ${new Date().toLocaleString()}<br>
          <strong>Type:</strong> ${alert.type}
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; margin: 0;">
          This is an automated alert from your application monitoring system.
        </p>
      </div>
    </div>
  `;

  try {
    // await resend.emails.send({
    //   from: Deno.env.get('RESEND_FROM_EMAIL') || 'alerts@yourdomain.com',
    //   to: emails,
    //   subject: `🚨 ${alert.severity.toUpperCase()} Alert: ${alert.title}`,
    //   html
    // });

    console.log(`📧 Alert email would be sent to ${emails.length} recipients (disabled)`);
  } catch (error) {
    console.error('Failed to send alert email:', error);
  }
}

async function triggerEmergencyActions(alert: Alert) {
  console.log('🆘 Triggering emergency actions for critical alert');

  // Force cache bust for critical errors
  if (alert.type === 'error_spike' || alert.type === 'system_failure') {
    await supabase
      .from('app_config')
      .update({ 
        force_cache_bust_after: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001');
    
    console.log('💥 Cache bust triggered');
  }
}

async function updateSystemHealth(metrics: HealthMetrics, alerts: Alert[]) {
  const healthStatus = alerts.some(a => a.severity === 'critical') ? 'critical' : 
                      alerts.some(a => a.severity === 'high') ? 'degraded' : 'healthy';

  // Update app config with current health status
  await supabase
    .from('app_config')
    .update({ 
      updated_at: new Date().toISOString()
      // Could add health_status field to app_config if needed
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  console.log(`💚 System health status: ${healthStatus}`);
}

serve(handler);