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
import { ArrowLeft, Building, User, MapPin, Phone, Mail, Globe, CreditCard, Download, Upload, FileSpreadsheet, Calendar, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SERVICE_PROVIDER_TYPES = [
  { value: "marketing_tools", label: "Marketing Tools & Platforms" },
  { value: "signs_materials", label: "Signs & Marketing Materials" },
  { value: "crm_software", label: "CRM & Contact Management" },
  { value: "lead_generation", label: "Lead Generation Services" },
  { value: "website_design", label: "Website Design & Development" },
  { value: "social_media", label: "Social Media Management" },
  { value: "photography", label: "Photography & Virtual Tours" },
  { value: "staging_services", label: "Home Staging Services" },
  { value: "printing_services", label: "Printing & Design Services" },
  { value: "coaching_training", label: "Coaching & Training" },
  { value: "transaction_management", label: "Transaction Management" },
  { value: "other_services", label: "Other Real Estate Services" }
];

const COMARKETING_PARTNER_TYPES = [
  { value: "lender", label: "Mortgage Lender" },
  { value: "title", label: "Title Company" },
  { value: "insurance", label: "Insurance Agency" },
  { value: "home_warranty", label: "Home Warranty" },
  { value: "inspection", label: "Home Inspection" },
  { value: "moving", label: "Moving Company" },
  { value: "handyman", label: "Handyman/Contractor" },
  { value: "real_estate", label: "Real Estate Agent/Broker" },
  { value: "attorney", label: "Real Estate Attorney" },
  { value: "appraiser", label: "Property Appraiser" },
  { value: "other", label: "Other Professional Service" }
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
    // Authentication Info
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    
    // Business Type
    businessType: "",
    
    // Company Info
    companyName: "",
    individualName: "",
    individualTitle: "",
    description: "",
    
    // Contact Info
    phone: "",
    individualEmail: "",
    individualPhone: "",
    websiteUrl: "",
    calendarLink: "",
    
    // Service Provider Specific (for products/services TO realtors)
    productCategories: [] as string[],
    pricingModel: "",
    productCatalog: "",
    shippingInfo: "",
    supportInfo: "",
    
    // Co-Marketing Partner Specific (for professional service providers)
    location: "",
    serviceStates: [] as string[],
    serviceZipCodes: "",
    serviceRadiusMiles: "",
    licenseNumber: "",
    nmlsId: "",
    licenseStates: [] as string[],
    marketingBudget: "",
    
    // Team Members (both types can use this)
    teamMembersFile: null as File | null,
    
    // Terms
    agreeToTerms: false,
    agreeToBackground: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const formatWebsite = (value: string) => {
    // Don't add https:// if it's empty or already has a protocol
    if (!value || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    return `https://${value}`;
  };

  const updateFormData = (field: string, value: any) => {
    // Apply phone formatting for phone fields
    if (field === "phone" && typeof value === "string") {
      value = formatPhoneNumber(value);
    }
    
    // Apply website formatting for website fields
    if (field === "website" && typeof value === "string") {
      value = formatWebsite(value);
    }
    
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

  const handleNationwideToggle = (field: "serviceStates" | "licenseStates") => {
    const currentStates = formData[field];
    const isNationwide = currentStates.length === US_STATES.length;
    
    // If already nationwide (all states selected), clear all. Otherwise, select all.
    const newStates = isNationwide ? [] : [...US_STATES];
    updateFormData(field, newStates);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Authentication validation
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.fullName) newErrors.fullName = "Full name is required";

    // Business validation
    if (!formData.businessType) newErrors.businessType = "Please select a business type";
    if (!formData.companyName && !formData.individualName) {
      newErrors.companyName = "Company name or individual name is required";
    }
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.calendarLink) newErrors.calendarLink = "Calendar booking link is required";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms";
    
    // Service Provider specific validation
    if (registrationType === "service_provider") {
      if (formData.productCategories.length === 0) {
        newErrors.productCategories = "Please select at least one product category";
      }
      if (!formData.pricingModel) newErrors.pricingModel = "Please select a pricing model";
    }
    
    // Co-marketing specific validation
    if (registrationType === "co_marketing") {
      if (!formData.location) newErrors.location = "Location is required";
      if (!formData.marketingBudget) newErrors.marketingBudget = "Marketing budget is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted, validating...", formData);
    
    if (!validateForm()) {
      console.log("Validation failed, errors:", errors);
      toast({
        title: "Please fix the errors below",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Validation passed, submitting...");
    setIsSubmitting(true);
    
    try {
      // Step 1: Create user account
      const redirectUrl = `${window.location.origin}/vendor-dashboard`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
            is_vendor: true,
            vendor_type: registrationType,
          }
        }
      });

      if (authError) throw authError;

      // Step 2: If user creation successful, show success message
      if (authData.user) {
        toast({
          title: "Account Created Successfully!",
          description: "Welcome! You can now start creating your services and funnel pages.",
        });
        
        // Set flag for new registration to bypass auth check temporarily
        sessionStorage.setItem('new_vendor_registration', 'true');
        
        // Navigate to vendor dashboard
        navigate("/vendor-dashboard");
      }
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.message?.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Please use a different email or sign in.";
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = "Password should be at least 6 characters long.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
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

          <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm animate-scale-in overflow-hidden">
            <CardHeader className="text-center relative pb-8 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm shadow-lg border border-white/30">
                    <Building className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-sm">
                  {registrationType === "co_marketing" 
                    ? "Co-Marketing Partner Registration" 
                    : "Service Provider Registration"
                  }
                </CardTitle>
                <CardDescription className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
                  {registrationType === "co_marketing" 
                    ? "Partner with real estate professionals to co-fund marketing campaigns and grow your business through strategic collaborations"
                    : "List your products and services in our marketplace for real estate professionals. Sell marketing tools, CRMs, signs, and more to agents and brokers"
                  }
                </CardDescription>
                {registrationType === "co_marketing" && (
                  <div className="flex justify-center mt-4">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-1 backdrop-blur-sm">
                      🤝 Co-Marketing Partner Application
                    </Badge>
                  </div>
                )}
                {registrationType === "service_provider" && (
                  <div className="flex justify-center mt-4">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-1 backdrop-blur-sm">
                      🛒 Service Provider Application
                    </Badge>
                  </div>
                )}
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Account Creation Section */}
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/10">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Create Your Account</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => updateFormData("fullName", e.target.value)}
                        placeholder="John Smith"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        placeholder="john@company.com"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground">
                        Password * (min. 6 characters)
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => updateFormData("password", e.target.value)}
                          placeholder="Enter password"
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.password}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                          placeholder="Confirm password"
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Type Selection */}
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {registrationType === "co_marketing" ? "Professional Service Type" : "Product/Service Category"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(registrationType === "co_marketing" ? COMARKETING_PARTNER_TYPES : SERVICE_PROVIDER_TYPES).map((type, index) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={formData.businessType === type.value ? "default" : "outline"}
                        onClick={() => updateFormData("businessType", type.value)}
                        className={`justify-start h-auto p-4 transition-all duration-300 hover-scale group ${
                          formData.businessType === type.value 
                            ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg" 
                            : "hover:bg-secondary/50 hover:border-primary/30"
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="text-sm font-medium">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                  {errors.businessType && (
                    <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                      {errors.businessType}
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
                    <div className="space-y-2">
                      <Label htmlFor="calendarLink" className="text-sm font-medium text-foreground flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Calendar Booking Link *
                      </Label>
                      <Input
                        id="calendarLink"
                        value={formData.calendarLink}
                        onChange={(e) => updateFormData("calendarLink", e.target.value)}
                        placeholder="https://calendly.com/yourname or https://cal.com/yourname"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://calendly.com/signup', '_blank')}
                        className="w-fit text-xs"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Create Free Calendly Account
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {registrationType === "service_provider" 
                          ? "Realtors will use this to book demos, consultations, and onboarding calls"
                          : "Realtors will use this to book consultation calls and partnership meetings"
                        }
                      </p>
                      {errors.calendarLink && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.calendarLink}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Provider Specific Fields */}
                {registrationType === "service_provider" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-primary/10">
                        <CreditCard className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Service Details</h3>
                    </div>
                    
                    {/* Product Categories */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-foreground">
                        Product/Service Categories * (Select all that apply)
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SERVICE_PROVIDER_TYPES.map((type, index) => (
                          <Button
                            key={type.value}
                            type="button"
                            variant={formData.productCategories.includes(type.value) ? "default" : "outline"}
                            onClick={() => {
                              const newCategories = formData.productCategories.includes(type.value)
                                ? formData.productCategories.filter(c => c !== type.value)
                                : [...formData.productCategories, type.value];
                              updateFormData("productCategories", newCategories);
                            }}
                            className={`justify-start h-auto p-4 transition-all duration-300 hover-scale group ${
                              formData.productCategories.includes(type.value)
                                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg" 
                                : "hover:bg-secondary/50 hover:border-primary/30"
                            }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <span className="text-sm font-medium">{type.label}</span>
                          </Button>
                        ))}
                      </div>
                      {errors.productCategories && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.productCategories}
                        </p>
                      )}
                    </div>

                    {/* Pricing Model */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-foreground">
                        Pricing Model *
                      </Label>
                      <Select value={formData.pricingModel} onValueChange={(value) => updateFormData("pricingModel", value)}>
                        <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50">
                          <SelectValue placeholder="Select your pricing model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subscription">Monthly/Annual Subscription</SelectItem>
                          <SelectItem value="one_time">One-time Purchase</SelectItem>
                          <SelectItem value="per_use">Pay-per-Use/Transaction</SelectItem>
                          <SelectItem value="freemium">Freemium (Free + Premium Tiers)</SelectItem>
                          <SelectItem value="custom">Custom Pricing</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.pricingModel && (
                        <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                          {errors.pricingModel}
                        </p>
                      )}
                    </div>
                  </div>
                )}

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
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">States You Service</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleNationwideToggle("serviceStates")}
                        className={`transition-all duration-300 ${
                          formData.serviceStates.length === US_STATES.length
                            ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                            : "hover:bg-primary/10 hover:border-primary/30"
                        }`}
                      >
                        {formData.serviceStates.length === US_STATES.length ? "🇺🇸 Clear All" : "🇺🇸 Nationwide"}
                      </Button>
                    </div>
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
                {(formData.businessType === "lender" || formData.businessType === "real_estate" || formData.businessType === "attorney") && registrationType === "co_marketing" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Professional Credentials</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber" className="text-sm font-medium text-foreground">
                          License Number
                        </Label>
                        <Input
                          id="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={(e) => updateFormData("licenseNumber", e.target.value)}
                          placeholder="License #"
                          className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                        />
                      </div>
                      {formData.businessType === "lender" && (
                        <div className="space-y-2">
                          <Label htmlFor="nmlsId" className="text-sm font-medium text-foreground">
                            NMLS ID
                          </Label>
                          <Input
                            id="nmlsId"
                            value={formData.nmlsId}
                            onChange={(e) => updateFormData("nmlsId", e.target.value)}
                            placeholder="NMLS #"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-foreground">Licensed States</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleNationwideToggle("licenseStates")}
                          className={`transition-all duration-300 ${
                            formData.licenseStates.length === US_STATES.length
                              ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                              : "hover:bg-primary/10 hover:border-primary/30"
                          }`}
                        >
                          {formData.licenseStates.length === US_STATES.length ? "🇺🇸 Clear All" : "🇺🇸 Nationwide"}
                        </Button>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-4 border border-secondary/50">
                        <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                          {US_STATES.map((state, index) => (
                            <Button
                              key={state}
                              type="button"
                              variant={formData.licenseStates.includes(state) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStateToggle("licenseStates", state)}
                              className={`h-10 text-xs font-medium transition-all duration-300 ${
                                formData.licenseStates.includes(state)
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
                  </div>
                )}

                {/* Team Members Upload Section - For All Vendor Types */}
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/10 to-accent/10">
                      <FileSpreadsheet className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Team Members Registration</h3>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-6 border border-secondary/30 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Upload details for all team members, agents, representatives, or staff who will be working under your company. 
                      This could include loan officers, inspectors, agents, sales reps, or any other team members who provide services.
                    </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadTeamTemplate}
                          className="flex items-center transition-all duration-300 hover:bg-primary/10 hover:border-primary/30"
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
                              className="w-full justify-start transition-all duration-300 hover:bg-primary/10 hover:border-primary/30"
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
                        <div className="bg-background rounded border p-3 animate-fade-in">
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
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground space-y-1 bg-accent/5 p-3 rounded-md border border-accent/20">
                        <p>• Template includes: Name, Title/Role, Email, Phone, License/Cert Number, License States, Specialties, Experience</p>
                        <p>• Accepted formats: CSV, Excel (.xls, .xlsx)</p>
                        <p>• Maximum file size: 5MB</p>
                        <p>• All team members will be verified individually based on their roles</p>
                        <p>• Examples: Loan Officers, Home Inspectors, Insurance Agents, Title Reps, Sales Staff, etc.</p>
                      </div>
                    </div>
                  </div>

              {/* Co-Marketing Specific Fields */}
              {registrationType === "co_marketing" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-primary/10">
                      <CreditCard className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Co-Marketing Information</h3>
                  </div>
                  <div className="bg-accent/5 rounded-lg p-6 border border-accent/20">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="marketingBudget" className="text-sm font-medium text-foreground">
                          Monthly Marketing Budget *
                        </Label>
                        <Select value={formData.marketingBudget} onValueChange={(value) => updateFormData("marketingBudget", value)}>
                          <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50">
                            <SelectValue placeholder="Select your monthly marketing investment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under_1000">Under $1,000</SelectItem>
                            <SelectItem value="1000_2500">$1,000 - $2,500</SelectItem>
                            <SelectItem value="2500_5000">$2,500 - $5,000</SelectItem>
                            <SelectItem value="5000_10000">$5,000 - $10,000</SelectItem>
                            <SelectItem value="over_10000">Over $10,000</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.marketingBudget && (
                          <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                            {errors.marketingBudget}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                        <p className="font-medium text-blue-900 mb-1">🎯 Target Audience: Real Estate Professionals</p>
                        <p className="text-blue-700">Your co-marketing efforts will focus on real estate agents, brokers, and homebuyers in your service area.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                {/* Terms and Conditions */}
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Terms & Agreements</h3>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-6 border border-primary/20 space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => updateFormData("agreeToTerms", checked)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="agreeToTerms" className="text-sm leading-tight text-foreground">
                        I agree to the Terms of Service, Privacy Policy, and Vendor Agreement. I understand the platform fees and commission structure.
                      </Label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-destructive animate-fade-in bg-destructive/10 p-2 rounded-md border border-destructive/20">
                        {errors.agreeToTerms}
                      </p>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToBackground"
                        checked={formData.agreeToBackground}
                        onCheckedChange={(checked) => updateFormData("agreeToBackground", checked)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="agreeToBackground" className="text-sm leading-tight text-foreground">
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
                      onClick={() => console.log("Button clicked!", { isSubmitting, formData })}
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