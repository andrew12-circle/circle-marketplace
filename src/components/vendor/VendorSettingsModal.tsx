import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings, 
  User, 
  Bell, 
  Building, 
  Shield,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VendorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
}

interface VendorSettings {
  name: string;
  contact_email: string;
  phone?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  business_address?: string;
  service_areas?: string;
  business_hours?: string;
  email_notifications_enabled?: boolean;
  sms_notifications_enabled?: boolean;
}

export const VendorSettingsModal = ({ isOpen, onClose, vendorId }: VendorSettingsModalProps) => {
  const [settings, setSettings] = useState<VendorSettings>({
    name: '',
    contact_email: '',
    phone: '',
    description: '',
    logo_url: '',
    website: '',
    business_address: '',
    service_areas: '',
    business_hours: '',
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && vendorId) {
      fetchVendorSettings();
    }
  }, [isOpen, vendorId]);

  const fetchVendorSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          name: data.name || '',
          contact_email: data.contact_email || '',
          phone: data.phone || '',
          description: data.description || '',
          logo_url: data.logo_url || '',
          website: data.website || '',
          business_address: data.business_address || '',
          service_areas: data.service_areas || '',
          business_hours: data.business_hours || '',
          email_notifications_enabled: data.email_notifications_enabled ?? true,
          sms_notifications_enabled: data.sms_notifications_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching vendor settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('vendors')
        .update({
          name: settings.name,
          contact_email: settings.contact_email,
          phone: settings.phone,
          description: settings.description,
          logo_url: settings.logo_url,
          website: settings.website,
          business_address: settings.business_address,
          service_areas: settings.service_areas,
          business_hours: settings.business_hours,
          email_notifications_enabled: settings.email_notifications_enabled,
          sms_notifications_enabled: settings.sms_notifications_enabled,
        })
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
      onClose();
    } catch (error) {
      console.error('Error updating vendor settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof VendorSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-center py-8">
            Loading settings...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="w-6 h-6" />
            Vendor Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Upload Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={settings.logo_url} />
                    <AvatarFallback className="text-lg">
                      {settings.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Company Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="logo_url"
                        value={settings.logo_url}
                        onChange={(e) => handleInputChange('logo_url', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={settings.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    value={settings.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your company and services..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Business Address
                  </Label>
                  <Input
                    id="business_address"
                    value={settings.business_address}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_areas">Service Areas</Label>
                  <Textarea
                    id="service_areas"
                    value={settings.service_areas}
                    onChange={(e) => handleInputChange('service_areas', e.target.value)}
                    placeholder="List the areas you serve (e.g., Downtown, Suburbs, Entire City)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_hours" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Business Hours
                  </Label>
                  <Textarea
                    id="business_hours"
                    value={settings.business_hours}
                    onChange={(e) => handleInputChange('business_hours', e.target.value)}
                    placeholder="Monday-Friday: 9:00 AM - 6:00 PM&#10;Saturday: 10:00 AM - 4:00 PM&#10;Sunday: Closed"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <Label htmlFor="email_notifications">Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive email alerts for new reviews, bookings, and important updates
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settings.email_notifications_enabled}
                    onCheckedChange={(checked) => handleInputChange('email_notifications_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <Label htmlFor="sms_notifications">SMS Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive text message alerts for urgent notifications
                    </p>
                  </div>
                  <Switch
                    id="sms_notifications"
                    checked={settings.sms_notifications_enabled}
                    onCheckedChange={(checked) => handleInputChange('sms_notifications_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Account Security</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage your account security settings and password
                    </p>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Data Privacy</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Control how your data is used and shared
                    </p>
                    <Button variant="outline" size="sm">
                      Privacy Settings
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg bg-destructive/10 border-destructive/20">
                    <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently deactivate your vendor account
                    </p>
                    <Button variant="destructive" size="sm">
                      Deactivate Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};