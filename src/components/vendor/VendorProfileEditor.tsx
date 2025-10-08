import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Save, Clock, CheckCircle, X, Upload, Plus, Trash2, Building, Phone, Mail, Globe, MapPin, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVersionedDraft } from '@/hooks/useVersionedDraft';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

interface VendorProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  onSave?: () => void;
}

export const VendorProfileEditor: React.FC<VendorProfileEditorProps> = ({
  open,
  onOpenChange,
  vendorId,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<any>(null);
  
  // Use versioned draft system
  const {
    draftState,
    isSaving,
    hasUnsavedChanges,
    showConflictBanner,
    lastSaved,
    saveDraft,
    submitDraft,
    refreshDraft
  } = useVersionedDraft({
    entityId: vendorId,
    entityType: 'vendor',
    autosaveDelay: 5000
  });
  
  // Form state - comprehensive vendor profile data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    logo_url: '',
    location: '',
    vendor_type: 'company',
    service_radius_miles: 50,
    nmls_id: '',
    service_states: [] as string[],
    mls_areas: [] as string[],
    license_states: [] as string[],
    individual_name: '',
    individual_title: '',
    individual_email: '',
    individual_phone: '',
    individual_license_number: ''
  });

  const [newServiceState, setNewServiceState] = useState('');
  const [newMlsArea, setNewMlsArea] = useState('');
  const [newLicenseState, setNewLicenseState] = useState('');

  useEffect(() => {
    if (open) {
      loadVendorData();
    }
  }, [open, vendorId]);

  // Load draft data when available
  useEffect(() => {
    if (draftState?.payload) {
      setFormData(draftState.payload);
    }
  }, [draftState]);

  const loadVendorData = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      
      setCurrentVendor(data);
      // Load current vendor data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        website_url: data.website_url || '',
        logo_url: data.logo_url || '',
        location: data.location || '',
        vendor_type: data.vendor_type || 'company',
        service_radius_miles: data.service_radius_miles || 50,
        nmls_id: data.nmls_id || '',
        service_states: data.service_states || [],
        mls_areas: data.mls_areas || [],
        license_states: data.license_states || [],
        individual_name: data.individual_name || '',
        individual_title: data.individual_title || '',
        individual_email: data.individual_email || '',
        individual_phone: data.individual_phone || '',
        individual_license_number: data.individual_license_number || ''
      });
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number | string[]) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    // Trigger autosave
    saveDraft(updatedData);
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

  const handleLogoUpload = async (file: File) => {
    try {
      setLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${vendorId}/logo.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('vendor-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-assets')
        .getPublicUrl(fileName);

      handleInputChange('logo_url', publicUrl);
      
      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    await saveDraft(formData, true); // Force immediate save
    await submitDraft();
    onSave?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Vendor Profile
            {draftState && (
              <Badge variant="outline">
                v{draftState.version_number} {draftState.state === 'DRAFT' ? '(Draft)' : '(Live)'}
              </Badge>
            )}
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
        </DialogHeader>

        {showConflictBanner && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Draft Out of Sync</AlertTitle>
            <AlertDescription>
              This draft has been modified elsewhere. Refresh to see latest.
              <Button onClick={refreshDraft} size="sm" className="ml-2">
                Refresh Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {draftState?.state === 'CHANGES_REQUESTED' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Changes Requested</AlertTitle>
            <AlertDescription>
              Your previous submission was rejected. Please review and resubmit.
            </AlertDescription>
          </Alert>
        )}

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
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.logo_url && (
                    <img 
                      src={formData.logo_url} 
                      alt="Company Logo" 
                      className="w-16 h-16 object-contain border rounded"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleLogoUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
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
                  <Label htmlFor="contact_phone">Phone Number</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
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
                    placeholder="License number"
                  />
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitForReview} disabled={isSaving || !hasUnsavedChanges}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Submit for Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};