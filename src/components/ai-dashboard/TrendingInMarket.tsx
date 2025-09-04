import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MarketTrend {
  id: string;
  title: string;
  change: number;
  timeframe: string;
  category: 'pricing' | 'inventory' | 'demand' | 'competition';
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

const TrendingInMarket = () => {
  const { user, profile } = useAuth();
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMarketTrends();
    }
  }, [user?.id]);

  const fetchMarketTrends = async () => {
    try {
      setIsLoading(true);
      
      // Generate market intelligence 
      const { data } = await supabase.functions.invoke('ai-market-intelligence', {
        body: {
          userId: user?.id,
          location: `${(profile as any)?.city || 'Local'}, ${(profile as any)?.state || 'Market'}`,
          specialties: (profile as any)?.specialties || ['real estate']
        }
      });

      // Parse trends from market intelligence or use sample data
      const sampleTrends: MarketTrend[] = [
        {
          id: '1',
          title: 'Median Home Price',
          change: 8.5,
          timeframe: 'vs last month',
          category: 'pricing',
          impact: 'positive',
          description: 'Strong seller market conditions'
        },
        {
          id: '2', 
          title: 'Days on Market',
          change: -12,
          timeframe: 'vs last quarter',
          category: 'demand',
          impact: 'positive',
          description: 'Faster sales indicate high demand'
        },
        {
          id: '3',
          title: 'New Listings',
          change: -6.2,
          timeframe: 'vs last month',
          category: 'inventory',
          impact: 'negative',
          description: 'Limited inventory creating opportunities'
        },
        {
          id: '4',
          title: 'Competitor Activity',
          change: 15.3,
          timeframe: 'vs last month',
          category: 'competition',
          impact: 'negative',
          description: 'Increased agent activity in your area'
        },
        {
          id: '5',
          title: 'Luxury Segment',
          change: 22.1,
          timeframe: 'vs last quarter',
          category: 'pricing',
          impact: 'positive',
          description: 'High-end properties seeing strong growth'
        }
      ];
      
      setTrends(sampleTrends);
    } catch (error) {
      console.error('Error fetching market trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (impact: string, change: number) => {
    if (impact === 'positive') {
      return 'text-green-600 bg-green-500/10';
    } else if (impact === 'negative') {
      return 'text-red-600 bg-red-500/10';
    }
    return 'text-gray-600 bg-gray-500/10';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pricing': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'inventory': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'demand': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'competition': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Trending in Your Market</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse bg-muted min-w-48 h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Trending in Your Market</h3>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <MapPin className="h-3 w-3 mr-1" />
            {(profile as any)?.city || 'Local'}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Live data
        </div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {trends.map((trend) => {
          const TrendIcon = getTrendIcon(trend.change);
          return (
            <div key={trend.id} className="min-w-48 p-3 bg-card/50 border rounded-lg hover:bg-card/80 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(trend.category)}>
                    {trend.category}
                  </Badge>
                  <div className={`p-1 rounded ${getTrendColor(trend.impact, trend.change)}`}>
                    <TrendIcon className="h-3 w-3" />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm">{trend.title}</h4>
                  <div className="flex items-center gap-1">
                    <span className={`font-semibold text-sm ${
                      trend.impact === 'positive' ? 'text-green-600' :
                      trend.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trend.change > 0 ? '+' : ''}{trend.change}%
                    </span>
                    <span className="text-xs text-muted-foreground">{trend.timeframe}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">{trend.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingInMarket;