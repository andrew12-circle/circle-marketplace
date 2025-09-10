import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Globe, 
  Shield, 
  Users, 
  Mail, 
  Database,
  Zap,
  Save
} from 'lucide-react';
import { useAppConfig } from '@/hooks/useAppConfig';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function AdminSettings() {
  const { data: config, refetch } = useAppConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    marketplaceEnabled: config?.marketplace_enabled ?? true,
    autoHealEnabled: config?.auto_heal_enabled ?? false,
    securityMonitoringGlobal: config?.security_monitoring_global ?? true,
    topDealsEnabled: config?.top_deals_enabled ?? true,
    maxServicesPerPage: config?.max_services_per_page ?? 20,
    siteName: config?.site_name ?? 'Circle Marketplace',
    supportEmail: config?.support_email ?? 'support@circle.com',
    maintenanceMode: config?.maintenance_mode ?? false,
    debugMode: config?.debug_mode ?? false
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_config')
        .upsert([{
          id: 'main',
          marketplace_enabled: settings.marketplaceEnabled,
          auto_heal_enabled: settings.autoHealEnabled,
          security_monitoring_global: settings.securityMonitoringGlobal,
          top_deals_enabled: settings.topDealsEnabled,
          max_services_per_page: settings.maxServicesPerPage,
          site_name: settings.siteName,
          support_email: settings.supportEmail,
          maintenance_mode: settings.maintenanceMode,
          debug_mode: settings.debugMode
        }]);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "All configuration changes have been applied successfully."
      });
      
      refetch();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-muted-foreground">
            Configure global application settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting('siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => updateSetting('supportEmail', e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="maxServices">Max Services Per Page</Label>
                <Input
                  id="maxServices"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxServicesPerPage}
                  onChange={(e) => updateSetting('maxServicesPerPage', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Feature Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Marketplace</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable the main marketplace functionality
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.marketplaceEnabled}
                    onCheckedChange={(checked) => updateSetting('marketplaceEnabled', checked)}
                  />
                  <Badge variant={settings.marketplaceEnabled ? "default" : "secondary"}>
                    {settings.marketplaceEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Top Deals Feature</Label>
                  <p className="text-sm text-muted-foreground">
                    Show the Top Deals carousel on the marketplace
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.topDealsEnabled}
                    onCheckedChange={(checked) => updateSetting('topDealsEnabled', checked)}
                  />
                  <Badge variant={settings.topDealsEnabled ? "default" : "secondary"}>
                    {settings.topDealsEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-Heal System</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically fix common database issues
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.autoHealEnabled}
                    onCheckedChange={(checked) => updateSetting('autoHealEnabled', checked)}
                  />
                  <Badge variant={settings.autoHealEnabled ? "default" : "secondary"}>
                    {settings.autoHealEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Global Security Monitoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time security monitoring across the platform
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.securityMonitoringGlobal}
                    onCheckedChange={(checked) => updateSetting('securityMonitoringGlobal', checked)}
                  />
                  <Badge variant={settings.securityMonitoringGlobal ? "default" : "secondary"}>
                    {settings.securityMonitoringGlobal ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Put the site in maintenance mode for updates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                  <Badge variant={settings.maintenanceMode ? "destructive" : "secondary"}>
                    {settings.maintenanceMode ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed logging and debug information
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => updateSetting('debugMode', checked)}
                  />
                  <Badge variant={settings.debugMode ? "default" : "secondary"}>
                    {settings.debugMode ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">System Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Environment:</span>
                    <Badge variant="outline" className="ml-2">Production</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Database:</span>
                    <Badge variant="outline" className="ml-2">Supabase</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}