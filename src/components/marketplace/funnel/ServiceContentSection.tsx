import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Users, Target } from "lucide-react";

interface ServiceContentSectionProps {
  service: any;
}

export const ServiceContentSection = ({ service }: ServiceContentSectionProps) => {
  const features = [
    "Complete project management",
    "Professional consultation included",
    "Quality assurance testing",
    "24/7 customer support",
    "Money-back guarantee"
  ];

  const mediaItems = service.media_gallery || [];

  return (
    <div className="space-y-8">
      {/* Service Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Service Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {service.description || "Professional service designed to meet your specific needs with expert delivery and comprehensive support."}
          </p>
        </CardContent>
      </Card>

      {/* What's Included */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            What's Included
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Timeline</h3>
                <p className="text-sm text-muted-foreground">2-4 weeks delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Team Size</h3>
                <p className="text-sm text-muted-foreground">2-5 specialists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Success Rate</h3>
                <p className="text-sm text-muted-foreground">98% completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Media Gallery */}
      {mediaItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio & Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaItems.slice(0, 6).map((item: any, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={item.url}
                    alt={item.alt || `Portfolio item ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">View Details</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Tiers */}
      {service.pricing_tiers && service.pricing_tiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {service.pricing_tiers.map((tier: any, index: number) => (
                <div 
                  key={index}
                  className={`p-6 rounded-lg border-2 ${
                    tier.recommended 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                >
                  {tier.recommended && (
                    <Badge className="mb-4">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <div className="text-3xl font-bold mb-4">
                    ${tier.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{tier.duration || 'service'}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-4">{tier.description}</p>
                  <ul className="space-y-2">
                    {tier.features?.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};