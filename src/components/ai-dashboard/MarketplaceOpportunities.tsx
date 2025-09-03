import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, FileText, Camera, Star, ArrowUpRight, DollarSign, TrendingUp, Target, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MarketplaceService {
  id: string;
  title: string;
  description: string;
  category: string;
  retail_price: string;
  pro_price: string;
  vendor_name: string;
  tags: string[];
  image_url?: string;
  vendor_rating?: number;
}

export const MarketplaceOpportunities = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'marketing': case 'ads & lead gen': return Camera;
      case 'operations': case 'transaction coordinator': return FileText;
      case 'lead gen': case 'crms': return Users;
      case 'coaching': return Target;
      case 'finance & business tools': return DollarSign;
      default: return Briefcase;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'marketing': case 'ads & lead gen': return {
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20"
      };
      case 'operations': case 'transaction coordinator': return {
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20"
      };
      case 'lead gen': case 'crms': return {
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20"
      };
      case 'coaching': return {
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20"
      };
      default: return {
        color: "text-primary",
        bgColor: "bg-primary/10",
        borderColor: "border-primary/20"
      };
    }
  };

  useEffect(() => {
    const fetchMarketplaceOpportunities = async () => {
      try {
        setLoading(true);
        
        // Call the get-marketplace-data edge function
        const { data, error } = await supabase.functions.invoke('get-marketplace-data', {
          body: { limit: 6 } // Get top 6 opportunities
        });

        if (error) {
          console.error('Error fetching marketplace data:', error);
          return;
        }

        if (data?.services) {
          // Sort by various factors to show the most relevant opportunities
          const sortedServices = data.services
            .filter((service: any) => service.is_active)
            .sort((a: any, b: any) => {
              // Prioritize services with better ratings and lower prices
              const aScore = (a.vendor_rating || 4.0) - (parseFloat(a.pro_price?.replace('$', '') || a.retail_price?.replace('$', '') || '0') / 1000);
              const bScore = (b.vendor_rating || 4.0) - (parseFloat(b.pro_price?.replace('$', '') || b.retail_price?.replace('$', '') || '0') / 1000);
              return bScore - aScore;
            })
            .slice(0, 6);

          setOpportunities(sortedServices);
        }
      } catch (error) {
        console.error('Error fetching marketplace opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMarketplaceOpportunities();
    }
  }, [user]);

  if (loading) {
    return (
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Your Top Marketplace Opportunities
        </h3>
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="w-16 h-6 bg-muted/50 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="w-3/4 h-6 bg-muted/50 rounded animate-pulse" />
                  <div className="w-1/2 h-4 bg-muted/50 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full h-12 bg-muted/50 rounded animate-pulse" />
                <div className="w-full h-20 bg-muted/50 rounded animate-pulse" />
                <div className="flex justify-between items-center">
                  <div className="w-20 h-6 bg-muted/50 rounded animate-pulse" />
                  <div className="w-24 h-8 bg-muted/50 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const processedOpportunities = opportunities.map((service) => {
    const categoryColors = getCategoryColor(service.category);
    const IconComponent = getCategoryIcon(service.category);
    const proPrice = service.pro_price ? parseFloat(service.pro_price.replace('$', '')) : null;
    const retailPrice = service.retail_price ? parseFloat(service.retail_price.replace('$', '')) : null;
    const displayPrice = proPrice || retailPrice || 0;

    return {
      id: service.id,
      title: service.title,
      category: service.category,
      description: service.description.length > 120 ? 
        service.description.substring(0, 120) + '...' : 
        service.description,
      vendor: service.vendor_name,
      service: service.title,
      impact: `See details for ROI estimates`,
      price: displayPrice,
      rating: service.vendor_rating || 4.5,
      urgency: proPrice ? "Pro Price" : "Available",
      icon: IconComponent,
      ...categoryColors
    };
  });

  return (
    <div>
      <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Zap className="h-6 w-6 text-yellow-500" />
        Your Top Marketplace Opportunities
      </h3>
      
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {processedOpportunities.map((opportunity) => {
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
                    // Navigate to marketplace with this service
                    window.location.href = `/marketplace?service=${opportunity.id}`;
                  }}>
                    View Details
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
          window.location.href = '/marketplace';
        }}>
          View All Opportunities
          <ArrowUpRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};