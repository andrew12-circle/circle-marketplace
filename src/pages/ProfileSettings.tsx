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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Modern Header with Glass Effect */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="rounded-full hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Profile Settings
                </h1>
                <p className="text-muted-foreground">Personalize your Circle experience</p>
              </div>
            </div>
            {profile.is_pro_member && (
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/20 px-4 py-2"
              >
                <Crown className="w-4 h-4 mr-2" />
                Pro Member
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
                      <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-primary/10">
                        <User className="w-10 h-10" />
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 cursor-pointer">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        disabled={uploadingAvatar}
                        className="rounded-full h-8 w-8 shadow-lg hover:shadow-xl transition-shadow"
                        asChild
                      >
                        <span>
                          <Upload className="w-4 h-4" />
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
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{formData.display_name || "Your Name"}</h3>
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                  </div>
                  {uploadingAvatar && (
                    <p className="text-xs text-primary">Uploading new photo...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold">Account Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Circle Points</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {profile.circle_points}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Membership</span>
                    <Badge 
                      variant={profile.is_pro_member ? "default" : "secondary"}
                      className={profile.is_pro_member ? "bg-primary" : ""}
                    >
                      {profile.is_pro_member ? "Pro" : "Free"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vendor Status</span>
                    <Badge 
                      variant={vendorData.vendor_enabled ? "default" : "secondary"}
                      className={vendorData.vendor_enabled ? "bg-green-600" : ""}
                    >
                      {vendorData.vendor_enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                {!profile.is_pro_member && (
                  <Button asChild size="sm" className="w-full mt-4">
                    <Link to="/pricing">Upgrade to Pro</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Settings Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic profile and contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="display_name" className="text-sm font-medium">Display Name</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => handleInputChange("display_name", e.target.value)}
                        placeholder="Your display name"
                        className="bg-background/50 border-border/50 focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="bg-background/50 border-border/50 focus:bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="bg-background/50 border-border/50 focus:bg-background resize-none"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="City, State"
                        className="bg-background/50 border-border/50 focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="years_experience" className="text-sm font-medium">Experience (Years)</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        value={formData.years_experience}
                        onChange={(e) => handleInputChange("years_experience", e.target.value)}
                        placeholder="0"
                        min="0"
                        max="50"
                        className="bg-background/50 border-border/50 focus:bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate("/")} className="px-8">
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Business Details
                </CardTitle>
                <CardDescription>Professional and business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="business_name" className="text-sm font-medium">Business Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange("business_name", e.target.value)}
                    placeholder="Your business or company name"
                    className="bg-background/50 border-border/50 focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url" className="text-sm font-medium">Website</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange("website_url", e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="bg-background/50 border-border/50 focus:bg-background"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vendor Access */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Vendor Dashboard
                </CardTitle>
                <CardDescription>
                  Enable vendor features to list services and access co-marketing opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="space-y-1">
                    <p className="font-medium">Vendor Access</p>
                    <p className="text-sm text-muted-foreground">
                      Access vendor dashboard and marketplace features
                    </p>
                  </div>
                  <Switch
                    checked={vendorData.vendor_enabled}
                    onCheckedChange={handleVendorToggle}
                    disabled={vendorLoading}
                  />
                </div>

                {vendorData.vendor_enabled && (
                  <div className="space-y-6 pt-4 border-t border-border/50">
                    <div className="space-y-2">
                      <Label htmlFor="vendor_type" className="text-sm font-medium">Vendor Type</Label>
                      <Select
                        value={vendorData.vendor_type}
                        onValueChange={(value) => handleVendorChange("vendor_type", value)}
                      >
                        <SelectTrigger className="bg-background/50 border-border/50">
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
                      <Label htmlFor="vendor_company_name" className="text-sm font-medium">Company Name</Label>
                      <Input
                        id="vendor_company_name"
                        value={vendorData.vendor_company_name}
                        onChange={(e) => handleVendorChange("vendor_company_name", e.target.value)}
                        placeholder="Your company or business name"
                        className="bg-background/50 border-border/50 focus:bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vendor_description" className="text-sm font-medium">Company Description</Label>
                      <Textarea
                        id="vendor_description"
                        value={vendorData.vendor_description}
                        onChange={(e) => handleVendorChange("vendor_description", e.target.value)}
                        placeholder="Describe your business and what you offer..."
                        rows={3}
                        className="bg-background/50 border-border/50 focus:bg-background resize-none"
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};