import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Target,
  DollarSign,
  Users,
  Activity,
  Search,
  Eye,
  MessageSquare,
  UserPlus,
  Crown,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { NavigationTabs } from "@/components/NavigationTabs";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { LegalFooter } from "@/components/LegalFooter";

// Mock data interfaces
interface Campaign {
  id: string;
  name: string;
  vendor: string;
  status: 'complete' | 'pending' | 'approved';
  points_used: number;
}

interface Agent {
  id: string;
  name: string;
  buyer_count: number;
  seller_count: number;
  total_volume: string;
  points_redeemed: number;
  active_vendors: number;
  email: string;
  phone: string;
}

interface VendorContribution {
  vendor_name: string;
  campaigns_used: number;
  total_points: number;
  avg_response_time: string;
}

const CommandCenter = () => {
  console.log("CommandCenter component rendering");
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Mock data
  const realtorMetrics = {
    circle_points: 1250,
    vendors_activated: 5,
    estimated_value: 3100,
    closings_tracked: 11
  };

  const activityFeed = [
    { id: 1, message: "360 Branding contributed $125 to your \"Just Listed Postcard\" campaign.", time: "2 hours ago", type: "contribution" },
    { id: 2, message: "You approved Instagram Reels campaign creative from Agent Media Lab.", time: "4 hours ago", type: "approval" },
    { id: 3, message: "Received $75 wallet deposit from Postcard Pro.", time: "1 day ago", type: "deposit" }
  ];

  const campaigns: Campaign[] = [
    { id: "1", name: "Buyer Video Ad", vendor: "360 Branding", status: "complete", points_used: 150 },
    { id: "2", name: "Listing Mailer", vendor: "Postcard Pro", status: "pending", points_used: 110 },
    { id: "3", name: "Social Media Package", vendor: "Agent Media Lab", status: "approved", points_used: 200 }
  ];

  const vendorContributions: VendorContribution[] = [
    { vendor_name: "360 Branding", campaigns_used: 3, total_points: 420, avg_response_time: "2.4 days" },
    { vendor_name: "HOI Hub", campaigns_used: 1, total_points: 75, avg_response_time: "1.2 days" },
    { vendor_name: "Agent Media Lab", campaigns_used: 2, total_points: 285, avg_response_time: "3.1 days" }
  ];

  const agents: Agent[] = [
    {
      id: "1",
      name: "Lauren James",
      buyer_count: 33,
      seller_count: 14,
      total_volume: "$17.8M",
      points_redeemed: 1250,
      active_vendors: 3,
      email: "lauren@example.com",
      phone: "(555) 123-4567"
    },
    {
      id: "2", 
      name: "Michael Chen",
      buyer_count: 28,
      seller_count: 19,
      total_volume: "$21.2M",
      points_redeemed: 1850,
      active_vendors: 4,
      email: "michael@example.com",
      phone: "(555) 234-5678"
    }
  ];

  // Default to realtor view since we have mock data for now
  const isRealtor = true;
  const isSSP = false;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">Circle</h1>
              <NavigationTabs />
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <LocationSwitcher />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isRealtor ? "My Command Center" : "Agent Lookup & Insights"}
          </h1>
          <p className="text-muted-foreground">
            {isRealtor 
              ? "Monitor your campaigns, track points, and manage vendor relationships"
              : "Discover agents, track contributions, and analyze market opportunities"
            }
          </p>
        </div>

        {isRealtor ? (
          // Realtor View
          <div className="space-y-6">
            {/* Overview Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Circle Points</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtorMetrics.circle_points}</div>
                  <p className="text-xs text-muted-foreground">Real-time balance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Vendors Activated</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtorMetrics.vendors_activated}</div>
                  <p className="text-xs text-muted-foreground">This year</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Estimated Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${realtorMetrics.estimated_value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Marketing support unlocked</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Closings Tracked</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtorMetrics.closings_tracked}</div>
                  <p className="text-xs text-muted-foreground">Transactions this year</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityFeed.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Marketing Wallet Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Current Balance</span>
                      <span className="font-bold text-lg">${(realtorMetrics.circle_points * 0.5).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Points Redeemed</span>
                      <span className="text-sm text-muted-foreground">847 pts</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>360 Branding</span>
                        <span>$210</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Agent Media Lab</span>
                        <span>$142</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Postcard Pro</span>
                        <span>$85</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(campaign.status)}
                            <Badge variant={campaign.status === 'complete' ? 'default' : 'secondary'}>
                              {campaign.status}
                            </Badge>
                          </div>
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
              </CardContent>
            </Card>

            {/* Vendor Relationship Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Relationships</CardTitle>
              </CardHeader>
              <CardContent>
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
                    {vendorContributions.map((vendor) => (
                      <TableRow key={vendor.vendor_name}>
                        <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                        <TableCell>{vendor.campaigns_used}</TableCell>
                        <TableCell>{vendor.total_points} pts</TableCell>
                        <TableCell>{vendor.avg_response_time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          // SSP View
          <div className="space-y-6">
            {/* Search Realtors */}
            <Card>
              <CardHeader>
                <CardTitle>Search Realtors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="austin">Austin, TX</SelectItem>
                      <SelectItem value="dallas">Dallas, TX</SelectItem>
                      <SelectItem value="houston">Houston, TX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Agent Production Table */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Production Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Buyer Count</TableHead>
                      <TableHead>Seller Count</TableHead>
                      <TableHead>Total Volume</TableHead>
                      <TableHead>Points Redeemed</TableHead>
                      <TableHead>Active Vendors</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{agent.buyer_count}</TableCell>
                        <TableCell>{agent.seller_count}</TableCell>
                        <TableCell>{agent.total_volume}</TableCell>
                        <TableCell>{agent.points_redeemed} pts</TableCell>
                        <TableCell>{agent.active_vendors}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedAgent(agent)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Agent Details: {agent.name}</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4 py-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Contact Information</h4>
                                  <p className="text-sm">Email: {agent.email}</p>
                                  <p className="text-sm">Phone: {agent.phone}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Production (Last 12 Months)</h4>
                                  <p className="text-sm">Buyer Transactions: {agent.buyer_count}</p>
                                  <p className="text-sm">Seller Transactions: {agent.seller_count}</p>
                                  <p className="text-sm">Total Volume: {agent.total_volume}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Campaign Activity</h4>
                                  <p className="text-sm">Points Redeemed: {agent.points_redeemed}</p>
                                  <p className="text-sm">Active Vendors: {agent.active_vendors}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Quick Actions</h4>
                                  <div className="space-y-2">
                                    <Button size="sm" className="w-full">
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Offer Coverage
                                    </Button>
                                    <Button variant="outline" size="sm" className="w-full">
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Send Message
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Vendor Contribution Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Agents Supported</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">47</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Contribution</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$18,450</div>
                  <p className="text-xs text-muted-foreground">This quarter</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">Agent feedback</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <LegalFooter />
    </div>
  );
};

export default CommandCenter;