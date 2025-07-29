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
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubscription = async (plan: "solo" | "team") => {
    try {
      setLoading(plan);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to start your subscription.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { plan },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={circleLogo} alt="Circle Logo" className="w-10 h-10" />
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                    Marketplace
                  </Link>
                  <Button asChild className="bg-gradient-to-r from-circle-primary to-circle-primary-light text-white">
                    <Link to="/profile-settings">Profile</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                    Login
                  </Link>
                  <Button asChild className="bg-gradient-to-r from-circle-primary to-circle-primary-light text-white">
                    <Link to="/auth">Join Free & Explore</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Marketing for Real Estate, Mastered.
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Find vetted creative partners and manage your marketing with powerful tools designed to help you grow.
          </p>
          
          <div className="inline-block">
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-4 py-2">
              For Real Estate Agents
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Find the Plan That's Right for You</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're just getting started or scaling a top-producing team, Circle has a plan to help you grow.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Pricing Table Header */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-0 mb-8">
              <div className="p-6"></div>
              
              {/* Circle Starter */}
              <div className="bg-white rounded-lg border p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Circle Starter</h3>
                <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Agents exploring the marketplace</p>
                {user ? (
                  <Button 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    asChild
                  >
                    <Link to="/">Go to Marketplace</Link>
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    asChild
                  >
                    <Link to="/auth">Create Free Account</Link>
                  </Button>
                )}
              </div>

              {/* Circle Pro (Solo) - Most Popular */}
              <div className="bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6 text-center relative">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  Most Popular
                </Badge>
                <h3 className="text-xl font-semibold mb-2">Circle Pro (Solo)</h3>
                <div className="text-3xl font-bold mb-4">$47<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Solo agents automating their marketing</p>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  onClick={() => handleSubscription("solo")}
                  disabled={loading === "solo"}
                >
                  {loading === "solo" ? "Loading..." : "Start Your Free Trial"}
                </Button>
              </div>

              {/* Circle Pro (Team) */}
              <div className="bg-white rounded-lg border p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Circle Pro (Team)</h3>
                <div className="text-3xl font-bold mb-4">$97<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Teams building a growth system</p>
                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => handleSubscription("team")}
                  disabled={loading === "team"}
                >
                  {loading === "team" ? "Loading..." : "Start Your Free Trial"}
                </Button>
              </div>
            </div>

            {/* Features Comparison Table */}
            <div className="bg-white rounded-lg border overflow-hidden mt-8">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-0">
                {/* Header Row */}
                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-semibold">Features</span>
                </div>
                <div className="p-4 border-r border-b text-center font-semibold">Circle Starter</div>
                <div className="p-4 border-r border-b text-center font-semibold bg-blue-50">Circle Pro (Solo)</div>
                <div className="p-4 border-b text-center font-semibold">Circle Pro (Team)</div>

                {/* Core Features */}
                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">Marketplace Access</span>
                </div>
                <div className="p-4 border-r border-b text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>
                <div className="p-4 border-r border-b text-center bg-blue-50">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>
                <div className="p-4 border-b text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">Circle Points</span>
                </div>
                <div className="p-4 border-r border-b text-center text-sm">100 to start</div>
                <div className="p-4 border-r border-b text-center text-sm bg-blue-50">500 monthly</div>
                <div className="p-4 border-b text-center text-sm">1000 monthly</div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">Academy Courses</span>
                </div>
                <div className="p-4 border-r border-b text-center text-sm">Basic</div>
                <div className="p-4 border-r border-b text-center text-sm bg-blue-50">Premium</div>
                <div className="p-4 border-b text-center text-sm">Premium + Team</div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">Marketing Automation</span>
                </div>
                <div className="p-4 border-r border-b text-center">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 border-r border-b text-center bg-blue-50">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>
                <div className="p-4 border-b text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">Lead Generation Tools</span>
                </div>
                <div className="p-4 border-r border-b text-center">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 border-r border-b text-center bg-blue-50">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>
                <div className="p-4 border-b text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">CRM Integration</span>
                </div>
                <div className="p-4 border-r border-b text-center">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 border-r border-b text-center bg-blue-50">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>
                <div className="p-4 border-b text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">Analytics & Reporting</span>
                </div>
                <div className="p-4 border-r border-b text-center text-sm">Basic</div>
                <div className="p-4 border-r border-b text-center text-sm bg-blue-50">Advanced</div>
                <div className="p-4 border-b text-center text-sm">Team Dashboard</div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">1-on-1 Coaching</span>
                </div>
                <div className="p-4 border-r border-b text-center">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 border-r border-b text-center bg-blue-50">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>
                <div className="p-4 border-b text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">Team Management</span>
                </div>
                <div className="p-4 border-r border-b text-center">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 border-r border-b text-center bg-blue-50">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 border-b text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-sm">Priority Support</span>
                </div>
                <div className="p-4 border-r border-b text-center">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 border-r border-b text-center bg-blue-50">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>
                <div className="p-4 border-b text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>

                <div className="bg-gray-50 p-4 border-r">
                  <span className="font-medium text-sm">Custom Branding</span>
                </div>
                <div className="p-4 border-r text-center">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 border-r text-center bg-blue-50">
                  <X className="w-5 h-5 text-gray-400 mx-auto" />
                </div>
                <div className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};