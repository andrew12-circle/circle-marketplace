import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Building, 
  Globe, 
  Mail,
  Bell,
  Shield,
  Save
} from "lucide-react";

interface AffiliateSettingsProps {
  affiliate: any;
  onUpdate: () => void;
}

export const AffiliateSettings = ({ affiliate, onUpdate }: AffiliateSettingsProps) => {
  const [formData, setFormData] = useState({
    legal_name: affiliate?.legal_name || "",
    business_name: affiliate?.business_name || "",
    email: affiliate?.email || "",
    country: affiliate?.country || "",
    website: affiliate?.website || "",
    marketing_channels: affiliate?.marketing_channels || "",
    notes: affiliate?.notes || ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email_reports: true,
    email_payouts: true,
    email_conversions: false,
    email_marketing: true
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("affiliates")
        .update(formData)
        .eq("id", affiliate.id);

      if (error) throw error;

      toast.success("Settings saved successfully!");
      onUpdate();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your affiliate profile and preferences.
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="legal_name">Legal Name *</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
                placeholder="Your full legal name"
              />
            </div>
            
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Your company or brand name"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Marketing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Marketing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="marketing_channels">Primary Marketing Channels</Label>
            <Select
              value={formData.marketing_channels}
              onValueChange={(value) => setFormData(prev => ({ ...prev, marketing_channels: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="How do you promote Circle?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="email_marketing">Email Marketing</SelectItem>
                <SelectItem value="content_creation">Content Creation / Blogging</SelectItem>
                <SelectItem value="coaching_speaking">Coaching & Speaking</SelectItem>
                <SelectItem value="networking">Networking & Referrals</SelectItem>
                <SelectItem value="paid_advertising">Paid Advertising</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Monthly Reports</div>
              <div className="text-sm text-muted-foreground">
                Receive monthly performance summaries
              </div>
            </div>
            <Switch
              checked={notifications.email_reports}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_reports: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Payout Notifications</div>
              <div className="text-sm text-muted-foreground">
                Get notified when payouts are processed
              </div>
            </div>
            <Switch
              checked={notifications.email_payouts}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_payouts: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Conversion Alerts</div>
              <div className="text-sm text-muted-foreground">
                Real-time notifications for new conversions
              </div>
            </div>
            <Switch
              checked={notifications.email_conversions}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_conversions: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Marketing Updates</div>
              <div className="text-sm text-muted-foreground">
                Tips, new assets, and program updates
              </div>
            </div>
            <Switch
              checked={notifications.email_marketing}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_marketing: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">Password</div>
              <div className="text-sm text-muted-foreground">
                Last updated 3 months ago
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">
                Not enabled
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};