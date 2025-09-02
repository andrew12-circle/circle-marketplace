// FILE: src/components/security/AdminSecurityPanel.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { featureFlagsManager } from '@/lib/security/feature-flags-db';
import { auditLogger } from '@/lib/security/audit-log';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlags {
  UNDER_ATTACK: boolean;
  CAPTCHA_ALWAYS_ON: boolean;
  POW_ENFORCE_HIGH_RISK: boolean;
  CLOSE_SIGNUPS: boolean;
  READ_ONLY_MODE: boolean;
  MAINTENANCE_MODE: boolean;
}

export function AdminSecurityPanel() {
  const [flags, setFlags] = useState<FeatureFlags>({
    UNDER_ATTACK: false,
    CAPTCHA_ALWAYS_ON: false,
    POW_ENFORCE_HIGH_RISK: true,
    CLOSE_SIGNUPS: false,
    READ_ONLY_MODE: false,
    MAINTENANCE_MODE: false
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const currentFlags = await featureFlagsManager.getFlags();
      setFlags(currentFlags);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagName: keyof FeatureFlags, enabled: boolean) => {
    setUpdating(flagName);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const success = await featureFlagsManager.setFlag(flagName, enabled, user?.id);
      
      if (success) {
        setFlags(prev => ({ ...prev, [flagName]: enabled }));
        
        // Log the action
        await auditLogger.logAdmin(
          'security_flag_toggle',
          user?.id || 'unknown',
          flagName,
          { flag_name: flagName, enabled, timestamp: new Date().toISOString() }
        );
        
        toast({
          title: 'Success',
          description: `${flagName} has been ${enabled ? 'enabled' : 'disabled'}`,
        });
      } else {
        throw new Error('Failed to update flag');
      }
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      toast({
        title: 'Error',
        description: `Failed to update ${flagName}`,
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleEmergencyShutdown = async () => {
    if (!confirm('This will enable maintenance mode and block all non-admin access. Continue?')) {
      return;
    }
    
    await toggleFlag('MAINTENANCE_MODE', true);
    await toggleFlag('READ_ONLY_MODE', true);
    
    toast({
      title: 'Emergency Shutdown Activated',
      description: 'System is now in maintenance mode',
      variant: 'destructive'
    });
  };

  const handlePanicMode = async () => {
    if (!confirm('This will activate maximum security across all systems. Continue?')) {
      return;
    }
    
    await toggleFlag('UNDER_ATTACK', true);
    await toggleFlag('CAPTCHA_ALWAYS_ON', true);
    await toggleFlag('POW_ENFORCE_HIGH_RISK', true);
    
    toast({
      title: 'Panic Mode Activated',
      description: 'Maximum security measures are now active',
      variant: 'destructive'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Activity className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading security settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Current security posture and active protections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={flags.UNDER_ATTACK ? 'destructive' : 'secondary'}>
                {flags.UNDER_ATTACK ? 'Under Attack' : 'Normal'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={flags.MAINTENANCE_MODE ? 'destructive' : 'secondary'}>
                {flags.MAINTENANCE_MODE ? 'Maintenance' : 'Operational'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={flags.READ_ONLY_MODE ? 'secondary' : 'default'}>
                {flags.READ_ONLY_MODE ? 'Read Only' : 'Read/Write'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Security Controls</CardTitle>
          <CardDescription>
            Configure security measures and protection levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="under-attack">Under Attack Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enhanced protection with stricter rate limits and verification
              </p>
            </div>
            <Switch
              id="under-attack"
              checked={flags.UNDER_ATTACK}
              onCheckedChange={(checked) => toggleFlag('UNDER_ATTACK', checked)}
              disabled={updating === 'UNDER_ATTACK'}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="captcha-always">Always Require CAPTCHA</Label>
              <p className="text-sm text-muted-foreground">
                Force CAPTCHA verification for all sensitive operations
              </p>
            </div>
            <Switch
              id="captcha-always"
              checked={flags.CAPTCHA_ALWAYS_ON}
              onCheckedChange={(checked) => toggleFlag('CAPTCHA_ALWAYS_ON', checked)}
              disabled={updating === 'CAPTCHA_ALWAYS_ON'}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pow-enforce">Enforce Proof of Work</Label>
              <p className="text-sm text-muted-foreground">
                Require computational proof for high-risk requests
              </p>
            </div>
            <Switch
              id="pow-enforce"
              checked={flags.POW_ENFORCE_HIGH_RISK}
              onCheckedChange={(checked) => toggleFlag('POW_ENFORCE_HIGH_RISK', checked)}
              disabled={updating === 'POW_ENFORCE_HIGH_RISK'}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="close-signups">Close Signups</Label>
              <p className="text-sm text-muted-foreground">
                Prevent new user registrations
              </p>
            </div>
            <Switch
              id="close-signups"
              checked={flags.CLOSE_SIGNUPS}
              onCheckedChange={(checked) => toggleFlag('CLOSE_SIGNUPS', checked)}
              disabled={updating === 'CLOSE_SIGNUPS'}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="read-only">Read Only Mode</Label>
              <p className="text-sm text-muted-foreground">
                Disable all write operations
              </p>
            </div>
            <Switch
              id="read-only"
              checked={flags.READ_ONLY_MODE}
              onCheckedChange={(checked) => toggleFlag('READ_ONLY_MODE', checked)}
              disabled={updating === 'READ_ONLY_MODE'}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Show maintenance page to all non-admin users
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={flags.MAINTENANCE_MODE}
              onCheckedChange={(checked) => toggleFlag('MAINTENANCE_MODE', checked)}
              disabled={updating === 'MAINTENANCE_MODE'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Actions
          </CardTitle>
          <CardDescription>
            Immediate response actions for security incidents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These actions will immediately affect all users. Use only during actual security incidents.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="destructive"
              onClick={handlePanicMode}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Activate Panic Mode
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleEmergencyShutdown}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Emergency Shutdown
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}