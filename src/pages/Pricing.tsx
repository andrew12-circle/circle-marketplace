import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sbInvoke } from "@/utils/sb";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
const circleLogoUrl = "/circle-logo-updated.png";
export const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [coreOpen, setCoreOpen] = useState(true);
  const [businessOpen, setBusinessOpen] = useState(true);
  const [lifestyleOpen, setLifestyleOpen] = useState(true);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
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
        navigate('/auth?mode=signup');
        return;
      }
      const {
        data,
        error
      } = await sbInvoke('create-subscription-checkout', {
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
              <img src={circleLogoUrl} alt="Circle Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
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
      <section className="pt-12 md:pt-20 pb-6 md:pb-12 text-center">
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
      <section className="pb-6 md:pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 md:mb-8">
            
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

            {/* Mobile: Table-Style Feature Comparison */}
            <div className="md:hidden">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Compare Plans
                </h3>
                <p className="text-sm text-muted-foreground">See everything you get with Circle Pro</p>
              </div>
              
              {/* Mobile Table Header */}
              <div className="bg-white rounded-t-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-0 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="p-4 border-r border-gray-200 flex items-center min-h-[80px]">
                    <span className="font-bold text-sm text-gray-900">Features</span>
                  </div>
                  <div className="p-4 border-r border-gray-200 text-center flex flex-col justify-center min-h-[80px]">
                    <div className="font-bold text-sm text-gray-900">Starter</div>
                    <div className="text-xs text-emerald-600 font-semibold">Free</div>
                  </div>
                  <div className="p-4 text-center bg-gradient-to-br from-blue-50 to-purple-50 relative flex flex-col justify-center min-h-[80px]">
                    <div className="font-bold text-sm text-gray-900">Pro</div>
                    <div className="text-xs text-blue-600 font-semibold">$97/month</div>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                        POPULAR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core Features Section */}
                <Collapsible open={coreOpen} onOpenChange={setCoreOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 border-b border-gray-200 hover:from-blue-100 hover:to-purple-100 transition-colors">
                      <span className="font-bold text-sm text-gray-900 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                          Core Platform Features
                        </div>
                        {coreOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>

                {[{
                  feature: "Marketplace Access",
                  starter: "✓",
                  pro: "✓",
                  description: "Browse and discover services"
                }, {
                  feature: "Circle Coverage",
                  starter: "✗",
                  pro: "✓",
                  description: "Access premium features"
                }, {
                  feature: "Pro Pricing (Avg. 20% off)",
                  starter: "✗",
                  pro: "✓",
                  description: "Often pays for itself with one purchase"
                }, {
                  feature: "CoPay Access (60% avg. discount)",
                  starter: "✗",
                  pro: "✓",
                  description: "Select services with deep discounts"
                }, {
                  feature: "Circle Academy Access",
                  starter: "Limited",
                  pro: "Full Library",
                  description: "Training and educational content"
                }].map((item, index) => (
                   <div key={index} className="grid grid-cols-[2fr_1fr_1fr] gap-0 border-b border-gray-200 hover:bg-gray-50/50 transition-colors min-h-[60px]">
                     <div className="p-3 border-r border-gray-200 flex flex-col justify-center">
                       <div className="font-medium text-sm text-gray-900 leading-tight">{item.feature}</div>
                       <div className="text-xs text-gray-600 mt-1 leading-tight">{item.description}</div>
                     </div>
                    <div className="p-3 border-r border-gray-200 text-center flex items-center justify-center">
                      {item.starter === "✓" ? (
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                      ) : item.starter === "✗" ? (
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-gray-400" />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{item.starter}</span>
                      )}
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-50/30 to-purple-50/30 text-center flex items-center justify-center">
                      {item.pro === "✓" ? (
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                      ) : item.pro === "✗" ? (
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-gray-400" />
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">{item.pro}</span>
                      )}
                     </div>
                   </div>
                 ))}
                   </CollapsibleContent>
                 </Collapsible>
                {/* Business Features Section */}
                <Collapsible open={businessOpen} onOpenChange={setBusinessOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 border-b border-gray-200 hover:from-purple-100 hover:to-pink-100 transition-colors">
                      <span className="font-bold text-sm text-gray-900 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">2</span>
                          </div>
                          Business Growth Features
                        </div>
                        {businessOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>

                {[{
                  feature: "Create & Sell Playbooks",
                  starter: "✗",
                  pro: "✓",
                  description: "Share your expertise and earn"
                }, {
                  feature: "Earn Creator Revenue",
                  starter: "✗",
                  pro: "✓",
                  description: "Monetize your content"
                }, {
                  feature: "Analytics & Reporting",
                  starter: "✗",
                  pro: "Advanced",
                  description: "Track performance and ROI"
                }, {
                  feature: "Team Management",
                  starter: "✗",
                  pro: "✓",
                  description: "Manage multiple team members"
                }, {
                  feature: "Priority Support",
                  starter: "✗",
                  pro: "✓",
                  description: "Get help when you need it most"
                }].map((item, index) => (
                   <div key={index} className="grid grid-cols-[2fr_1fr_1fr] gap-0 border-b border-gray-200 hover:bg-gray-50/50 transition-colors min-h-[60px]">
                     <div className="p-3 border-r border-gray-200 flex flex-col justify-center">
                       <div className="font-medium text-sm text-gray-900 leading-tight">{item.feature}</div>
                       <div className="text-xs text-gray-600 mt-1 leading-tight">{item.description}</div>
                     </div>
                    <div className="p-3 border-r border-gray-200 text-center flex items-center justify-center">
                      {item.starter === "✗" ? (
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-gray-400" />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-600">{item.starter}</span>
                      )}
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-50/30 to-purple-50/30 text-center flex items-center justify-center">
                      {item.pro === "✓" ? (
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">{item.pro}</span>
                      )}
                    </div>
                  </div>
                 ))}
                   </CollapsibleContent>
                 </Collapsible>

                 {/* Lifestyle Benefits Section */}
                 <Collapsible open={lifestyleOpen} onOpenChange={setLifestyleOpen}>
                   <CollapsibleTrigger className="w-full">
                     <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 border-b border-gray-200 hover:from-amber-100 hover:to-orange-100 transition-colors">
                       <span className="font-bold text-sm text-gray-900 flex items-center justify-between gap-2">
                         <div className="flex items-center gap-2">
                           <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                             <span className="text-white text-xs font-bold">3</span>
                           </div>
                           Lifestyle Benefits
                           <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Coming Soon</span>
                         </div>
                         {lifestyleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                       </span>
                     </div>
                   </CollapsibleTrigger>
                   <CollapsibleContent>

                {[{
                  feature: "Fuel Discount — $0.15/gallon",
                  starter: "✗",
                  pro: "✓ ($180/year)",
                  description: "Save on every fill-up"
                }, {
                  feature: "Tire Discounts & Free Rotations",
                  starter: "✗",
                  pro: "✓ ($100/year)",
                  description: "Maintain your vehicle for less"
                }, {
                  feature: "Car Maintenance Savings",
                  starter: "✗",
                  pro: "✓ ($75/year)",
                  description: "Discounted repairs and service"
                }, {
                  feature: "Auto Insurance Discounts",
                  starter: "✗",
                  pro: "✓ ($120/year)",
                  description: "Lower premiums on coverage"
                }, {
                  feature: "Car Wash & Detailing",
                  starter: "✗",
                  pro: "✓ ($240/year)",
                  description: "Keep your vehicle professional"
                }, {
                  feature: "Roadside Assistance Coverage",
                  starter: "✗",
                  pro: "✓ ($75/year)",
                  description: "Peace of mind on the road"
                }, {
                  feature: "Laptop & Device Discounts",
                  starter: "✗",
                  pro: "✓ ($150/year)",
                  description: "Tech gear for your business"
                }, {
                  feature: "Phone Plan Discounts",
                  starter: "✗",
                  pro: "✓ ($120/year)",
                  description: "Save on your mobile service"
                }, {
                  feature: "Coworking Space Passes",
                  starter: "✗",
                  pro: "✓ ($200/year)",
                  description: "Professional workspace access"
                }, {
                  feature: "Office Supply Discounts",
                  starter: "✗",
                  pro: "✓ ($100/year)",
                  description: "Business essentials for less"
                }, {
                  feature: "Event Ticket Discounts",
                  starter: "✗",
                  pro: "✓ ($100/year)",
                  description: "Entertainment and networking events"
                }, {
                  feature: "Floral Delivery Discounts",
                  starter: "✗",
                  pro: "✓ ($60/year)",
                  description: "Client appreciation and gifts"
                }, {
                  feature: "Hotel & Travel Discounts",
                  starter: "✗",
                  pro: "✓ ($450+/year)",
                  description: "Business travel accommodations"
                }, {
                  feature: "Coffee Credits",
                  starter: "✗",
                  pro: "✓ ($300/year)",
                  description: "Daily fuel for your business"
                }, {
                  feature: "Gym Membership Discounts",
                  starter: "✗",
                  pro: "✓ ($120/year)",
                  description: "Stay healthy and energized"
                }].map((item, index, array) => (
                   <div key={index} className={`grid grid-cols-[2fr_1fr_1fr] gap-0 hover:bg-gray-50/50 transition-colors min-h-[60px] ${
                     index === array.length - 1 ? '' : 'border-b border-gray-200'
                   }`}>
                     <div className="p-3 border-r border-gray-200 flex flex-col justify-center">
                       <div className="font-medium text-sm text-gray-900 leading-tight">{item.feature}</div>
                       <div className="text-xs text-gray-600 mt-1 leading-tight">{item.description}</div>
                     </div>
                    <div className="p-3 border-r border-gray-200 text-center flex items-center justify-center">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-50/30 to-purple-50/30 text-center flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mb-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-xs text-blue-600 font-medium">
                          {item.pro.match(/\((.*?)\)/)?.[1]}
                        </span>
                      </div>
                    </div>
                  </div>
                 ))}
                   </CollapsibleContent>
                 </Collapsible>
               </div>
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
                <div className="p-8 text-center bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 relative overflow-visible">
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
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

                {/* Car Wash & Detailing */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Car Wash & Detailing Memberships</span>
                  <div className="text-sm text-gray-600 mt-1">Keep your vehicle looking professional</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $240/year</span>
                  </div>
                </div>

                {/* Roadside Assistance */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Roadside Assistance Coverage</span>
                  <div className="text-sm text-gray-600 mt-1">Peace of mind on the road</div>
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

                {/* Laptop & Device Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Laptop & Device Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Tech gear for your business</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $150/year</span>
                  </div>
                </div>

                {/* Phone Plan Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Phone Plan Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Save on your mobile service</div>
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

                {/* Coworking Space Passes */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Coworking Space Passes</span>
                  <div className="text-sm text-gray-600 mt-1">Professional workspace access</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $200/year</span>
                  </div>
                </div>

                {/* Office Supply Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Office Supply Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Business essentials for less</div>
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

                {/* Event Ticket Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Event Ticket Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Entertainment and networking events</div>
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

                {/* Floral Delivery Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Floral Delivery Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Client appreciation and gifts</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $60/year</span>
                  </div>
                </div>

                {/* Hotel Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Hotel Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Business travel accommodations</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $150/year</span>
                  </div>
                </div>

                {/* Airline Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Airline Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Travel savings for business trips</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $150/year</span>
                  </div>
                </div>

                {/* Vacation Packages */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Vacation Packages</span>
                  <div className="text-sm text-gray-600 mt-1">Well-deserved getaways</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $150/year</span>
                  </div>
                </div>

                {/* Theme Park Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Theme Park Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Family entertainment savings</div>
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

                {/* Gym Membership Discounts */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Gym Membership Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Stay healthy and energized</div>
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

                {/* Wellness App Subscriptions */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Wellness App Subscriptions</span>
                  <div className="text-sm text-gray-600 mt-1">Mental health and mindfulness</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $60/year</span>
                  </div>
                </div>

                {/* Coffee Credits */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Coffee Credits</span>
                  <div className="text-sm text-gray-600 mt-1">Daily fuel for your business</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $300/year</span>
                  </div>
                </div>

                {/* EV Charging Credit Program */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 border-b hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">EV Charging Credit Program</span>
                  <div className="text-sm text-gray-600 mt-1">Electric vehicle charging savings</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $150/year</span>
                  </div>
                </div>

                {/* Rental Car & Rideshare Discounts - Last row with rounded corners */}
                <div className="bg-gray-50/50 p-6 border-r border-gray-200 rounded-bl-2xl hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-semibold text-gray-900">Rental Car & Rideshare Discounts</span>
                  <div className="text-sm text-gray-600 mt-1">Transportation savings</div>
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
                    <span className="text-xs text-blue-600 font-medium">Est. $120/year</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};