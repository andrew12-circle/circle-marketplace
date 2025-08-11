import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import circleLogo from "@/assets/circle-logo.png";
export const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const handleSubscription = async (plan: "pro") => {
    try {
      setLoading(plan);
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        // Redirect to signup mode for a smoother user experience
        window.location.href = '/auth?mode=signup';
        return;
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          plan
        }
      });
      if (error) throw error;
      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      // Handle subscription error without exposing details
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={circleLogo} alt="Circle Logo" className="w-10 h-10" />
            </Link>
            <div className="flex items-center gap-4">
              {user ? <>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                    Marketplace
                  </Link>
                  <Button asChild className="bg-gradient-to-r from-circle-primary to-circle-primary-light text-white">
                    <Link to="/profile-settings">Profile</Link>
                  </Button>
                </> : <>
                  <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                    Login
                  </Link>
                  <Button asChild className="bg-gradient-to-r from-circle-primary to-circle-primary-light text-white">
                    <Link to="/auth?mode=signup">Join Free & Explore</Link>
                  </Button>
                </>}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            The Smarter Way to Grow Your Real Estate Business
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 md:mb-12">
            Unlock exclusive vendor pricing, side-by-side comparisons, and curated services built for agents. Plus, get training and resources that meet you exactly where you are — all in one place.
          </p>
          
          <div className="inline-block">
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-4 py-2">
              For Real Estate Agents
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pb-12 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Find the Plan That's Right for You</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're just getting started or scaling a top-producing team, Circle has a plan to help you grow.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Mobile: Stacked Pricing Cards */}
            <div className="md:hidden space-y-6 mb-12">
              {/* Circle Starter */}
              <div className="bg-white rounded-lg border p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Circle Starter</h3>
                <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Take a Look Around — Retail Rates Shown</p>
                {user ? <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
                    <Link to="/">Go to Marketplace</Link>
                  </Button> : <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
                    <Link to="/auth?mode=signup">Create Free Account</Link>
                  </Button>}
              </div>

              {/* Circle Pro - Most Popular */}
              <div className="bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6 text-center relative">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  Most Popular
                </Badge>
                <h3 className="text-xl font-semibold mb-2">Circle Pro</h3>
                <div className="text-3xl font-bold mb-4">$97<span className="text-sm font-normal text-muted-foreground">/agent/month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Per agent pricing that scales with your team</p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" onClick={() => handleSubscription("pro")} disabled={loading === "pro"}>
                  {loading === "pro" ? "Loading..." : "Start Your Free Trial"}
                </Button>
              </div>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[auto_1fr_1fr] gap-0 mb-8">
                <div></div> {/* Empty space to align with Features column */}
                <div className="grid grid-cols-2 gap-6 col-span-2">
                
                {/* Circle Starter */}
                <div className="bg-white rounded-lg border p-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">Circle Starter</h3>
                  <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <p className="text-sm text-muted-foreground mb-6">Take a Look Around — Retail Rates Shown</p>
                  {user ? <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
                      <Link to="/">Go to Marketplace</Link>
                    </Button> : <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
                      <Link to="/auth?mode=signup">Create Free Account</Link>
                    </Button>}
                </div>

                {/* Circle Pro - Most Popular */}
                <div className="bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6 text-center relative">
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                  <h3 className="text-xl font-semibold mb-2">Circle Pro</h3>
                  <div className="text-3xl font-bold mb-4">$97<span className="text-sm font-normal text-muted-foreground">/agent/month</span></div>
                  <p className="text-sm text-muted-foreground mb-6">Unlock Pro Pricing & Vendor Support Get exclusive rates, expert vendor help, and curated content — all backed by marketplace insights tailored to your stage of business. We meet you where you are and help take you where you want to go.</p>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" onClick={() => handleSubscription("pro")} disabled={loading === "pro"}>
                    {loading === "pro" ? "Loading..." : "Start Your Free Trial"}
                  </Button>
                </div>
               </div>
              </div>
            </div>

            {/* Mobile: Simplified Feature Comparison */}
            <div className="md:hidden space-y-4">
              <h3 className="text-xl font-bold text-center mb-6">Feature Comparison</h3>
              
              {[{
              feature: "Marketplace Access",
              starter: "✓",
              pro: "✓"
            }, {
              feature: "Circle Points",
              starter: "None",
              pro: "100 to start + 500/month"
            }, {
              feature: "Circle Coverage",
              starter: "✗",
              pro: "✓"
            }, {
              feature: "Pro Pricing (Avg. 20% off)",
              starter: "✗",
              pro: "✓"
            }, {
              feature: "CoPay Access (60% avg. discount)",
              starter: "✗",
              pro: "✓"
            }, {
              feature: "Circle Academy Access",
              starter: "Limited",
              pro: "Full Library"
            }, {
              feature: "Create & Sell Playbooks",
              starter: "✗",
              pro: "✓"
            }, {
              feature: "Earn Creator Revenue",
              starter: "✗",
              pro: "✓"
            }, {
              feature: "Analytics & Reporting",
              starter: "✗",
              pro: "Advanced"
            }, {
              feature: "Team Management",
              starter: "✗",
              pro: "✓"
            }, {
              feature: "Priority Support",
              starter: "✗",
              pro: "✓"
            }].map((item, index) => <div key={index} className="bg-white rounded-lg border p-4">
                  <h4 className="font-medium mb-3">{item.feature}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Starter</div>
                      <div className={item.starter === "✓" ? "text-green-600" : item.starter === "✗" ? "text-gray-400" : ""}>
                        {item.starter}
                      </div>
                    </div>
                    <div className="text-center bg-blue-50 rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">Pro</div>
                      <div className={item.pro === "✓" ? "text-green-600" : item.pro === "✗" ? "text-gray-400" : ""}>
                        {item.pro}
                      </div>
                    </div>
                  </div>
                </div>)}
            </div>

            {/* Desktop: Features Comparison Table */}
            <div className="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-0">
                {/* Header Row */}
                <div className="bg-muted/50 p-6 border-r border-b">
                  <span className="font-bold text-lg text-foreground">Features</span>
                </div>
                <div className="p-6 border-r border-b text-center">
                  <div className="font-bold text-lg text-foreground">Circle Starter</div>
                  <div className="text-sm text-muted-foreground mt-1">Free</div>
                </div>
                <div className="p-6 border-b text-center bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-visible">
                  <div className="font-bold text-lg text-foreground">Circle Pro</div>
                  <div className="text-sm text-blue-600 font-semibold mt-1">$97/month</div>
                  
                </div>

                {/* Features */}
                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">Marketplace Access</span>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>


                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">Circle Coverage</span>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>

                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">Pro Pricing</span>
                  <div className="text-sm text-muted-foreground">(Avg. 20% off)</div>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>

                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">CoPay Access</span>
                  <div className="text-sm text-muted-foreground">(60% avg. discount)</div>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>

                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">Circle Academy Access</span>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <span className="text-muted-foreground font-medium">Limited</span>
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <span className="text-foreground font-semibold">Full Library</span>
                </div>

                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">Create & Sell Playbooks</span>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>

                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">Earn Creator Revenue</span>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>

                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">Analytics & Reporting</span>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <span className="text-foreground font-semibold">Advanced</span>
                </div>

                <div className="bg-muted/30 p-4 border-r border-b">
                  <span className="font-semibold text-foreground">Team Management</span>
                </div>
                <div className="p-4 border-r border-b text-center bg-card">
                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                </div>
                <div className="p-4 border-b text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>

                <div className="bg-muted/30 p-4 border-r rounded-bl-xl">
                  <span className="font-semibold text-foreground">Priority Support</span>
                </div>
                <div className="p-4 border-r text-center bg-card">
                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                </div>
                <div className="p-4 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-br-xl">
                  <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};