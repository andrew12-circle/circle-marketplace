
import { useState, useEffect } from "react";
import { Check, Crown, Sparkles, Users, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CircleProBanner } from "@/components/marketplace/CircleProBanner";
import { CustomerPortalButton } from "@/components/marketplace/CustomerPortalButton";
import { useFunnelEvents } from "@/hooks/useFunnelEvents";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackTrialClick } = useFunnelEvents();
  const [loading, setLoading] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        // Check if user has an active subscription in profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_tier')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching subscription:', error);
        } else if (data) {
          setHasActiveSubscription(
            data.subscription_status === 'active' || 
            data.subscription_tier === 'pro'
          );
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    checkSubscription();
  }, [user]);

  const handleStartTrial = async () => {
    // Track the trial click event
    trackTrialClick();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { plan: 'pro' }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
            <Crown className="w-4 h-4 mr-2" />
            Circle Pro Membership
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Accelerate Your Real Estate Success
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join Circle Pro and unlock exclusive vendor partnerships, co-pay opportunities, and premium tools designed to maximize your earnings.
          </p>
        </div>

        <CircleProBanner />

        {/* Main Pricing Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-blue-200 shadow-xl relative overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 opacity-50"></div>
            
            <CardHeader className="relative text-center pb-8">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                <Crown className="w-6 h-6" />
                <Sparkles className="w-6 h-6" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Circle Pro</CardTitle>
              <p className="text-gray-600 mt-2">Everything you need to dominate your market</p>
              
              <div className="mt-6">
                <div className="text-5xl font-bold text-gray-900">$97</div>
                <div className="text-lg text-gray-600">/month after 30-day free trial</div>
                <Badge className="mt-3 bg-green-100 text-green-800 border-green-200">
                  30-Day Free Trial
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="relative">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Core Benefits */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Vendor Co-Pay Program
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Get vendors to pay 50-80% of your marketing costs",
                      "Access to 500+ verified vendor partners",
                      "Automated RESPA-compliant agreements",
                      "Real-time co-pay request tracking"
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Premium Tools */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    Premium Tools & Analytics
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Command Center performance dashboard",
                      "Agent playbook library access",
                      "Market intelligence reports",
                      "Priority customer support"
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ROI Highlight */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Typical ROI</h3>
                <p className="text-green-700">
                  Members typically save $500-2,000 monthly on marketing costs through vendor co-pays, 
                  making Circle Pro pay for itself <strong>5-20x over</strong>.
                </p>
              </div>

              {/* CTA Section */}
              <div className="text-center">
                {hasActiveSubscription ? (
                  <div className="space-y-4">
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-lg py-2 px-4">
                      <Check className="w-5 h-5 mr-2" />
                      Active Circle Pro Member
                    </Badge>
                    <p className="text-gray-600">
                      You're all set! Enjoy your Circle Pro benefits.
                    </p>
                    <CustomerPortalButton />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      size="lg" 
                      className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={handleStartTrial}
                      disabled={loading}
                    >
                      {loading ? (
                        "Starting Trial..."
                      ) : (
                        <>
                          <ArrowRight className="w-5 h-5 mr-2" />
                          Start Your Free 30-Day Trial
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-gray-500">
                      No commitment • Cancel anytime • RESPA compliant
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "How does the vendor co-pay program work?",
                a: "You request co-pay support for marketing expenses, and vendors bid to cover 50-80% of costs in exchange for referrals. All agreements are RESPA-compliant and managed through our platform."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time through your account settings or the customer portal. Your access continues until the end of your billing period."
              },
              {
                q: "Is this RESPA compliant?",
                a: "Absolutely. Our legal team ensures all vendor relationships and co-pay arrangements comply with RESPA regulations. We provide proper documentation for all transactions."
              },
              {
                q: "What if I don't get vendor co-pay approvals?",
                a: "We guarantee you'll see value. Our success team works with you to optimize your requests and connect with the right vendors for your market."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
