import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building, User, MapPin, Phone, Mail, Globe, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VENDOR_TYPES = [
  { value: "lender", label: "Mortgage Lender" },
  { value: "title", label: "Title Company" },
  { value: "insurance", label: "Insurance Agency" },
  { value: "home_warranty", label: "Home Warranty" },
  { value: "inspection", label: "Home Inspection" },
  { value: "moving", label: "Moving Company" },
  { value: "handyman", label: "Handyman/Contractor" },
  { value: "real_estate", label: "Real Estate Agent" },
  { value: "attorney", label: "Real Estate Attorney" },
  { value: "appraiser", label: "Property Appraiser" },
  { value: "other", label: "Other Service Provider" }
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export const VendorRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const registrationType = searchParams.get("type") || "service_provider";
  
  const [formData, setFormData] = useState({
    // Company/Individual Info
    vendorType: "",
    companyName: "",
    individualName: "",
    individualTitle: "",
    description: "",
    
    // Contact Info
    email: "",
    phone: "",
    individualEmail: "",
    individualPhone: "",
    websiteUrl: "",
    
    // Location & Service Area
    location: "",
    serviceStates: [] as string[],
    serviceZipCodes: "",
    serviceRadiusMiles: "",
    
    // Professional Info
    licenseNumber: "",
    nmlsId: "",
    licenseStates: [] as string[],
    
    // Co-Marketing Specific
    isCoMarketing: registrationType === "co_marketing",
    marketingBudget: "",
    targetAudience: "",
    
    // Terms
    agreeToTerms: false,
    agreeToBackground: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleStateToggle = (field: "serviceStates" | "licenseStates", state: string) => {
    const currentStates = formData[field];
    const newStates = currentStates.includes(state)
      ? currentStates.filter(s => s !== state)
      : [...currentStates, state];
    updateFormData(field, newStates);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendorType) newErrors.vendorType = "Please select a vendor type";
    if (!formData.companyName && !formData.individualName) {
      newErrors.companyName = "Company name or individual name is required";
    }
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms";
    
    // Co-marketing specific validation
    if (formData.isCoMarketing) {
      if (!formData.marketingBudget) newErrors.marketingBudget = "Marketing budget is required";
      if (!formData.targetAudience) newErrors.targetAudience = "Target audience is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Here you would typically submit to your API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast({
        title: "Registration Submitted!",
        description: "Thank you for your interest. We'll review your application and get back to you within 24-48 hours.",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-bold">
              {registrationType === "co_marketing" ? "Co-Marketing Partner" : "Service Provider"} Registration
            </CardTitle>
            <CardDescription className="text-lg">
              {registrationType === "co_marketing" 
                ? "Join our network of marketing partners and grow your business"
                : "Join our marketplace and connect with homebuyers and agents"
              }
            </CardDescription>
            {registrationType === "co_marketing" && (
              <Badge variant="secondary" className="mx-auto mt-2">
                Co-Marketing Partner Application
              </Badge>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Vendor Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Business Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {VENDOR_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={formData.vendorType === type.value ? "default" : "outline"}
                      onClick={() => updateFormData("vendorType", type.value)}
                      className="justify-start h-auto p-3"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
                {errors.vendorType && <p className="text-sm text-destructive">{errors.vendorType}</p>}
              </div>

              {/* Company/Individual Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company/Business Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => updateFormData("companyName", e.target.value)}
                      placeholder="ABC Title Company"
                    />
                    {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="individualName">Contact Person Name</Label>
                    <Input
                      id="individualName"
                      value={formData.individualName}
                      onChange={(e) => updateFormData("individualName", e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="individualTitle">Contact Person Title</Label>
                    <Input
                      id="individualTitle"
                      value={formData.individualTitle}
                      onChange={(e) => updateFormData("individualTitle", e.target.value)}
                      placeholder="Owner, Manager, Agent, etc."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Describe your services, experience, and what makes you unique..."
                    rows={4}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Business Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="contact@company.com"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Business Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="individualEmail">Contact Person Email</Label>
                    <Input
                      id="individualEmail"
                      type="email"
                      value={formData.individualEmail}
                      onChange={(e) => updateFormData("individualEmail", e.target.value)}
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => updateFormData("websiteUrl", e.target.value)}
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                </div>
              </div>

              {/* Service Area */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Service Area
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Primary Business Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => updateFormData("location", e.target.value)}
                      placeholder="City, State"
                    />
                    {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                  </div>
                  <div>
                    <Label htmlFor="serviceRadiusMiles">Service Radius (Miles)</Label>
                    <Input
                      id="serviceRadiusMiles"
                      type="number"
                      value={formData.serviceRadiusMiles}
                      onChange={(e) => updateFormData("serviceRadiusMiles", e.target.value)}
                      placeholder="50"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>States You Service</Label>
                  <div className="grid grid-cols-6 md:grid-cols-10 gap-2 mt-2">
                    {US_STATES.map((state) => (
                      <Button
                        key={state}
                        type="button"
                        variant={formData.serviceStates.includes(state) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStateToggle("serviceStates", state)}
                        className="h-8"
                      >
                        {state}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="serviceZipCodes">Specific Zip Codes (Optional)</Label>
                  <Textarea
                    id="serviceZipCodes"
                    value={formData.serviceZipCodes}
                    onChange={(e) => updateFormData("serviceZipCodes", e.target.value)}
                    placeholder="12345, 12346, 12347..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Professional Credentials */}
              {(formData.vendorType === "lender" || formData.vendorType === "real_estate" || formData.vendorType === "attorney") && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Professional Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={(e) => updateFormData("licenseNumber", e.target.value)}
                        placeholder="License #"
                      />
                    </div>
                    {formData.vendorType === "lender" && (
                      <div>
                        <Label htmlFor="nmlsId">NMLS ID</Label>
                        <Input
                          id="nmlsId"
                          value={formData.nmlsId}
                          onChange={(e) => updateFormData("nmlsId", e.target.value)}
                          placeholder="NMLS #"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Licensed States</Label>
                    <div className="grid grid-cols-6 md:grid-cols-10 gap-2 mt-2">
                      {US_STATES.map((state) => (
                        <Button
                          key={state}
                          type="button"
                          variant={formData.licenseStates.includes(state) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStateToggle("licenseStates", state)}
                          className="h-8"
                        >
                          {state}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Co-Marketing Specific Fields */}
              {formData.isCoMarketing && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Co-Marketing Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="marketingBudget">Monthly Marketing Budget *</Label>
                      <Select value={formData.marketingBudget} onValueChange={(value) => updateFormData("marketingBudget", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under_1000">Under $1,000</SelectItem>
                          <SelectItem value="1000_2500">$1,000 - $2,500</SelectItem>
                          <SelectItem value="2500_5000">$2,500 - $5,000</SelectItem>
                          <SelectItem value="5000_10000">$5,000 - $10,000</SelectItem>
                          <SelectItem value="over_10000">Over $10,000</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.marketingBudget && <p className="text-sm text-destructive">{errors.marketingBudget}</p>}
                    </div>
                    <div>
                      <Label htmlFor="targetAudience">Target Audience *</Label>
                      <Input
                        id="targetAudience"
                        value={formData.targetAudience}
                        onChange={(e) => updateFormData("targetAudience", e.target.value)}
                        placeholder="First-time homebuyers, luxury market, etc."
                      />
                      {errors.targetAudience && <p className="text-sm text-destructive">{errors.targetAudience}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Terms & Agreements</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => updateFormData("agreeToTerms", checked)}
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm leading-tight">
                      I agree to the Terms of Service, Privacy Policy, and Vendor Agreement. I understand the platform fees and commission structure.
                    </Label>
                  </div>
                  {errors.agreeToTerms && <p className="text-sm text-destructive">{errors.agreeToTerms}</p>}
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToBackground"
                      checked={formData.agreeToBackground}
                      onCheckedChange={(checked) => updateFormData("agreeToBackground", checked)}
                    />
                    <Label htmlFor="agreeToBackground" className="text-sm leading-tight">
                      I consent to background verification and credential checks as part of the approval process.
                    </Label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting Application..." : "Submit Application"}
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  We'll review your application and respond within 24-48 hours
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};