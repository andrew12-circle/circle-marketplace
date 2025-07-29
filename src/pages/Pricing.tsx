import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Pricing = () => {
  const features = {
    free: [
      "Access to basic marketplace",
      "100 Circle Points to start",
      "Basic academy courses",
      "Community access",
    ],
    pro: [
      "Everything in Free",
      "Unlimited marketplace access",
      "Premium academy courses",
      "1-on-1 coaching sessions",
      "Advanced analytics",
      "Priority support",
      "Exclusive pro-only content",
      "Monthly bonus points",
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-circle-primary to-circle-primary-light rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Circle</h1>
                <p className="text-sm text-muted-foreground">Grow Smarter</p>
              </div>
            </Link>
            <Button asChild variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose Your Circle Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock your potential with the right plan for your real estate journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Circle Free
                <Badge variant="secondary">Current Plan</Badge>
              </CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6" variant="outline" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-circle-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-circle-accent text-foreground">
                <Crown className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-circle-accent" />
                Circle Pro
              </CardTitle>
              <CardDescription>For serious real estate professionals</CardDescription>
              <div className="text-3xl font-bold">$29<span className="text-sm font-normal">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.pro.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6 bg-circle-accent hover:bg-circle-accent/90 text-foreground">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-left">
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">Yes, you can cancel your Circle Pro subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-2">What are Circle Points?</h3>
              <p className="text-muted-foreground">Circle Points are our virtual currency that you can earn and spend in our marketplace. Pro members get bonus points monthly.</p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">We offer a 7-day free trial for Circle Pro so you can experience all the premium features before committing.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};