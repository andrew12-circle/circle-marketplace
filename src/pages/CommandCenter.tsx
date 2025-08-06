import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  TrendingUp, 
  MapPin, 
  PieChart, 
  BarChart3, 
  Brain, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Crown,
  Target,
  DollarSign,
  Users,
  Activity,
  Search,
  Filter,
  Eye,
  MessageSquare,
  UserPlus,
  Clock,
  Zap
} from "lucide-react";
import { NavigationTabs } from "@/components/NavigationTabs";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { LegalFooter } from "@/components/LegalFooter";
import { useToast } from "@/hooks/use-toast";

// Interfaces
interface Campaign {
  id: string;
  name: string;
  vendor: string;
  status: 'complete' | 'pending' | 'approved';
  points_used: number;
  created_at: string;
}

interface VendorRelationship {
  vendor_name: string;
  campaigns_used: number;
  total_points_contributed: number;
  avg_response_time: string;
}

interface AgentData {
  id: string;
  name: string;
  company: string;
  buyer_count: number;
  seller_count: number;
  total_volume: number;
  points_redeemed: number;
  active_vendors: number;
  email: string;
  phone: string;
  last_12mo_production: {
    buyer_side: number;
    seller_side: number;
  };
  campaign_history: Campaign[];
}

interface ActivityLog {
  id: string;
  type: 'points_earned' | 'campaign_launched' | 'proof_uploaded' | 'wallet_deposit';
  message: string;
  timestamp: string;
  vendor?: string;
  amount?: number;
}

