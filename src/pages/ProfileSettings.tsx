import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Upload, ArrowLeft, Crown, Building, Store } from "lucide-react";

export const ProfileSettings = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    business_name: "",
    phone: "",
    location: "",
    website_url: "",
    years_experience: "",
  });
  
  const [vendorData, setVendorData] = useState({
    vendor_enabled: false,
    vendor_type: "",
    vendor_company_name: "",
    vendor_description: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        business_name: profile.business_name || "",
        phone: profile.phone || "",
        location: profile.location || "",
        website_url: profile.website_url || "",
        years_experience: profile.years_experience?.toString() || "",
      });
      
      setVendorData({
        vendor_enabled: (profile as any).vendor_enabled || false,
        vendor_type: (profile as any).vendor_type || "",
        vendor_company_name: (profile as any).vendor_company_name || "",
        vendor_description: (profile as any).vendor_description || "",
      });
    }
  }, [user, profile, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVendorChange = (field: string, value: string | boolean) => {
    setVendorData(prev => ({ ...prev, [field]: value }));
  };

  const handleVendorToggle = async (enabled: boolean) => {
    if (!user) return;
    
    setVendorLoading(true);
    
    try {
      const updateData: any = { vendor_enabled: enabled };
      
      // If disabling vendor, clear vendor-specific fields
      if (!enabled) {
        updateData.vendor_type = null;
        updateData.vendor_company_name = null;
        updateData.vendor_description = null;
      }
      
      const { error } = await updateProfile(updateData);

      if (error) throw error;
      
      setVendorData(prev => ({
        ...prev,
        vendor_enabled: enabled,
        ...(enabled ? {} : { vendor_type: "", vendor_company_name: "", vendor_description: "" })
      }));
      
      toast({
        title: enabled ? "Vendor access enabled" : "Vendor access disabled",
        description: enabled 
          ? "You now have access to the vendor dashboard."
          : "Vendor dashboard access has been removed.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update vendor settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVendorLoading(false);
    }
  };

  const handleVendorDetailsSubmit = async () => {
    if (!user || !vendorData.vendor_enabled) return;
    
    setVendorLoading(true);
    
    try {
      const { error } = await updateProfile({
        vendor_type: vendorData.vendor_type || null,
        vendor_company_name: vendorData.vendor_company_name || null,
        vendor_description: vendorData.vendor_description || null,
      } as any);

      if (error) throw error;
      
      toast({
        title: "Vendor details updated",
        description: "Your vendor information has been saved.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update vendor details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVendorLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);

    try {
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });

      if (updateError) throw updateError;
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      // Handle avatar upload error without exposing details
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await updateProfile({
        ...formData,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
      });

      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      // Handle profile update error without exposing details
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Profile Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
              </div>
            </div>
            {profile.is_pro_member && (
              <Badge variant="secondary" className="bg-circle-accent text-foreground">
                <Crown className="w-3 h-3 mr-1" />
                Pro Member
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your avatar image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="text-lg">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingAvatar}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingAvatar ? "Uploading..." : "Upload new picture"}
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal and business details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange("display_name", e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <h3 className="text-lg font-medium">Business Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange("business_name", e.target.value)}
                      placeholder="Your business or company name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="years_experience">Years of Experience</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        value={formData.years_experience}
                        onChange={(e) => handleInputChange("years_experience", e.target.value)}
                        placeholder="0"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="City, State"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange("website_url", e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and membership status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Circle Points</p>
                    <p className="text-sm text-muted-foreground">{profile.circle_points} points available</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Membership Status</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.is_pro_member ? "Circle Pro Member" : "Free Member"}
                    </p>
                  </div>
                  {!profile.is_pro_member && (
                    <Button asChild variant="outline">
                      <Link to="/pricing">Upgrade to Pro</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Access Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Vendor Dashboard Access
              </CardTitle>
              <CardDescription>
                Enable vendor features to list services or access co-marketing opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Enable Vendor Access</p>
                  <p className="text-sm text-muted-foreground">
                    Access vendor dashboard to manage services and partnerships
                  </p>
                </div>
                <Switch
                  checked={vendorData.vendor_enabled}
                  onCheckedChange={handleVendorToggle}
                  disabled={vendorLoading}
                />
              </div>

              {vendorData.vendor_enabled && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Vendor Configuration</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vendor_type">Vendor Type</Label>
                      <Select
                        value={vendorData.vendor_type}
                        onValueChange={(value) => handleVendorChange("vendor_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service_provider">
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4" />
                              Service Provider
                            </div>
                          </SelectItem>
                          <SelectItem value="co_marketing">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Co-Marketing Partner
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {vendorData.vendor_type === "service_provider" 
                          ? "List and sell services to real estate professionals" 
                          : "Partner with agents for lead generation and co-marketing"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vendor_company_name">Company Name</Label>
                      <Input
                        id="vendor_company_name"
                        value={vendorData.vendor_company_name}
                        onChange={(e) => handleVendorChange("vendor_company_name", e.target.value)}
                        placeholder="Your company or business name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vendor_description">Company Description</Label>
                      <Textarea
                        id="vendor_description"
                        value={vendorData.vendor_description}
                        onChange={(e) => handleVendorChange("vendor_description", e.target.value)}
                        placeholder="Describe your business and what you offer..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleVendorDetailsSubmit}
                      disabled={vendorLoading || !vendorData.vendor_type}
                      className="w-full"
                    >
                      {vendorLoading ? "Saving..." : "Save Vendor Details"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};