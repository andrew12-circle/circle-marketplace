import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Building2, Briefcase, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InviteVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorFormData {
  name: string;
  description: string;
  vendorType: string;
  category: string;
  website_url: string;
  contact_email: string;
  phone: string;
  location: string;
  logo_url: string;
  specialties: string[];
  years_experience: number | null;
}

const VENDOR_TYPES = {
  marketing: {
    label: "Marketing & Business",
    icon: Briefcase,
    categories: [
      "Digital Marketing Agency",
      "Social Media Management", 
      "SEO/SEM Services",
      "Content Creation",
      "Photography/Videography",
      "Graphic Design",
      "Business Coaching",
      "CRM Solutions",
      "Lead Generation",
      "Marketing Automation"
    ]
  },
  settlement: {
    label: "Settlement Services",
    icon: Building2,
    categories: [
      "Mortgage Lender",
      "Title Company",
      "Insurance Provider",
      "Appraisal Services",
      "Home Inspection",
      "Real Estate Attorney",
      "Escrow Services",
      "Credit Repair",
      "Moving Services",
      "Home Warranty"
    ]
  }
};

export const InviteVendorModal = ({ open, onOpenChange }: InviteVendorModalProps) => {
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    description: "",
    vendorType: "",
    category: "",
    website_url: "",
    contact_email: "",
    phone: "",
    location: "",
    logo_url: "",
    specialties: [],
    years_experience: null,
  });
  const { toast } = useToast();

  const handleTypeSelection = (type: string) => {
    setFormData({ ...formData, vendorType: type, category: "" });
    setStep('form');
  };

  const handleSpecialtyAdd = (specialty: string) => {
    if (specialty.trim() && !formData.specialties.includes(specialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty.trim()]
      });
    }
  };

  const handleSpecialtyRemove = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact_email || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Email, Category)",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('invite-vendor', {
        body: { 
          vendorData: formData,
          inviterMessage: `New ${formData.vendorType} vendor invitation`
        },
      });

      if (error) throw error;

      toast({
        title: "Vendor Invited Successfully!",
        description: "The vendor has been added to the marketplace and will be notified.",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        vendorType: "",
        category: "",
        website_url: "",
        contact_email: "",
        phone: "",
        location: "",
        logo_url: "",
        specialties: [],
        years_experience: null,
      });
      setStep('type');
      onOpenChange(false);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to invite vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('type');
    setFormData({
      name: "",
      description: "",
      vendorType: "",
      category: "",
      website_url: "",
      contact_email: "",
      phone: "",
      location: "",
      logo_url: "",
      specialties: [],
      years_experience: null,
    });
  };

  const selectedVendorType = VENDOR_TYPES[formData.vendorType as keyof typeof VENDOR_TYPES];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold">Invite Your Vendor</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add a vendor to the Circle marketplace to help other agents grow their business.
          </p>
        </DialogHeader>

        {step === 'type' ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">What type of vendor are you inviting?</h3>
              <p className="text-sm text-muted-foreground">
                Choose the category that best describes their services
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(VENDOR_TYPES).map(([key, type]) => {
                const Icon = type.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleTypeSelection(key)}
                    className="p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">{type.label}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {type.categories.slice(0, 3).map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {type.categories.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{type.categories.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedVendorType?.label}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ABC Marketing Agency"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Service Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedVendorType?.categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of their services and expertise..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@vendor.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://vendor-website.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Nashville, TN"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://vendor.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  value={formData.years_experience || ""}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                    {specialty}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleSpecialtyRemove(specialty)}
                    />
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add specialty and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSpecialtyAdd(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleReset}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "Inviting..." : "Invite Vendor"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};