const CommandCenter = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Realtor-specific state
  const [circlePoints, setCirclePoints] = useState(1250);
  const [vendorsActivated, setVendorsActivated] = useState(5);
  const [estimatedValue, setEstimatedValue] = useState(3100);
  const [closingsTracked, setClosingsTracked] = useState(11);
  const [walletBalance, setWalletBalance] = useState(520);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [vendorRelationships, setVendorRelationships] = useState<VendorRelationship[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  
  // SSP-specific state
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    min_buyer_volume: '',
    max_buyer_volume: '',
    min_seller_volume: '',
    max_seller_volume: '',
    min_transaction_count: '',
    active_vendors: ''
  });
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [agentDetailOpen, setAgentDetailOpen] = useState(false);

  // Determine user role
  const isRealtor = profile?.specialties?.includes('realtor') || profile?.specialties?.includes('real_estate');
  const isSSP = profile?.specialties?.includes('ssp') || profile?.specialties?.includes('vendor');

  useEffect(() => {
    loadMockData();
  }, [user?.id]);

  const loadMockData = () => {
    // Mock campaigns data
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Buyer Video Ad',
        vendor: '360 Branding',
        status: 'complete',
        points_used: 150,
        created_at: '2024-01-15'
      },
      {
        id: '2',
        name: 'Listing Mailer',
        vendor: 'Postcard Pro',
        status: 'pending',
        points_used: 110,
        created_at: '2024-01-20'
      },
      {
        id: '3',
        name: 'Instagram Reels Campaign',
        vendor: 'Agent Media Lab',
        status: 'approved',
        points_used: 200,
        created_at: '2024-01-25'
      }
    ];

    // Mock vendor relationships
    const mockVendorRelationships: VendorRelationship[] = [
      {
        vendor_name: '360 Branding',
        campaigns_used: 3,
        total_points_contributed: 420,
        avg_response_time: '2.4 days'
      },
      {
        vendor_name: 'HOI Hub',
        campaigns_used: 1,
        total_points_contributed: 75,
        avg_response_time: '1.2 days'
      },
      {
        vendor_name: 'Postcard Pro',
        campaigns_used: 2,
        total_points_contributed: 185,
        avg_response_time: '3.1 days'
      }
    ];

    // Mock activity log
    const mockActivityLog: ActivityLog[] = [
      {
        id: '1',
        type: 'points_earned',
        message: '360 Branding contributed $125 to your "Just Listed Postcard" campaign.',
        timestamp: '2024-01-25T10:30:00Z',
        vendor: '360 Branding',
        amount: 125
      },
      {
        id: '2',
        type: 'campaign_launched',
        message: 'You approved Instagram Reels campaign creative from Agent Media Lab.',
        timestamp: '2024-01-24T14:15:00Z',
        vendor: 'Agent Media Lab'
      },
      {
        id: '3',
        type: 'wallet_deposit',
        message: 'Wallet deposit of $50 processed successfully.',
        timestamp: '2024-01-23T09:45:00Z',
        amount: 50
      }
    ];

    // Mock agent data for SSP view
    const mockAgentData: AgentData[] = [
      {
        id: '1',
        name: 'Lauren James',
        company: 'Keller Williams Realty',
        buyer_count: 33,
        seller_count: 14,
        total_volume: 17800000,
        points_redeemed: 1250,
        active_vendors: 3,
        email: 'lauren.james@kw.com',
        phone: '(615) 555-0123',
        last_12mo_production: {
          buyer_side: 15200000,
          seller_side: 2600000
        },
        campaign_history: mockCampaigns
      },
      {
        id: '2',
        name: 'Michael Rodriguez',
        company: 'RE/MAX Elite',
        buyer_count: 28,
        seller_count: 19,
        total_volume: 14200000,
        points_redeemed: 980,
        active_vendors: 2,
        email: 'michael.r@remax.com',
        phone: '(615) 555-0124',
        last_12mo_production: {
          buyer_side: 8400000,
          seller_side: 5800000
        },
        campaign_history: []
      }
    ];

    setCampaigns(mockCampaigns);
    setVendorRelationships(mockVendorRelationships);
    setActivityLog(mockActivityLog);
    setAgentData(mockAgentData);
    setLoading(false);
  };

  const handleAgentSelect = (agent: AgentData) => {
    setSelectedAgent(agent);
    setAgentDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your command center...</p>
        </div>
      </div>
    );
  }

  const circleLogoUrl = "/lovable-uploads/97692497-6d98-46a8-b6fc-05cd68bdc160.png";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src={circleLogoUrl}
                alt="Circle Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            
            <div className="hidden sm:flex flex-1 justify-center">
              <NavigationTabs />
            </div>
            
            <div className="sm:hidden flex-1 px-4">
              <div className="flex bg-muted rounded-full p-1">
                <Link to="/" className="flex-1 text-xs py-2 px-2 rounded-full font-medium transition-all text-center text-muted-foreground">
                  Market
                </Link>
                <Link to="/command-center" className="flex-1 text-xs py-2 px-2 rounded-full font-medium transition-all text-center bg-background text-foreground shadow-sm">
                  Command
                </Link>
                <Link to="/academy" className="flex-1 text-xs py-2 px-2 rounded-full font-medium transition-all text-center text-muted-foreground">
                  Academy
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSwitcher />
              <LocationSwitcher />
              
              {user && profile && (
                <Link to="/wallet" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer touch-target">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  <span className="font-medium">{profile.circle_points}</span>
                  <span className="text-muted-foreground hidden sm:inline">Points</span>
                </Link>
              )}
              
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {isRealtor ? 'My Command Center' : isSSP ? 'Agent Lookup & Insights' : 'Command Center'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isRealtor 
              ? 'Your marketing campaigns, points, and vendor relationships at a glance.'
              : isSSP 
              ? 'Discover agents, track relationships, and manage your service partnerships.'
              : 'Your business performance dashboard.'
            }
          </p>
        </div>

        {/* Realtor View */}
        {isRealtor && (
          <>
            {/* Overview Header - Hero Metrics */}
            <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">{circlePoints.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Circle Points</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">{vendorsActivated}</div>
                    <div className="text-sm text-muted-foreground">Vendors Activated</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">${estimatedValue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Estimated Value</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">{closingsTracked}</div>
                    <div className="text-sm text-muted-foreground">Closings Tracked</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Activity Feed */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityLog.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="mt-1">
                          {activity.type === 'points_earned' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {activity.type === 'campaign_launched' && <Zap className="w-4 h-4 text-blue-500" />}
                          {activity.type === 'proof_uploaded' && <Eye className="w-4 h-4 text-purple-500" />}
                          {activity.type === 'wallet_deposit' && <DollarSign className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        {activity.amount && (
                          <Badge variant="secondary">${activity.amount}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Marketing Wallet Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Marketing Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">${walletBalance}</div>
                      <div className="text-sm text-muted-foreground">Current Balance</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Points Redeemed</span>
                        <span className="font-medium">460 pts</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Est. Impact</span>
                        <span className="font-medium">12K reach</span>
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      <Link to="/wallet">View Full Wallet</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Cards */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Campaign Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points Used</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>{campaign.vendor}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                campaign.status === 'complete' ? 'default' : 
                                campaign.status === 'pending' ? 'secondary' : 'outline'
                              }
                            >
                              {campaign.status === 'complete' ? '✅ Complete' : 
                               campaign.status === 'pending' ? '🕓 Pending' : '✏️ Approved'}
                            </Badge>
                          </TableCell>
                          <TableCell>{campaign.points_used} pts</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              {campaign.status === 'complete' ? 'View Proof' : 'Approve Creative'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Relationship Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Vendor Relationships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Campaigns Used</TableHead>
                        <TableHead>Total Points Contributed</TableHead>
                        <TableHead>Avg Response Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorRelationships.map((vendor, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                          <TableCell>{vendor.campaigns_used}</TableCell>
                          <TableCell>{vendor.total_points_contributed} pts</TableCell>
                          <TableCell>{vendor.avg_response_time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* SSP View */}
        {isSSP && (
          <>
            {/* Search Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Realtors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Location</label>
                    <Input
                      placeholder="City, State"
                      value={searchFilters.location}
                      onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Min Buyer Volume</label>
                    <Select onValueChange={(value) => setSearchFilters({...searchFilters, min_buyer_volume: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">$1M+</SelectItem>
                        <SelectItem value="5m">$5M+</SelectItem>
                        <SelectItem value="10m">$10M+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Transaction Count</label>
                    <Select onValueChange={(value) => setSearchFilters({...searchFilters, min_transaction_count: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10+</SelectItem>
                        <SelectItem value="20">20+</SelectItem>
                        <SelectItem value="50">50+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Active Vendors</label>
                    <Select onValueChange={(value) => setSearchFilters({...searchFilters, active_vendors: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 flex items-end gap-2">
                    <Button className="flex-1">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                    <Button variant="outline">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Production Table */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Agent Production Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Buyer Count</TableHead>
                        <TableHead>Seller Count</TableHead>
                        <TableHead>Total Volume</TableHead>
                        <TableHead>Points Redeemed</TableHead>
                        <TableHead>Active Vendors</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentData.map((agent) => (
                        <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{agent.company}</TableCell>
                          <TableCell>{agent.buyer_count}</TableCell>
                          <TableCell>{agent.seller_count}</TableCell>
                          <TableCell>${(agent.total_volume / 1000000).toFixed(1)}M</TableCell>
                          <TableCell>{agent.points_redeemed.toLocaleString()} pts</TableCell>
                          <TableCell>{agent.active_vendors}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAgentSelect(agent)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Contribution Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Your Contribution Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">24</div>
                    <div className="text-sm text-muted-foreground">Agents Supported</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">$8,400</div>
                    <div className="text-sm text-muted-foreground">Total Co-Pay Contribution</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">4.8⭐</div>
                    <div className="text-sm text-muted-foreground">Agent Feedback Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">320%</div>
                    <div className="text-sm text-muted-foreground">Estimated ROI</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Agent Detail Modal */}
        <Dialog open={agentDetailOpen} onOpenChange={setAgentDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agent Details - {selectedAgent?.name}</DialogTitle>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedAgent.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedAgent.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Company:</span>
                        <span>{selectedAgent.company}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Production Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Last 12 Months Production</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Buyer Side:</span>
                        <span>${(selectedAgent.last_12mo_production.buyer_side / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seller Side:</span>
                        <span>${(selectedAgent.last_12mo_production.seller_side / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Volume:</span>
                        <span className="font-medium">${(selectedAgent.total_volume / 1000000).toFixed(1)}M</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4">
                  <Button className="flex-1">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Offer Coverage
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <LegalFooter />
    </div>
  );
};

export default CommandCenter;