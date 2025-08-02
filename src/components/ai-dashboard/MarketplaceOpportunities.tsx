import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, FileText, Camera, Star, ArrowUpRight, DollarSign } from "lucide-react";

export const MarketplaceOpportunities = () => {
  // Mock data - will be replaced with AI-generated recommendations based on business context
  const opportunities = [
    {
      id: 1,
      title: "Boost Your New Listing",
      category: "Marketing",
      description: "Your new listing on Murfreesboro Road goes live tomorrow",
      vendor: "Franklin Social Pro",
      service: "Social Media Blast Package",
      impact: "20,000 local views in first 48 hours",
      price: 250,
      rating: 5.0,
      urgency: "Launch Tomorrow",
      icon: Camera,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      id: 2,
      title: "Offload Administrative Work",
      category: "Operations",
      description: "Two closings in next 3 weeks will increase admin workload by 6 hours/week",
      vendor: "TN Closings Co.",
      service: "Transaction-as-a-Service",
      impact: "Manage both closings completely",
      price: 700,
      rating: 4.8,
      urgency: "Book This Week",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      id: 3,
      title: "Accelerate Lead Generation",
      category: "Lead Gen",
      description: "Q3 goal requires 15% more leads to maintain current conversion rates",
      vendor: "Music City Leads",
      service: "Targeted Facebook Campaign",
      impact: "50+ qualified leads in 30 days",
      price: 1200,
      rating: 4.9,
      urgency: "Start ASAP",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    }
  ];

  return (
    <div>
      <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Zap className="h-6 w-6 text-yellow-500" />
        Your Top Marketplace Opportunities
      </h3>
      
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {opportunities.map((opportunity) => {
          const IconComponent = opportunity.icon;
          
          return (
            <Card key={opportunity.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-200 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${opportunity.bgColor} border ${opportunity.borderColor}`}>
                    <IconComponent className={`h-5 w-5 ${opportunity.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {opportunity.urgency}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg mb-2">{opportunity.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {opportunity.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {opportunity.description}
                </p>
                
                <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-sm">{opportunity.vendor}</h5>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium">{opportunity.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{opportunity.service}</p>
                  <p className="text-sm font-medium text-foreground">{opportunity.impact}</p>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-bold text-lg">${opportunity.price}</span>
                  </div>
                  <Button size="sm" className="group-hover:bg-primary/90" onClick={() => {
                    // TODO: Implement booking flow
                    console.log('Booking opportunity:', opportunity.id);
                  }}>
                    Book Now
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8 text-center">
        <Button variant="outline" size="lg" className="bg-background/50 hover:bg-background" onClick={() => {
          // TODO: Navigate to marketplace with filter applied
          console.log('View all opportunities clicked');
        }}>
          View All Opportunities
          <ArrowUpRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};