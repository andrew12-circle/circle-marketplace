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
import { ArrowLeft, Building, User, MapPin, Phone, Mail, Globe, CreditCard, Download, Upload, FileSpreadsheet } from "lucide-react";
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
    
    // Team Members Upload
    teamMembersFile: null as File | null,
    
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

  const downloadTeamTemplate = () => {
    // Create universal template data that works for all vendor types
    const templateData = [
      ["First Name", "Last Name", "Title/Role", "Email", "Phone", "License/Cert Number", "License States", "Specialties/Services", "Years Experience"],
      ["John", "Smith", "Senior Loan Officer", "john.smith@company.com", "(555) 123-4567", "NMLS123456", "CA,TX,FL", "First-time buyers, Refinancing", "5"],
      ["Jane", "Doe", "Home Inspector", "jane.doe@company.com", "(555) 987-6543", "HI67890", "CA,NY", "Residential, Commercial", "8"],
      ["Mike", "Johnson", "Insurance Agent", "mike@company.com", "(555) 555-1234", "INS789", "CA", "Home, Auto, Umbrella", "3"],
      ["", "", "", "", "", "", "", "", ""]
    ];

    // Convert to CSV format
    const csvContent = templateData.map(row => 
      row.map(cell => `"${cell}"`).join(",")
    ).join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "team_members_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Please fill out the template with your team member details and upload it back.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file (.csv, .xls, .xlsx)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      updateFormData("teamMembersFile", file);
      toast({
        title: "File uploaded",
        description: `${file.name} has been selected for upload.`,
      });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/20 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8 relative z-10">
        <div className="animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8 hover-scale group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Button>

          <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm animate-scale-in">
            <CardHeader className="text-center relative pb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-t-lg"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
                    <Building className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4">
                  {registrationType === "co_marketing" ? "Co-Marketing Partner" : "Service Provider"} Registration
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {registrationType === "co_marketing" 
                    ? "Join our network of marketing partners and grow your business with strategic collaborations and shared opportunities"
                    : "Join our marketplace and connect with homebuyers, real estate agents, and grow your customer base"
                  }
                </CardDescription>
                {registrationType === "co_marketing" && (
                  <div className="flex justify-center mt-4">
                    <Badge variant="secondary" className="bg-gradient-to-r from-accent/20 to-primary/20 text-primary border-primary/20 px-4 py-1">
                      ✨ Co-Marketing Partner Application
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Vendor Type Selection */}
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Business Type</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {VENDOR_TYPES.map((type, index) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={formData.vendorType === type.value ? "default" : "outline"}
                        onClick={() => updateFormData("vendorType", type.value)}
                        className={`justify-start h-auto p-4 transition-all duration-300 hover-scale group ${
                          formData.vendorType === type.value 
                            ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg" 
                            : "hover:bg-secondary/50 hover:border-primary/30"
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="text-sm font-medium">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                  {errors.vendorType && (
                    <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                      {errors.vendorType}
                    </p>
                  )}
                </div>

                {/* Company/Individual Information */}
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-secondary/10">
                      <User className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Business Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                        Company/Business Name *
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => updateFormData("companyName", e.target.value)}
                        placeholder="ABC Title Company"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                      {errors.companyName && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.companyName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="individualName" className="text-sm font-medium text-foreground">
                        Contact Person Name
                      </Label>
                      <Input
                        id="individualName"
                        value={formData.individualName}
                        onChange={(e) => updateFormData("individualName", e.target.value)}
                        placeholder="John Smith"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="individualTitle" className="text-sm font-medium text-foreground">
                        Contact Person Title
                      </Label>
                      <Input
                        id="individualTitle"
                        value={formData.individualTitle}
                        onChange={(e) => updateFormData("individualTitle", e.target.value)}
                        placeholder="Owner, Manager, Agent, etc."
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-foreground">
                      Business Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData("description", e.target.value)}
                      placeholder="Describe your services, experience, and what makes you unique..."
                      rows={4}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 resize-none"
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/10 to-primary/10">
                      <Phone className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Contact Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        Business Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        placeholder="contact@company.com"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-foreground flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        Business Phone *
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="individualEmail" className="text-sm font-medium text-foreground">
                        Contact Person Email
                      </Label>
                      <Input
                        id="individualEmail"
                        type="email"
                        value={formData.individualEmail}
                        onChange={(e) => updateFormData("individualEmail", e.target.value)}
                        placeholder="john@company.com"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl" className="text-sm font-medium text-foreground flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        Website URL
                      </Label>
                      <Input
                        id="websiteUrl"
                        value={formData.websiteUrl}
                        onChange={(e) => updateFormData("websiteUrl", e.target.value)}
                        placeholder="https://www.yourcompany.com"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Area */}
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Service Area</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-foreground flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Primary Business Location *
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => updateFormData("location", e.target.value)}
                        placeholder="City, State"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                      {errors.location && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.location}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceRadiusMiles" className="text-sm font-medium text-foreground">
                        Service Radius (Miles)
                      </Label>
                      <Input
                        id="serviceRadiusMiles"
                        type="number"
                        value={formData.serviceRadiusMiles}
                        onChange={(e) => updateFormData("serviceRadiusMiles", e.target.value)}
                        placeholder="50"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">States You Service</Label>
                    <div className="bg-secondary/30 rounded-lg p-4 border border-secondary/50">
                      <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                        {US_STATES.map((state, index) => (
                          <Button
                            key={state}
                            type="button"
                            variant={formData.serviceStates.includes(state) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStateToggle("serviceStates", state)}
                            className={`h-10 text-xs font-medium transition-all duration-300 ${
                              formData.serviceStates.includes(state)
                                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg"
                                : "hover:bg-primary/10 hover:border-primary/30"
                            }`}
                            style={{ animationDelay: `${index * 20}ms` }}
                          >
                            {state}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serviceZipCodes" className="text-sm font-medium text-foreground">
                      Specific Zip Codes (Optional)
                    </Label>
                    <Textarea
                      id="serviceZipCodes"
                      value={formData.serviceZipCodes}
                      onChange={(e) => updateFormData("serviceZipCodes", e.target.value)}
                      placeholder="12345, 12346, 12347..."
                      rows={2}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 resize-none"
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

              {/* Team Members Upload Section - For All Vendor Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  Team Members Registration
                </h3>
                <div className="bg-secondary/50 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload details for all team members, agents, representatives, or staff who will be working under your company. 
                    This could include loan officers, inspectors, agents, sales reps, or any other team members who provide services.
                  </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadTeamTemplate}
                        className="flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Team Template
                      </Button>
                      
                      <div className="flex-1">
                        <Label htmlFor="teamFile" className="sr-only">Upload Team Spreadsheet</Label>
                        <div className="relative">
                          <Input
                            id="teamFile"
                            type="file"
                            accept=".csv,.xls,.xlsx"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("teamFile")?.click()}
                            className="w-full justify-start"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {formData.teamMembersFile 
                              ? `Uploaded: ${formData.teamMembersFile.name}`
                              : "Upload Completed Template"
                            }
                          </Button>
                        </div>
                      </div>
                    </div>

                    {formData.teamMembersFile && (
                      <div className="bg-background rounded border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">{formData.teamMembersFile.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {(formData.teamMembersFile.size / 1024).toFixed(1)} KB
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateFormData("teamMembersFile", null)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Template includes: Name, Title/Role, Email, Phone, License/Cert Number, License States, Specialties, Experience</p>
                      <p>• Accepted formats: CSV, Excel (.xls, .xlsx)</p>
                      <p>• Maximum file size: 5MB</p>
                      <p>• All team members will be verified individually based on their roles</p>
                      <p>• Examples: Loan Officers, Home Inspectors, Insurance Agents, Title Reps, Sales Staff, etc.</p>
                    </div>
                  </div>
                </div>

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
              <div className="pt-8 animate-fade-in">
                <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-xl p-6 border border-primary/10">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:scale-100 h-12 text-lg font-semibold"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin"></div>
                        <span>Submitting Application...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Submit Application</span>
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </div>
                    )}
                  </Button>
                  <div className="text-center mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      🚀 We'll review your application and respond within 24-48 hours
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Our team carefully reviews each application to ensure quality partnerships
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};