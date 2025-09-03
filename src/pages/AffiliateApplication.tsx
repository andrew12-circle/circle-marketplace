import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { LegalFooter } from "@/components/LegalFooter";

export const AffiliateApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    legal_name: "",
    business_name: "",
    email: user?.email || "",
    country: "",
    website: "",
    marketing_channels: "",
    promotion_plan: "",
    agreed_to_terms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreed_to_terms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    if (!user) {
      toast.error("Please sign in to apply");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("affiliates")
        .insert({
          user_id: user.id,
          legal_name: formData.legal_name,
          business_name: formData.business_name || null,
          email: formData.email,
          country: formData.country,
          website: formData.website || null,
          marketing_channels: formData.marketing_channels,
          onboarding_status: "pending_kyc",
          status: "active"
        });

      if (error) throw error;

      toast.success("Application submitted successfully!");
      navigate("/affiliate/dashboard");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/affiliate">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Program Info
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Join Circle Network</h1>
          <p className="text-muted-foreground">
            Complete your application to start earning commissions by sharing Circle tools.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Affiliate Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legal_name">Legal Name *</Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
                    required
                    placeholder="Your full legal name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="business_name">Business Name (Optional)</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Your company or brand name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <Label htmlFor="marketing_channels">Primary Marketing Channels *</Label>
                <Select
                  value={formData.marketing_channels}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, marketing_channels: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How will you promote Circle?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email_marketing">Email Marketing</SelectItem>
                    <SelectItem value="content_creation">Content Creation / Blogging</SelectItem>
                    <SelectItem value="coaching_speaking">Coaching & Speaking</SelectItem>
                    <SelectItem value="networking">Networking & Referrals</SelectItem>
                    <SelectItem value="paid_advertising">Paid Advertising</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="promotion_plan">How do you plan to promote Circle? *</Label>
                <Textarea
                  id="promotion_plan"
                  value={formData.promotion_plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, promotion_plan: e.target.value }))}
                  required
                  placeholder="Tell us about your audience and how you plan to share Circle tools (2-3 sentences)"
                  rows={4}
                />
              </div>

              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">Quick Program Summary</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 20% recurring commission on Circle Pro ($97/month) for 12 months</li>
                  <li>• 10% lifetime commission on marketplace purchases</li>
                  <li>• $50 minimum payout, paid monthly on the 15th</li>
                  <li>• 30-day attribution window</li>
                  <li>• Ready-made marketing assets provided</li>
                </ul>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreed_to_terms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreed_to_terms: checked as boolean }))
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    Affiliate Program Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">
                    Marketing Guidelines
                  </a>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !formData.agreed_to_terms}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            After submitting, you'll receive an email confirmation. Most applications 
            are reviewed within 2-3 business days.
          </p>
        </div>
      </div>
      </div>
      
      <LegalFooter />
    </div>
  );
};