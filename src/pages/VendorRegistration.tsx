import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SecureForm } from "@/components/common/SecureForm";
import { useSecureInput, ValidationRules, commonRules } from "@/hooks/useSecureInput";
import { useToast } from "@/hooks/use-toast";
import { Building2, Crown, ArrowLeft, ShoppingBag, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const VendorRegistration = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [vendorType, setVendorType] = useState<'service_provider' | 'co_marketing'>('service_provider');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Check URL parameters and auto-select vendor type
  useEffect(() => {
    console.log('VendorRegistration component mounted');
    console.log('Search params:', searchParams.toString());
    const typeParam = searchParams.get('type');
    console.log('Type param:', typeParam);
    if (typeParam === 'service_provider' || typeParam === 'co_marketing') {
      setVendorType(typeParam);
      setStep('form'); // Skip type selection and go directly to form
      console.log('Auto-selected vendor type:', typeParam);
    }
  }, [searchParams]);

  const handleTypeSelection = (type: 'service_provider' | 'co_marketing') => {
    setVendorType(type);
    setStep('form');
  };

  const handleSecureSubmit = async (data: Record<string, string>) => {
    setLoading(true);
    
    try {
      // First, create user account if not logged in
      let userId = user?.id;
      
      if (!userId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/vendor-dashboard`,
            data: {
              full_name: data.companyName,
              is_vendor: true
            }
          }
        });

        if (authError) {
          toast({
            title: "Registration Failed",
            description: authError.message,
            variant: "destructive",
          });
          return;
        }

        userId = authData.user?.id;
      }

      if (!userId) {
        throw new Error("Failed to create user account");
      }

      // Update profile with vendor information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          vendor_enabled: true,
          vendor_type: vendorType,
          vendor_company_name: data.companyName,
          vendor_description: data.description,
          business_name: data.companyName,
          phone: data.phone || null,
          website_url: data.website || null,
          location: data.location || null,
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Continue anyway - the main account creation succeeded
      }

      // Create vendor profile via edge function (optional - for legacy compatibility)
      const { error: inviteError } = await supabase.functions.invoke('invite-vendor', {
        body: {
          name: data.companyName,
          description: data.description,
          contact_email: data.email,
          phone: data.phone || null,
          website_url: data.website || null,
          location: data.location || null,
          vendor_type: vendorType === 'service_provider' ? 'company' : 'co_marketing',
          specialties: data.specialties ? data.specialties.split(',').map(s => s.trim()) : [],
          service_areas: data.serviceAreas ? data.serviceAreas.split(',').map(s => s.trim()) : [],
          experience_years: data.experience ? parseInt(data.experience) : null,
          nmls_id: data.nmlsId || null
        }
      });

      if (inviteError) {
        toast({
          title: "Vendor Registration Failed",
          description: inviteError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Registration Successful!",
        description: vendorType === 'service_provider' 
          ? "Your service provider account has been created. You can now list your services."
          : "Your co-marketing account has been created. You can now access partnership opportunities.",
      });

      // Redirect to appropriate dashboard
      navigate('/vendor-dashboard');
      
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'type') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold mb-2">Join Circle as a Business Partner</h1>
            <p className="text-muted-foreground">Choose how you'd like to participate in our marketplace</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Service Provider Option */}
            <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50" 
                  onClick={() => handleTypeSelection('service_provider')}>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Service Provider</CardTitle>
                <CardDescription>
                  List and sell your professional services to real estate agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Create service listings</li>
                  <li>• Set your own pricing</li>
                  <li>• Manage bookings and consultations</li>
                  <li>• Reach real estate professionals</li>
                  <li>• Track revenue and analytics</li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Get Started as Service Provider
                </Button>
              </CardContent>
            </Card>

            {/* Co-Marketing Option */}
            <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50" 
                  onClick={() => handleTypeSelection('co_marketing')}>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl">Co-Marketing Partner</CardTitle>
                <CardDescription>
                  Partner with agents for lead generation and co-marketing opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Access agent partnerships</li>
                  <li>• Co-marketing campaigns</li>
                  <li>• Lead sharing opportunities</li>
                  <li>• Lender/mortgage partnerships</li>
                  <li>• Marketing collaboration tools</li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Join as Co-Marketing Partner
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const validationRules: ValidationRules = {
    email: !user ? { required: true, custom: (value) => {
      const emailResult = commonRules.email.custom?.(value);
      return typeof emailResult === 'string' ? emailResult : null;
    } } : {},
    password: !user ? { required: true, minLength: 6 } : {},
    companyName: { required: true, minLength: 2, maxLength: 100 },
    description: { required: true, minLength: 10, maxLength: 1000 },
    phone: { custom: (value) => {
      if (!value) return null;
      const phoneResult = commonRules.phone.custom?.(value);
      return typeof phoneResult === 'string' ? phoneResult : null;
    } },
    website: { custom: (value) => {
      if (!value) return null;
      const urlResult = commonRules.url.custom?.(value);
      return typeof urlResult === 'string' ? urlResult : null;
    } },
    location: { maxLength: 100 },
    specialties: vendorType === 'service_provider' ? { required: true } : {},
    serviceAreas: { maxLength: 500 },
    experience: {},
    nmlsId: vendorType === 'co_marketing' ? { required: true } : {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => setStep('type')}
            className="w-fit mx-auto mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Selection
          </Button>
          
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {vendorType === 'service_provider' ? (
              <ShoppingBag className="w-8 h-8 text-primary" />
            ) : (
              <Briefcase className="w-8 h-8 text-accent-foreground" />
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {vendorType === 'service_provider' 
              ? 'Service Provider Registration' 
              : 'Co-Marketing Partner Registration'
            }
          </CardTitle>
          <CardDescription>
            {vendorType === 'service_provider'
              ? 'Create your business profile and start listing services'
              : 'Join our co-marketing network for partnership opportunities'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <SecureForm
            onSubmit={handleSecureSubmit}
            validationRules={validationRules}
            className="space-y-4"
          >
            {!user && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="company@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                Company/Business Name *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your Business Name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Business Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe your business and what you offer..."
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Business Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="City, State"
              />
            </div>

            {vendorType === 'service_provider' && (
              <div>
                <label htmlFor="specialties" className="block text-sm font-medium mb-2">
                  Services/Specialties *
                </label>
                <input
                  type="text"
                  id="specialties"
                  name="specialties"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Marketing, Lead Generation, CRM Setup (comma separated)"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="serviceAreas" className="block text-sm font-medium mb-2">
                Service Areas
              </label>
              <input
                type="text"
                id="serviceAreas"
                name="serviceAreas"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="States or regions you serve (comma separated)"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="experience" className="block text-sm font-medium mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="5"
                />
              </div>

              {vendorType === 'co_marketing' && (
                <div>
                  <label htmlFor="nmlsId" className="block text-sm font-medium mb-2">
                    NMLS ID *
                  </label>
                  <input
                    type="text"
                    id="nmlsId"
                    name="nmlsId"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1234567"
                    required
                  />
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </SecureForm>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorRegistration;