import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Star, 
  User, 
  TrendingUp, 
  MapPin, 
  DollarSign,
  Search,
  Filter
} from 'lucide-react';

interface AgentPlaybook {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  playbook_price: number;
  rating: number;
  total_plays: number;
  agent_tier: string;
  agent_location: string;
  agent_years_experience: number;
  agent_annual_volume: number;
  target_audience: string;
  success_metrics: any;
  tools_mentioned: any; // JSON array from database
  profiles: {
    display_name: string;
    business_name: string;
    avatar_url: string;
  };
  created_at: string;
}

export const AgentPlaybookSection = () => {
  const [playbooks, setPlaybooks] = useState<AgentPlaybook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchPlaybooks();
  }, [searchTerm, filterTier, filterAudience, sortBy]);

  const fetchPlaybooks = async () => {
    try {
      let query = supabase
        .from('content')
        .select(`
          id,
          title,
          description,
          creator_id,
          playbook_price,
          rating,
          total_plays,
          agent_tier,
          agent_location,
          agent_years_experience,
          agent_annual_volume,
          target_audience,
          success_metrics,
          tools_mentioned,
          created_at,
          profiles!creator_id (
            display_name,
            business_name,
            avatar_url
          )
        `)
        .eq('content_type', 'playbook')
        .eq('is_agent_playbook', true)
        .eq('is_published', true);

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (filterTier !== 'all') {
        query = query.eq('agent_tier', filterTier);
      }

      if (filterAudience !== 'all') {
        query = query.eq('target_audience', filterAudience);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('total_plays', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'price_low':
          query = query.order('playbook_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('playbook_price', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setPlaybooks((data || []).map(item => ({
        ...item,
        tools_mentioned: Array.isArray(item.tools_mentioned) ? item.tools_mentioned : []
      })));
    } catch (error) {
      console.error('Error fetching playbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'top_producer': return 'bg-yellow-500';
      case 'million_dollar': return 'bg-green-500';
      case 'team_leader': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAudienceBadgeColor = (audience: string) => {
    switch (audience) {
      case 'new_agents': return 'bg-emerald-500';
      case 'struggling_agents': return 'bg-orange-500';
      case 'team_builders': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Agent Success Playbooks</h2>
          <p className="text-muted-foreground">
            Learn from top-producing agents across the country
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {playbooks.length} Available
        </Badge>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search playbooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Agent Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="top_producer">Top Producer</SelectItem>
            <SelectItem value="million_dollar">Million Dollar</SelectItem>
            <SelectItem value="team_leader">Team Leader</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAudience} onValueChange={setFilterAudience}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Target Audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Audiences</SelectItem>
            <SelectItem value="new_agents">New Agents</SelectItem>
            <SelectItem value="struggling_agents">Struggling Agents</SelectItem>
            <SelectItem value="team_builders">Team Builders</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Playbooks Grid */}
      <div className="grid gap-6">
        {playbooks.map((playbook) => (
          <Card key={playbook.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left side - Agent info */}
                <div className="flex items-start gap-4 lg:w-1/3">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {playbook.profiles?.display_name || playbook.profiles?.business_name || 'Agent'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      {playbook.agent_location || 'Location not specified'}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {playbook.agent_tier && (
                        <Badge 
                          className={`text-white text-xs ${getTierBadgeColor(playbook.agent_tier)}`}
                        >
                          {playbook.agent_tier.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                      {playbook.target_audience && (
                        <Badge 
                          className={`text-white text-xs ${getAudienceBadgeColor(playbook.target_audience)}`}
                        >
                          For {playbook.target_audience.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {playbook.agent_years_experience && (
                        <span>{playbook.agent_years_experience} years experience</span>
                      )}
                      {playbook.agent_annual_volume && (
                        <span className="ml-2">• ${playbook.agent_annual_volume.toLocaleString()} annual volume</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle - Playbook content */}
                <div className="flex-1 lg:w-1/2">
                  <h4 className="font-semibold text-xl mb-2">{playbook.title}</h4>
                  <p className="text-muted-foreground mb-3 line-clamp-2">
                    {playbook.description}
                  </p>
                  
                  {playbook.tools_mentioned && playbook.tools_mentioned.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1">Tools Covered:</div>
                      <div className="flex flex-wrap gap-1">
                        {playbook.tools_mentioned.slice(0, 3).map((tool, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {playbook.tools_mentioned.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{playbook.tools_mentioned.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{playbook.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{playbook.total_plays} students</span>
                    </div>
                  </div>
                </div>

                {/* Right side - Purchase */}
                <div className="lg:w-1/4 flex flex-col justify-between">
                  <div className="text-right mb-4">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(playbook.playbook_price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      One-time purchase
                    </div>
                  </div>
                  
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Buy Playbook
                  </Button>
                  
                  <div className="text-xs text-center text-muted-foreground mt-2">
                    Instant access to all content
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {playbooks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Playbooks Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterTier !== 'all' || filterAudience !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Be the first to create an agent playbook!'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};