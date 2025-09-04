import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  DollarSign, 
  Users, 
  Home,
  Mail,
  Share2,
  Calendar,
  Star,
  ArrowRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useConcierge } from '@/hooks/useConcierge';
import { getProStatus } from '@/lib/profile';
import { useAuth } from '@/contexts/AuthContext';

const AgentConciergePanel = () => {
  const { user, profile } = useAuth();
  const { 
    isLoading, 
    context, 
    nextBestActions, 
    getConciergeContext, 
    generateNextBestActions 
  } = useConcierge();
  const [refreshing, setRefreshing] = useState(false);
  const isPro = getProStatus(profile);

  useEffect(() => {
    if (user?.id) {
      getConciergeContext();
      generateNextBestActions();
    }
  }, [user?.id]);

  const refreshInsights = async () => {
    setRefreshing(true);
    await Promise.all([
      getConciergeContext(),
      generateNextBestActions()
    ]);
    setRefreshing(false);
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading && !context) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getTimeOfDayGreeting()}, {profile?.display_name || 'Agent'}
          </h1>
          <p className="text-muted-foreground">
            Your personalized command center for business growth
          </p>
        </div>
        <Button 
          onClick={refreshInsights}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {refreshing ? 'Refreshing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Today Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {context?.pipeline?.listings || 2}
              </div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {context?.pipeline?.pendings || 1}
              </div>
              <p className="text-sm text-muted-foreground">Pending Sales</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {context?.pipeline?.hot_buyers || 3}
              </div>
              <p className="text-sm text-muted-foreground">Hot Buyers</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                $125
              </div>
              <p className="text-sm text-muted-foreground">Credits Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Best Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Next Best Actions
            {!isPro && <Badge variant="secondary">Pro Feature</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isPro ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Upgrade to Pro to unlock personalized Next Best Actions based on your performance data
              </p>
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                Upgrade to Pro - $97/month
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {nextBestActions.map((action, index) => (
                <Card key={action.id} className="border-l-4 border-l-primary/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <h3 className="font-semibold">{action.title}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            Score: {Math.round(action.score.total_score)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {action.estimated_impact}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {action.time_required}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ROI: {action.expected_roi.range}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {action.assets_generated.map((asset, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" className="ml-4">
                        Add Bundle to Cart
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Workflows */}
      <Tabs defaultValue="quick" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">Quick Actions</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Home, title: 'Listing Flyer', description: 'Generate property marketing materials' },
              { icon: Calendar, title: 'Open House Kit', description: 'Complete event marketing package' },
              { icon: Mail, title: 'Past-Client Email', description: 'Nurture your sphere campaign' },
              { icon: Share2, title: 'Social Week Plan', description: '7-day social media content' }
            ].map((action, index) => (
              <Card key={index} className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-4">
                  <div className="text-center space-y-2">
                    <action.icon className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    <Button size="sm" variant="outline" className="w-full">
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Grow Listings', description: 'Targeted marketing to attract more listings', color: 'bg-blue-50 border-blue-200' },
              { title: 'Sphere Nurture', description: 'Stay connected with past clients and referrals', color: 'bg-green-50 border-green-200' },
              { title: 'Geo Farm', description: 'Dominate a specific neighborhood or area', color: 'bg-purple-50 border-purple-200' },
              { title: 'Open House', description: 'Maximize attendance and lead capture', color: 'bg-orange-50 border-orange-200' }
            ].map((workflow, index) => (
              <Card key={index} className={`cursor-pointer hover:shadow-md transition-shadow ${workflow.color}`}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{workflow.title}</h3>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    <Button size="sm" className="w-full">
                      Start Workflow
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center py-8 space-y-2">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="font-medium">No History Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your concierge runs and generated assets will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentConciergePanel;