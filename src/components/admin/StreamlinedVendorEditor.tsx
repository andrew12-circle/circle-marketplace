import { useState } from "react";
import { VendorQuestionsManager } from './VendorQuestionsManager';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Upload,
  Save,
  X,
  Plus,
  Star,
  Award
} from "lucide-react";

interface StreamlinedVendorEditorProps {
  vendorData: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    website_url?: string;
    location?: string;
    contact_email?: string;
    phone?: string;
    vendor_type?: string;
    is_verified?: boolean;
    specialties?: string[];
    funnel_content?: any;
  };
  onSave: (updatedData: any) => void;
  onCancel: () => void;
}

const COMMON_SPECIALTIES = [
  'Residential Sales',
  'Commercial Real Estate',
  'Property Management',
  'Real Estate Investment',
  'First-Time Home Buyers',
  'Luxury Properties',
  'Land Development',
  'Foreclosures & REO',
  'Real Estate Photography',
  'Marketing & Lead Generation',
  'Mortgage & Lending',
  'Home Staging',
  'Property Inspection',
  'Title & Escrow Services'
];

export const StreamlinedVendorEditor = ({ vendorData, onSave, onCancel }: StreamlinedVendorEditorProps) => {
  const [formData, setFormData] = useState({
    name: vendorData.name || '',
    description: vendorData.description || '',
    logo_url: vendorData.logo_url || '',
    website_url: vendorData.website_url || '',
    location: vendorData.location || '',
    contact_email: vendorData.contact_email || '',
    phone: vendorData.phone || '',
    vendor_type: vendorData.vendor_type || 'company',
    is_verified: vendorData.is_verified || false,
    specialties: vendorData.specialties || [],
    funnel_content: vendorData.funnel_content || {
      headline: '',
      subheadline: '',
      heroDescription: '',
      contactInfo: {
        phone: vendorData.phone || '',
        email: vendorData.contact_email || '',
        website: vendorData.website_url || ''
      }
    }
  });
  
  const [newSpecialty, setNewSpecialty] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFunnelChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      funnel_content: {
        ...prev.funnel_content,
        [field]: value
      }
    }));
  };

  const addSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${vendorData.id}-logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      handleInputChange('logo_url', data.publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Update funnel contact info to match main contact info
      const updatedData = {
        ...formData,
        funnel_content: {
          ...formData.funnel_content,
          contactInfo: {
            phone: formData.phone,
            email: formData.contact_email,
            website: formData.website_url
          }
        }
      };

      const { error } = await supabase
        .from('vendors')
        .update(updatedData)
        .eq('id', vendorData.id);

      if (error) throw error;

      toast.success('Vendor updated successfully');
      onSave(updatedData);
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error('Failed to save vendor');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="vendor_type">Business Type</Label>
              <Select 
                value={formData.vendor_type} 
                onValueChange={(value) => handleInputChange('vendor_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of your company and services"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, State"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_verified"
              checked={formData.is_verified}
              onCheckedChange={(checked) => handleInputChange('is_verified', checked)}
            />
            <Label htmlFor="is_verified" className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              Verified Vendor
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Questions & Answers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Questions & Answers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VendorQuestionsManager 
            vendorId={vendorData.id} 
            vendorName={vendorData.name}
          />
        </CardContent>
      </Card>

      {/* Contact & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Contact & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_email">Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website_url">Website</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
              placeholder="https://www.company.com"
            />
          </div>

          <div>
            <Label htmlFor="logo">Logo</Label>
            <div className="flex items-center space-x-4">
              {formData.logo_url && (
                <img 
                  src={formData.logo_url} 
                  alt="Company logo"
                  className="w-16 h-16 rounded-lg object-contain border"
                />
              )}
              <div>
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('logo')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Specialties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Specialties</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                  {specialty}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeSpecialty(specialty)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Add Specialty</Label>
            <div className="flex gap-2 mb-2">
              <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a specialty" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SPECIALTIES.filter(specialty => !formData.specialties.includes(specialty)).map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => addSpecialty(newSpecialty)} disabled={!newSpecialty}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Or enter custom specialty"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addSpecialty(newSpecialty)}
              />
              <Button onClick={() => addSpecialty(newSpecialty)} disabled={!newSpecialty.trim()}>
                Add Custom
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Funnel Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Landing Page Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={formData.funnel_content.headline}
              onChange={(e) => handleFunnelChange('headline', e.target.value)}
              placeholder="Transform Your Real Estate Business"
            />
          </div>

          <div>
            <Label htmlFor="subheadline">Subheadline</Label>
            <Input
              id="subheadline"
              value={formData.funnel_content.subheadline}
              onChange={(e) => handleFunnelChange('subheadline', e.target.value)}
              placeholder="Join thousands of successful agents"
            />
          </div>

          <div>
            <Label htmlFor="heroDescription">Description</Label>
            <Textarea
              id="heroDescription"
              value={formData.funnel_content.heroDescription}
              onChange={(e) => handleFunnelChange('heroDescription', e.target.value)}
              placeholder="Explain what makes your service special"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};