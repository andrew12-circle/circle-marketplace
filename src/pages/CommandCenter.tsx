import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Target,
  DollarSign,
  Users,
  Activity,
  Eye,
  MessageSquare,
  UserPlus,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { NavigationTabs } from "@/components/NavigationTabs";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { LegalFooter } from "@/components/LegalFooter";

const CommandCenter = () => {
  console.log("CommandCenter component rendering");
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");

  // Mock data for realtor view
  const realtorMetrics = {
    circle_points: 1250,
    vendors_activated: 5,
    estimated_value: 3100,
    closings_tracked: 11
  };

  const activityFeed = [
    { id: 1, message: "360 Branding contributed $125 to your \"Just Listed Postcard\" campaign.", time: "2 hours ago" },
    { id: 2, message: "You approved Instagram Reels campaign creative from Agent Media Lab.", time: "4 hours ago" },
    { id: 3, message: "Received $75 wallet deposit from Postcard Pro.", time: "1 day ago" }
  ];

  const campaigns = [
    { id: "1", name: "Buyer Video Ad", vendor: "360 Branding", status: "complete", points_used: 150 },
    { id: "2", name: "Listing Mailer", vendor: "Postcard Pro", status: "pending", points_used: 110 },
    { id: "3", name: "Social Media Package", vendor: "Agent Media Lab", status: "approved", points_used: 200 }
  ];

  // Default to realtor view for now
  const isRealtor = true;

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
          <h1 className="text-3xl font-bold mb-2">My Command Center</h1>
          <p className="text-muted-foreground">
            Monitor your campaigns, track points, and manage vendor relationships
          </p>
        </div>

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
        </div>
      </div>

      <LegalFooter />
    </div>
  );
};

export default CommandCenter;