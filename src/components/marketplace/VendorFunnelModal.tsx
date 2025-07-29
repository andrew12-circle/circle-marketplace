import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Target,
  Zap,
  Trophy,
  ArrowRight,
  Building,
  MapPin,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";

interface VendorFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    website_url?: string;
    location?: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
    co_marketing_agents: number;
    campaigns_funded: number;
    service_states?: string[];
    mls_areas?: string[];
    service_radius_miles?: number;
  };
  onRequestCoMarketing: (vendorId: string) => void;
}

export const VendorFunnelModal = ({ 
  isOpen, 
  onClose, 
  vendor, 
  onRequestCoMarketing 
}: VendorFunnelModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const riskLevel = determineServiceRisk(vendor.name, vendor.description);
  
  // Mock data for compelling stats
  const mockStats = {
    avgROI: "3.2x",
    avgLeadIncrease: "147%",
    avgCostSavings: "58%",
    successRate: "94%",
    avgPartnershipLength: "18 months"
  };

  const benefits = [
    {
      icon: DollarSign,
      title: "Cost Sharing",
      description: "Split marketing costs 50/50 and double your advertising reach",
      stat: "Average 58% cost reduction"
    },
    {
      icon: Target,
      title: "Expanded Reach", 
      description: "Access their client network and geographic coverage",
      stat: `${vendor.service_radius_miles || 50} mile radius coverage`
    },
    {
      icon: TrendingUp,
      title: "Proven Results",
      description: "Track record of successful co-marketing campaigns",
      stat: `${vendor.campaigns_funded} campaigns funded`
    },
    {
      icon: Users,
      title: "Professional Network",
      description: "Join their network of successful real estate professionals",
      stat: `${vendor.co_marketing_agents} active partners`
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "Top Producer, Metro Realty",
      quote: "Co-marketing with this vendor increased my lead generation by 200% while cutting my advertising costs in half.",
      rating: 5
    },
    {
      name: "Mike Chen",
      title: "RE/MAX Premier",
      quote: "The joint campaigns we've run have been our most successful marketing efforts. Highly recommend!",
      rating: 5
    }
  ];

  const handleRequestCoMarketing = () => {
    onRequestCoMarketing(vendor.id);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          {vendor.logo_url ? (
            <img 
              src={vendor.logo_url} 
              alt={vendor.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Building className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="text-left">
            <h2 className="text-2xl font-bold">{vendor.name}</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{vendor.rating}</span>
                <span className="text-sm text-muted-foreground">({vendor.review_count} reviews)</span>
              </div>
              {vendor.is_verified && (
                <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
              )}
              {getRiskBadge(riskLevel)}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">Ready to 3x Your Marketing ROI?</h3>
          <p className="text-muted-foreground">
            Join {vendor.co_marketing_agents} successful agents already co-marketing with {vendor.name}
          </p>
        </div>
      </div>

      {/* Compliance Alert */}
      {getComplianceAlert(riskLevel) && (
        <div className="px-4">
          {getComplianceAlert(riskLevel)}
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{mockStats.avgROI}</div>
          <div className="text-sm text-muted-foreground">Average ROI</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{mockStats.avgLeadIncrease}</div>
          <div className="text-sm text-muted-foreground">Lead Increase</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{mockStats.avgCostSavings}</div>
          <div className="text-sm text-muted-foreground">Cost Savings</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{mockStats.successRate}</div>
          <div className="text-sm text-muted-foreground">Success Rate</div>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setCurrentStep(2)}
          className="flex-1"
          size="lg"
        >
          See How It Works
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button 
          variant="outline"
          onClick={handleRequestCoMarketing}
          size="lg"
        >
          <Zap className="w-4 h-4 mr-2" />
          Skip to Request
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Why Partner with {vendor.name}?</h3>
        <p className="text-muted-foreground">Here's what makes this partnership opportunity special</p>
      </div>

      {/* Benefits Grid */}
      <div className="grid gap-4">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{benefit.description}</p>
                  <Badge variant="secondary" className="text-xs">{benefit.stat}</Badge>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Service Area */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Service Coverage</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {vendor.location || "Multiple locations"}
        </p>
        {vendor.service_states && vendor.service_states.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vendor.service_states.slice(0, 3).map((state) => (
              <Badge key={state} variant="outline" className="text-xs">{state}</Badge>
            ))}
            {vendor.service_states.length > 3 && (
              <Badge variant="outline" className="text-xs">+{vendor.service_states.length - 3} more</Badge>
            )}
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep(1)}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={() => setCurrentStep(3)}
          className="flex-1"
          size="lg"
        >
          See Success Stories
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Success Stories</h3>
        <p className="text-muted-foreground">See what other agents are saying</p>
      </div>

      {/* Testimonials */}
      <div className="space-y-4">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {testimonial.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{testimonial.name}</span>
                  <span className="text-sm text-muted-foreground">{testimonial.title}</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm italic text-muted-foreground">"{testimonial.quote}"</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg text-center">
        <h4 className="text-lg font-semibold mb-2">Ready to Get Started?</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Join the {vendor.co_marketing_agents} agents already growing their business with {vendor.name}
        </p>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setCurrentStep(2)}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleRequestCoMarketing}
            className="flex-1"
            size="lg"
          >
            <Zap className="w-4 h-4 mr-2" />
            Request Co-pay Support
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <span>Vendor Partnership Opportunity</span>
        </DialogHeader>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Partnership Details</span>
            <span>Step {currentStep} of 3</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </DialogContent>
    </Dialog>
  );
};