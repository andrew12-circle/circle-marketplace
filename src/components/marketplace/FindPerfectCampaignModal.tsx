import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Home, Rocket, Handshake, ArrowLeft, ExternalLink, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FindPerfectCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  is_featured: boolean;
  vendor: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
  };
}

const CAMPAIGN_GOALS = [
  {
    id: "listings",
    title: "Get More Listings",
    icon: Home,
    color: "bg-blue-500",
    description: "Generate new listing opportunities",
    keywords: ["seo", "lead generation", "digital marketing", "social media", "advertising"]
  },
  {
    id: "brand",
    title: "Boost My Brand",
    icon: Rocket,
    color: "bg-purple-500", 
    description: "Increase brand awareness and recognition",
    keywords: ["branding", "social media", "content creation", "photography", "graphic design"]
  },
  {
    id: "clients",
    title: "Engage Past Clients",
    icon: Handshake,
    color: "bg-green-500",
    description: "Nurture relationships for referrals and repeat business",
    keywords: ["email marketing", "crm", "automation", "newsletter", "client management"]
  }
];

export const FindPerfectCampaignModal = ({ open, onOpenChange }: FindPerfectCampaignModalProps) => {
  const [step, setStep] = useState<'goals' | 'recommendations'>('goals');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoalSelection = async (goalId: string) => {
    setSelectedGoal(goalId);
    setLoading(true);

    try {
      const goal = CAMPAIGN_GOALS.find(g => g.id === goalId);
      if (!goal) return;

      // Fetch services that match the goal keywords
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          vendor:vendors (
            name,
            rating,
            review_count,
            is_verified
          )
        `)
        .or(
          goal.keywords.map(keyword => 
            `title.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`
          ).join(',')
        )
        .limit(6);

      if (error) throw error;

      // Sort by featured, then by vendor rating
      const sortedServices = (services || []).sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return (b.vendor?.rating || 0) - (a.vendor?.rating || 0);
      });

      setRecommendations(sortedServices);
      setStep('recommendations');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('goals');
    setSelectedGoal(null);
    setRecommendations([]);
  };

  const handleReset = () => {
    setStep('goals');
    setSelectedGoal(null);
    setRecommendations([]);
  };

  const selectedGoalData = CAMPAIGN_GOALS.find(g => g.id === selectedGoal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">Find Your Perfect Campaign</DialogTitle>
          <p className="text-muted-foreground">
            {step === 'goals' 
              ? "What is your primary goal right now?"
              : `Recommended services for: ${selectedGoalData?.title}`
            }
          </p>
        </DialogHeader>

        {step === 'goals' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {CAMPAIGN_GOALS.map((goal) => {
              const Icon = goal.icon;
              return (
                <button
                  key={goal.id}
                  onClick={() => handleGoalSelection(goal.id)}
                  disabled={loading}
                  className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 text-center group disabled:opacity-50"
                >
                  <div className={`w-16 h-16 ${goal.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {selectedGoalData && (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${selectedGoalData.color} rounded-lg flex items-center justify-center`}>
                    <selectedGoalData.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{selectedGoalData.title}</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Finding perfect campaigns...</p>
                </div>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((service) => (
                  <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{service.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                      {service.is_featured && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{service.vendor?.name}</span>
                        {service.vendor?.is_verified && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            ✓
                          </Badge>
                        )}
                      </div>
                      {service.vendor?.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{service.vendor.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({service.vendor.review_count})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {service.retail_price || service.pro_price || service.co_pay_price || 'Contact for price'}
                      </span>
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <selectedGoalData.icon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any campaigns matching your goal right now.
                </p>
                <Button variant="outline" onClick={handleBack}>
                  Try Another Goal
                </Button>
              </div>
            )}

            {!loading && recommendations.length > 0 && (
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="flex-1"
                >
                  Try Another Goal
                </Button>
                <Button className="flex-1">
                  View All Services
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};