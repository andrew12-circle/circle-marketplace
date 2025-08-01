import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, Star, MapPin, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';

interface RecommendedService {
  id: string;
  title: string;
  description: string;
  category: string;
  price_retail: number;
  vendor_id: string;
  vendors: {
    business_name: string;
    location: string;
    rating?: number;
  };
}

interface AIRecommendationsProps {
  preferences?: any;
  recentActivity?: any[];
  limit?: number;
  onServiceSelect?: (service: RecommendedService) => void;
}

export const AIRecommendations = ({ 
  preferences, 
  recentActivity, 
  limit = 5, 
  onServiceSelect 
}: AIRecommendationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<RecommendedService[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>('');

  const fetchRecommendations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          userId: user.id,
          preferences,
          recentActivity,
          limit
        }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      setSource(data.source || 'unknown');

      if (data.message) {
        toast({
          title: "Recommendations Generated",
          description: data.message
        });
      }

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load recommendations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service: RecommendedService) => {
    // Track click event
    supabase
      .from('vendor_agent_activities')
      .insert({
        vendor_id: service.vendor_id,
        agent_id: user?.id,
        activity_type: 'ai_recommendation_clicked',
        activity_data: {
          service_id: service.id,
          service_title: service.title,
          recommendation_source: source
        }
      });

    if (onServiceSelect) {
      onServiceSelect(service);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user?.id, preferences, recentActivity]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>
                Personalized service suggestions powered by AI
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {source === 'ai-powered' ? '🤖 AI' : '📊 Rule-based'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecommendations}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No recommendations available at the moment.</p>
            <p className="text-sm">Try updating your profile or saving some services.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((service, index) => (
              <div key={service.id}>
                <div
                  className="group cursor-pointer p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {service.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {service.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {service.category}
                        </div>
                        
                        {service.vendors.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {service.vendors.location}
                          </div>
                        )}
                        
                        {service.vendors.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {service.vendors.rating}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="flex items-center gap-1 text-lg font-bold">
                        <DollarSign className="h-4 w-4" />
                        {service.price_retail?.toLocaleString() || 'Contact'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {service.vendors.business_name}
                      </div>
                    </div>
                  </div>
                </div>
                {index < recommendations.length - 1 && <Separator className="my-2" />}
              </div>
            ))}

            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRecommendations}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Get New Recommendations
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};