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
                    {loading === "pro" ? "Loading..." : "Start Your Free 30-Day Trial"}
                  </Button>
                </div>
               </div>
              </div>
            </div>

            {/* Mobile: Enhanced Feature Comparison */}
            <div className="md:hidden space-y-3">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Compare Plans
                </h3>
                <p className="text-sm text-muted-foreground">See everything you get with Circle Pro</p>
              </div>
              
              {[{
              feature: "Marketplace Access",
              starter: "✓",
              pro: "✓",
              category: "core"
            }, {
              feature: "Circle Coverage",
              starter: "✗",
              pro: "✓",
              category: "core"
            }, {
              feature: "Pro Pricing (Avg. 20% off)",
              starter: "✗",
              pro: "✓",
              category: "core"
            }, {
              feature: "CoPay Access (60% avg. discount)",
              starter: "✗",
              pro: "✓",
              category: "core"
            }, {
              feature: "Circle Academy Access",
              starter: "Limited",
              pro: "Full Library",
              category: "core"
            }, {
              feature: "Create & Sell Playbooks",
              starter: "✗",
              pro: "✓",
              category: "business"
            }, {
              feature: "Earn Creator Revenue",
              starter: "✗",
              pro: "✓",
              category: "business"
            }, {
              feature: "Analytics & Reporting",
              starter: "✗",
              pro: "Advanced",
              category: "business"
            }, {
              feature: "Team Management",
              starter: "✗",
              pro: "✓",
              category: "business"
            }, {
              feature: "Priority Support",
              starter: "✗",
              pro: "✓",
              category: "business"
            }, {
              feature: "Fuel Discount — $0.15/gallon",
              starter: "✗",
              pro: "✓ ($180/year)",
              category: "lifestyle",
              badge: "Coming Soon"
            }, {
              feature: "Tire Discounts & Free Rotations",
              starter: "✗",
              pro: "✓ ($100/year)",
              category: "lifestyle",
              badge: "Coming Soon"
            }, {
              feature: "Car Maintenance Savings",
              starter: "✗",
              pro: "✓ ($75/year)",
              category: "lifestyle",
              badge: "Coming Soon"
            }, {
              feature: "Auto Insurance Discounts",
              starter: "✗",
              pro: "✓ ($120/year)",
              category: "lifestyle",
              badge: "Coming Soon"
            }, {
              feature: "Coffee Credits",
              starter: "✗",
              pro: "✓ ($300/year)",
              category: "lifestyle",
              badge: "Coming Soon"
            }].map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.feature}</h4>
                      {item.badge && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                      <div className="text-xs font-medium text-gray-600 mb-2">Starter</div>
                      <div className={`text-sm font-semibold ${
                        item.starter === "✓" ? "text-emerald-600" : 
                        item.starter === "✗" ? "text-gray-400" : 
                        "text-gray-700"
                      }`}>
                        {item.starter === "✓" ? (
                          <Check className="w-5 h-5 mx-auto" />
                        ) : item.starter === "✗" ? (
                          <X className="w-5 h-5 mx-auto" />
                        ) : (
                          item.starter
                        )}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200/60">
                      <div className="text-xs font-medium text-blue-700 mb-2">Pro</div>
                      <div className={`text-sm font-semibold ${
                        item.pro.includes("✓") ? "text-emerald-600" : 
                        item.pro === "✗" ? "text-gray-400" : 
                        "text-blue-700"
                      }`}>
                        {item.pro.includes("✓") ? (
                          <div className="flex flex-col items-center">
                            <Check className="w-5 h-5 mb-1" />
                            {item.pro.includes("(") && (
                              <span className="text-xs text-blue-600 font-medium">
                                {item.pro.match(/\((.*?)\)/)?.[1]}
                              </span>
                            )}
                          </div>
                        ) : item.pro === "✗" ? (
                          <X className="w-5 h-5 mx-auto" />
                        ) : (
                          item.pro
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Enhanced Features Comparison Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-0">
                {/* Header Row with Gradient */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 border-r border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    <span className="font-bold text-xl text-gray-900">Features</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Compare what's included</p>
                </div>
                <div className="p-8 border-r border-gray-200 text-center bg-white">
                  <div className="font-bold text-xl text-gray-900">Circle Starter</div>
                  <div className="text-lg font-semibold text-emerald-600 mt-1">Free</div>
                  <div className="text-sm text-gray-500 mt-2">Basic access</div>
                </div>
                <div className="p-8 text-center bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="font-bold text-xl text-gray-900 mt-2">Circle Pro</div>
                  <div className="text-lg font-semibold text-blue-600 mt-1">$97/month</div>
                  <div className="text-sm text-gray-600 mt-2">Everything + lifestyle benefits</div>
                </div>

                {/* Core Features Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-r border-gray-200 col-span-3">
                  <span className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    Core Platform Features
                  </span>
                </div>

                {/* Marketplace Access */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Marketplace Access</span>
                  <div className="text-sm text-gray-600 mt-1">Browse and discover services</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>


                {/* Circle Coverage */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Circle Coverage</span>
                  <div className="text-sm text-gray-600 mt-1">Access premium features</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Pro Pricing */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Pro Pricing</span>
                  <div className="text-sm text-gray-600 mt-1">Avg. 20% off retail rates</div>
                  <div className="text-xs text-blue-600 mt-2 font-medium">Often pays for itself with one purchase</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* CoPay Access */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">CoPay Access</span>
                  <div className="text-sm text-gray-600 mt-1">60% avg. discount on select services</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Circle Academy Access */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Circle Academy Access</span>
                  <div className="text-sm text-gray-600 mt-1">Training and educational content</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Limited</span>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Full Library</span>
                </div>

                {/* Business Features Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-r border-gray-200 col-span-3">
                  <span className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    Business Growth Features
                  </span>
                </div>

                {/* Create & Sell Playbooks */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Create & Sell Playbooks</span>
                  <div className="text-sm text-gray-600 mt-1">Share your expertise and earn</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Earn Creator Revenue */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Earn Creator Revenue</span>
                  <div className="text-sm text-gray-600 mt-1">Monetize your content and expertise</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Analytics & Reporting */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Analytics & Reporting</span>
                  <div className="text-sm text-gray-600 mt-1">Track performance and ROI</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Advanced</span>
                </div>

                {/* Team Management */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Team Management</span>
                  <div className="text-sm text-gray-600 mt-1">Manage multiple team members</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Priority Support */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Priority Support</span>
                  <div className="text-sm text-gray-600 mt-1">Get help when you need it most</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Lifestyle Benefits Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-r border-gray-200 col-span-3">
                  <span className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    Lifestyle Benefits
                    <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Coming Soon</span>
                  </span>
                </div>

                {/* Fuel Discount */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Fuel Discount — $0.15 per gallon</span>
                  <div className="text-sm text-gray-600 mt-1">Save on every fill-up</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full mb-1">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Est. $180/year</span>
                  </div>
                </div>

                {/* Tire Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Nationwide Tire Discounts & Free Rotations</span>
                  <div className="text-sm text-gray-600 mt-1">Maintain your vehicle for less</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full mb-1">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Est. $100/year</span>
                  </div>
                </div>

                {/* Car Maintenance */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Car Maintenance Savings</span>
                  <div className="text-sm text-gray-600 mt-1">Discounted repairs and service</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full mb-1">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Est. $75/year</span>
                  </div>
                </div>

                {/* Auto Insurance */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Auto Insurance Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Lower premiums on coverage</div>
                </div>
                <div className="p-6 border-r border-gray-200 border-b text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-200 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full mb-1">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Est. $120/year</span>
                  </div>
                </div>

                {/* Coffee Credits - Last row with rounded corners */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 rounded-bl-2xl hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Coffee Credits</span>
                  <div className="text-sm text-gray-600 mt-1">Daily fuel for your business</div>
                </div>
                <div className="p-6 border-r border-gray-200 text-center bg-white hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="p-6 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-br-2xl hover:from-blue-50 hover:to-purple-50 transition-colors duration-200">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full mb-1">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Est. $300/year</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};