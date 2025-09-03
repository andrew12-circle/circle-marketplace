import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Share2, 
  Download, 
  CheckCircle,
  ArrowRight,
  Globe,
  Target,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { LegalFooter } from "@/components/LegalFooter";

export const AffiliateLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-primary border-primary/20">
            <TrendingUp className="w-4 h-4 mr-2" />
            Circle Network Affiliate Program
          </Badge>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-purple-700 bg-clip-text text-transparent">
            Earn While You Help<br />Agents Build Better Businesses
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the Circle Network partner program and earn recurring commissions 
            by sharing the tools that transform real estate careers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link to="/affiliate/apply">
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                const detailsSection = document.getElementById('program-details');
                detailsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Program Details
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Join</h3>
              <p className="text-muted-foreground">
                Apply in minutes and get approved to start sharing Circle tools with your network.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Share</h3>
              <p className="text-muted-foreground">
                Use your custom links and ready-made assets to promote Circle Pro and marketplace tools.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Earn</h3>
              <p className="text-muted-foreground">
                Get paid monthly for every subscription and marketplace purchase your referrals make.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Examples */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Your Earning Potential</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-semibold">Circle Pro Referrals</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly subscription: $97</span>
                    <span className="font-semibold">×20% = $19.40/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recurring for:</span>
                    <span className="font-semibold">12 months</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-primary">
                    <span>Per referral total:</span>
                    <span>$232.80</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Refer 25 agents who stay active → <strong>$5,820/year</strong>
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-semibold">Marketplace Tools</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Average purchase: $299</span>
                    <span className="font-semibold">×10% = $29.90</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lifetime commissions on:</span>
                    <span className="font-semibold">All purchases</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-accent">
                    <span>Growing with your network</span>
                    <span>📈</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Your referred agents' lifetime purchases = your lifetime income
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-6 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Copy this pitch:</h4>
            <div className="bg-background p-4 rounded border text-sm font-mono">
              "I help agents build $100K+ businesses with Circle Pro ($97/month) and handpicked marketplace tools. 
              Everything's vetted for ROI. Interested in seeing what 2,500+ top agents use daily?"
            </div>
            <Button variant="outline" size="sm" className="mt-3">
              Copy to Clipboard
            </Button>
          </div>
        </div>
      </section>

      {/* Why Circle */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Why Circle Sells Itself</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Easy Sell</h3>
              <p className="text-sm text-muted-foreground">
                Proven ROI stories and tools agents actually want
              </p>
            </div>
            
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Recurring Revenue</h3>
              <p className="text-sm text-muted-foreground">
                12 months of commissions on every Pro subscription
              </p>
            </div>
            
            <div className="text-center">
              <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Lifetime Marketplace</h3>
              <p className="text-sm text-muted-foreground">
                Earn on every tool your referrals ever buy
              </p>
            </div>
            
            <div className="text-center">
              <Download className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Ready-Made Assets</h3>
              <p className="text-sm text-muted-foreground">
                Banners, copy, and campaigns created for you
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section id="program-details" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Program Details</h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Commission Structure</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span><strong>20%</strong> recurring commission on Circle Pro subscriptions ($97/month) for 12 months</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span><strong>10%</strong> lifetime commission on all marketplace purchases</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Commission starts after trial payment clears</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Payment Terms</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>$50 minimum payout threshold</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Monthly payments on the 15th</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>30-day attribution window</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Stripe Connect or ACH payments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Who can apply?</h3>
                <p className="text-sm text-muted-foreground">
                  Real estate professionals, coaches, industry influencers, and business partners who can ethically 
                  recommend Circle tools to agents and real estate teams.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How long does approval take?</h3>
                <p className="text-sm text-muted-foreground">
                  Most applications are reviewed within 2-3 business days. You'll receive an email with your decision.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What marketing materials do you provide?</h3>
                <p className="text-sm text-muted-foreground">
                  Banners, social media posts, email templates, landing pages, and campaign copy. 
                  Everything is pre-approved and converts well.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can I refer myself or my own business?</h3>
                <p className="text-sm text-muted-foreground">
                  Self-referrals are not permitted. The program is designed to reward genuine recommendations 
                  to new Circle users.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the Circle Network affiliate program and start earning commissions 
            on the tools that help agents build better businesses.
          </p>
          
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/affiliate/apply">
              Apply Now - It's Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            No upfront costs. Start earning immediately after approval.
          </p>
        </div>
      </section>
      </div>
      
      <LegalFooter />
    </div>
  );
};