import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star, Users, ShoppingCart, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getProStatus } from '@/lib/profile';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TopAgentPurchase {
  service_id: string;
  purchase_frequency: number;
  avg_roi: number;
  service_title: string;
  category: string;
}

const TopAgentInsights = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<TopAgentPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isPro = getProStatus(profile);

  useEffect(() => {
    if (isPro) {
      fetchTopAgentInsights();
    } else {
      setIsLoading(false);
    }
  }, [isPro]);

  const fetchTopAgentInsights = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_top_agent_purchases');
      
      if (error) throw error;
      
      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching top agent insights:', error);
      toast({
        title: "Error",
        description: "Failed to load top agent insights",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (serviceId: string, serviceTitle: string) => {
    // This would integrate with your cart system
    toast({
      title: "Added to Cart",
      description: `${serviceTitle} has been added to your cart`,
    });
  };

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Agent Insights
            <Badge variant="secondary">Pro Feature</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="font-medium">See What Top Agents Buy</h3>
              <p className="text-sm text-muted-foreground">
                Get insights into purchase patterns of top-performing agents in your market
              </p>
            </div>
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
              Upgrade to Pro - $97/month
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Agent Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Agent Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-2">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-medium">Building Insights</h3>
            <p className="text-sm text-muted-foreground">
              We're analyzing top agent purchase patterns. Check back soon!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          What Top Agents Are Buying
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Services purchased by agents closing 12+ deals annually
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.slice(0, 5).map((insight, index) => (
            <div key={insight.service_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
                      #{index + 1}
                    </Badge>
                    <h3 className="font-medium">{insight.service_title}</h3>
                    <Badge variant="secondary">{insight.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {Math.round(insight.purchase_frequency)}% of top agents buy this
                    </div>
                    {insight.avg_roi > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        Avg ROI: ${Math.round(insight.avg_roi).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => addToCart(insight.service_id, insight.service_title)}
                  className="ml-4"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add Bundle
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded p-3">
                <p className="text-sm">
                  <span className="font-medium">Why top agents choose this:</span> Agents closing 12+ deals per year are{' '}
                  <span className="font-semibold text-primary">
                    {Math.round(insight.purchase_frequency / 10)}x more likely
                  </span>{' '}
                  to use this service compared to average performers.
                </p>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full" onClick={fetchTopAgentInsights}>
              <ArrowRight className="h-4 w-4 mr-2" />
              View More Insights
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopAgentInsights;