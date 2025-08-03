import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Percent, DollarSign, Clock, AlertTriangle, Check } from 'lucide-react';

export const VendorCoPaySettings = ({ vendorId }: { vendorId: string }) => {
  const [settings, setSettings] = useState({
    auto_approve_threshold: 20,
    max_split_percentage: 50,
    monthly_limit_per_agent: 1000,
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [vendorId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_copay_rules')
        .select('*')
        .eq('vendor_id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          auto_approve_threshold: data.auto_approve_threshold,
          max_split_percentage: data.max_split_percentage,
          monthly_limit_per_agent: data.monthly_limit_per_agent,
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load co-pay settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_copay_rules')
        .upsert({
          vendor_id: vendorId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved! ✅",
        description: "Your co-pay rules have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save co-pay settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Co-Pay Rules & Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Accept Co-Pay Requests</Label>
            <p className="text-sm text-gray-600">Allow agents to request co-payment assistance for your services</p>
          </div>
          <Switch
            checked={settings.is_active}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
          />
        </div>

        <Separator />

        {/* Auto-Approval Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-green-600" />
            <h3 className="font-medium">Auto-Approval Rules</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auto-approve">Auto-Approve Under (%)</Label>
              <div className="relative">
                <Input
                  id="auto-approve"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.auto_approve_threshold}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    auto_approve_threshold: parseInt(e.target.value) || 0 
                  }))}
                  className="pr-8"
                />
                <Percent className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">
                Automatically approve requests below this percentage
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-split">Maximum Split (%)</Label>
              <div className="relative">
                <Input
                  id="max-split"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.max_split_percentage}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    max_split_percentage: parseInt(e.target.value) || 0 
                  }))}
                  className="pr-8"
                />
                <Percent className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">
                Maximum co-pay percentage you'll accept
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Spending Limits */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-green-600" />
            <h3 className="font-medium">Spending Limits</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="monthly-limit">Monthly Limit Per Agent ($)</Label>
            <div className="relative">
              <Input
                id="monthly-limit"
                type="number"
                min="0"
                step="100"
                value={settings.monthly_limit_per_agent}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  monthly_limit_per_agent: parseFloat(e.target.value) || 0 
                }))}
                className="pl-8"
              />
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">
              Maximum amount each agent can request per month
            </p>
          </div>
        </div>

        {/* Rule Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Current Rules Summary</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <Badge variant={settings.is_active ? "default" : "secondary"}>
                {settings.is_active ? "Active" : "Inactive"}
              </Badge>
              <span>Co-pay requests are {settings.is_active ? "enabled" : "disabled"}</span>
            </div>
            {settings.is_active && (
              <>
                <p>• Requests under {settings.auto_approve_threshold}% will be auto-approved</p>
                <p>• Maximum split percentage: {settings.max_split_percentage}%</p>
                <p>• Monthly limit per agent: ${settings.monthly_limit_per_agent.toFixed(2)}</p>
              </>
            )}
          </div>
        </div>

        {/* Warning */}
        {settings.auto_approve_threshold > settings.max_split_percentage && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Configuration Warning</h4>
              <p className="text-sm text-red-800">
                Your auto-approval threshold ({settings.auto_approve_threshold}%) is higher than your maximum split percentage ({settings.max_split_percentage}%). 
                This means no requests will be auto-approved.
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <Clock className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};