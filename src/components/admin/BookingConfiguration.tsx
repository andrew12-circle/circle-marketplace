import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BookingConfig {
  booking_type: 'internal' | 'external';
  external_booking_provider?: string;
  external_booking_url?: string;
  booking_time_rules: {
    days: string[];
    start_time: string;
    end_time: string;
    timezone: string;
    advance_hours: number;
  };
  sync_to_ghl: boolean;
}

interface BookingConfigurationProps {
  serviceId: string;
  currentConfig?: BookingConfig;
  onConfigUpdate: (config: BookingConfig) => void;
}

export const BookingConfiguration = ({ serviceId, currentConfig, onConfigUpdate }: BookingConfigurationProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<BookingConfig>(currentConfig || {
    booking_type: 'internal',
    booking_time_rules: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      start_time: '10:00',
      end_time: '16:00',
      timezone: 'America/Chicago',
      advance_hours: 24
    },
    sync_to_ghl: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({
          booking_type: config.booking_type,
          external_booking_provider: config.external_booking_provider,
          external_booking_url: config.external_booking_url,
          booking_time_rules: config.booking_time_rules,
          sync_to_ghl: config.sync_to_ghl
        } as any)
        .eq('id' as any, serviceId as any);

      if (error) throw error;

      toast({
        title: "Configuration saved",
        description: "Booking configuration has been updated successfully."
      });
      
      onConfigUpdate(config);
    } catch (error) {
      console.error('Error saving booking configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save booking configuration.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Configuration</CardTitle>
        <CardDescription>
          Configure how customers can book consultations for this service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Booking Type</Label>
          <Select
            value={config.booking_type}
            onValueChange={(value: 'internal' | 'external') => 
              setConfig({ ...config, booking_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Internal Calendar</SelectItem>
              <SelectItem value="external">External Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.booking_type === 'external' && (
          <>
            <div className="space-y-2">
              <Label>External Provider</Label>
              <Select
                value={config.external_booking_provider || ''}
                onValueChange={(value) => 
                  setConfig({ ...config, external_booking_provider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendly">Calendly</SelectItem>
                  <SelectItem value="gohighlevel">GoHighLevel</SelectItem>
                  <SelectItem value="custom">Custom/Proprietary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>External Booking URL</Label>
              <Input
                type="url"
                placeholder="https://calendly.com/your-link"
                value={config.external_booking_url || ''}
                onChange={(e) => 
                  setConfig({ ...config, external_booking_url: e.target.value })
                }
              />
            </div>
          </>
        )}

        <div className="space-y-4">
          <Label>Time Availability Rules</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={config.booking_time_rules.start_time}
                onChange={(e) => 
                  setConfig({
                    ...config,
                    booking_time_rules: {
                      ...config.booking_time_rules,
                      start_time: e.target.value
                    }
                  })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={config.booking_time_rules.end_time}
                onChange={(e) => 
                  setConfig({
                    ...config,
                    booking_time_rules: {
                      ...config.booking_time_rules,
                      end_time: e.target.value
                    }
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advance-hours">Minimum Advance Hours</Label>
            <Input
              id="advance-hours"
              type="number"
              min="0"
              value={config.booking_time_rules.advance_hours}
              onChange={(e) => 
                setConfig({
                  ...config,
                  booking_time_rules: {
                    ...config.booking_time_rules,
                    advance_hours: parseInt(e.target.value) || 0
                  }
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={config.booking_time_rules.timezone}
              onValueChange={(value) => 
                setConfig({
                  ...config,
                  booking_time_rules: {
                    ...config.booking_time_rules,
                    timezone: value
                  }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="sync-ghl"
            checked={config.sync_to_ghl}
            onCheckedChange={(checked) => 
              setConfig({ ...config, sync_to_ghl: checked })
            }
          />
          <Label htmlFor="sync-ghl">Sync bookings to GoHighLevel</Label>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
};