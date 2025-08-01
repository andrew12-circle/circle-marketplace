import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  Trash2,
  Shield
} from "lucide-react";

interface VendorProfileEditorProps {
  vendorData: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    website_url?: string;
    location?: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
    co_marketing_agents: number;
    campaigns_funded: number;
    service_states?: string[];
    mls_areas?: string[];
    service_radius_miles?: number;
    nmls_id?: string;
    contact_email?: string;
    phone?: string;
    vendor_type?: string;
    license_states?: string[];
    individual_name?: string;
    individual_title?: string;
    individual_email?: string;
    individual_phone?: string;
    individual_license_number?: string;
  };
  onSave: (updatedData: any) => void;
  onCancel: () => void;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export const VendorProfileEditor = ({ vendorData, onSave, onCancel }: VendorProfileEditorProps) => {
  const [formData, setFormData] = useState({
    name: vendorData.name || '',
    description: vendorData.description || '',
    logo_url: vendorData.logo_url || '',
    website_url: vendorData.website_url || '',
    location: vendorData.location || '',
    contact_email: vendorData.contact_email || '',
    phone: vendorData.phone || '',
    service_radius_miles: vendorData.service_radius_miles || 50,
    nmls_id: vendorData.nmls_id || '',
    vendor_type: vendorData.vendor_type || 'company',
    service_states: vendorData.service_states || [],
    mls_areas: vendorData.mls_areas || [],
    license_states: vendorData.license_states || [],
    individual_name: vendorData.individual_name || '',
    individual_title: vendorData.individual_title || '',
    individual_email: vendorData.individual_email || '',
    individual_phone: vendorData.individual_phone || '',
    individual_license_number: vendorData.individual_license_number || ''
  });
  
  const [newServiceState, setNewServiceState] = useState('');
  const [newMlsArea, setNewMlsArea] = useState('');
  const [newLicenseState, setNewLicenseState] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addServiceState = () => {
    if (newServiceState && !formData.service_states.includes(newServiceState)) {
      setFormData(prev => ({
        ...prev,
        service_states: [...prev.service_states, newServiceState]
      }));
      setNewServiceState('');
    }
  };

  const removeServiceState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      service_states: prev.service_states.filter(s => s !== state)
    }));
  };

  const addMlsArea = () => {
    if (newMlsArea && !formData.mls_areas.includes(newMlsArea)) {
      setFormData(prev => ({
        ...prev,
        mls_areas: [...prev.mls_areas, newMlsArea]
      }));
      setNewMlsArea('');
    }
  };

  const removeMlsArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      mls_areas: prev.mls_areas.filter(a => a !== area)
    }));
  };

  const addLicenseState = () => {
    if (newLicenseState && !formData.license_states.includes(newLicenseState)) {
      setFormData(prev => ({
        ...prev,
        license_states: [...prev.license_states, newLicenseState]
      }));
      setNewLicenseState('');
    }
  };

  const removeLicenseState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      license_states: prev.license_states.filter(s => s !== state)
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
      
      const { error } = await supabase
        .from('vendors')
        .update(formData)
        .eq('id', vendorData.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      onSave(formData);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Company Information
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
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your company and services"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center space-x-4">
              {formData.logo_url && (
                <img 
                  src={formData.logo_url} 
                  alt="Company logo"
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
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

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://www.company.com"
              />
            </div>
            <div>
              <Label htmlFor="location">Primary Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licensing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Licensing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nmls_id">NMLS ID</Label>
              <Input
                id="nmls_id"
                value={formData.nmls_id}
                onChange={(e) => handleInputChange('nmls_id', e.target.value)}
                placeholder="123456"
              />
            </div>
            <div>
              <Label htmlFor="service_radius">Service Radius (miles)</Label>
              <Input
                id="service_radius"
                type="number"
                value={formData.service_radius_miles}
                onChange={(e) => handleInputChange('service_radius_miles', parseInt(e.target.value) || 0)}
                placeholder="50"
              />
            </div>
          </div>

          {/* License States */}
          <div>
            <Label>Licensed States</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.license_states.map((state) => (
                <Badge key={state} variant="secondary" className="flex items-center gap-1">
                  {state}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeLicenseState(state)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={newLicenseState} onValueChange={setNewLicenseState}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.filter(state => !formData.license_states.includes(state)).map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addLicenseState} disabled={!newLicenseState}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Service Areas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service States */}
          <div>
            <Label>Service States</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.service_states.map((state) => (
                <Badge key={state} variant="outline" className="flex items-center gap-1">
                  {state}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeServiceState(state)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={newServiceState} onValueChange={setNewServiceState}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.filter(state => !formData.service_states.includes(state)).map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addServiceState} disabled={!newServiceState}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* MLS Areas */}
          <div>
            <Label>MLS Areas</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.mls_areas.map((area) => (
                <Badge key={area} variant="outline" className="flex items-center gap-1">
                  {area}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeMlsArea(area)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMlsArea}
                onChange={(e) => setNewMlsArea(e.target.value)}
                placeholder="Enter MLS area name"
                className="flex-1"
              />
              <Button onClick={addMlsArea} disabled={!newMlsArea.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Representative (if vendor_type is individual) */}
      {formData.vendor_type === 'individual' && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Representative</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="individual_name">Full Name</Label>
                <Input
                  id="individual_name"
                  value={formData.individual_name}
                  onChange={(e) => handleInputChange('individual_name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="individual_title">Title</Label>
                <Input
                  id="individual_title"
                  value={formData.individual_title}
                  onChange={(e) => handleInputChange('individual_title', e.target.value)}
                  placeholder="Loan Officer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="individual_email">Email</Label>
                <Input
                  id="individual_email"
                  type="email"
                  value={formData.individual_email}
                  onChange={(e) => handleInputChange('individual_email', e.target.value)}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label htmlFor="individual_phone">Phone</Label>
                <Input
                  id="individual_phone"
                  value={formData.individual_phone}
                  onChange={(e) => handleInputChange('individual_phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="individual_license_number">License Number</Label>
              <Input
                id="individual_license_number"
                value={formData.individual_license_number}
                onChange={(e) => handleInputChange('individual_license_number', e.target.value)}
                placeholder="12345"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
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