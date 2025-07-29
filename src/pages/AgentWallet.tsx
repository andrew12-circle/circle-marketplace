import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  TrendingUp, 
  Award, 
  Target, 
  History, 
  Plus, 
  Crown,
  Coins,
  Eye,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ArrowLeft
} from "lucide-react";

export const AgentWallet = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - replace with actual API calls
  const walletData = {
    availablePoints: profile?.circle_points || 0,
    pendingPoints: 125,
    totalEarned: 2850,
    thisMonthSpent: 350,
    pointsVault: profile?.circle_points || 0,
    tier: "Gold",
    nextTierPoints: 500,
    goal: {
      name: "Marketing Campaign",
      target: 1000,
      saved: 650,
      progress: 65
    }
  };

  const recentTransactions = [
    {
      id: 1,
      type: "earned",
      amount: 100,
      description: "Referral bonus - John Smith joined",
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: 2,
      type: "spent",
      amount: -50,
      description: "Digital Marketing - Facebook Ads",
      date: "2024-01-14",
      status: "completed"
    },
    {
      id: 3,
      type: "earned",
      amount: 75,
      description: "Vendor partnership bonus",
      date: "2024-01-13",
      status: "pending"
    }
  ];

  const pointsSummary = [
    {
      title: "Available Points",
      value: walletData.availablePoints,
      icon: Coins,
      description: "Ready to spend",
      color: "text-green-600"
    },
    {
      title: "Pending Points",
      value: walletData.pendingPoints,
      icon: Clock,
      description: "Processing",
      color: "text-yellow-600"
    },
    {
      title: "Total Earned",
      value: walletData.totalEarned,
      icon: TrendingUp,
      description: "All time",
      color: "text-blue-600"
    },
    {
      title: "This Month Spent",
      value: walletData.thisMonthSpent,
      icon: ArrowDownLeft,
      description: "Current month",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Marketplace</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agent Wallet</h1>
              <p className="text-muted-foreground">
                Manage your Circle Points and track your earnings
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>{walletData.tier} Tier</span>
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Points Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pointsSummary.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {item.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="earn">Earn Points</TabsTrigger>
            <TabsTrigger value="spend">Spend Points</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Goal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Current Goal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{walletData.goal.name}</h3>
                    <Badge variant="outline">{walletData.goal.progress}%</Badge>
                  </div>
                  <Progress value={walletData.goal.progress} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{walletData.goal.saved} points saved</span>
                    <span>{walletData.goal.target} points target</span>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Goal
                  </Button>
                </CardContent>
              </Card>

              {/* Points Vault */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5" />
                    <span>Points Vault</span>
                  </CardTitle>
                  <CardDescription>
                    Secure storage for your accumulated points
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <div className="text-4xl font-bold text-primary">
                      {walletData.pointsVault.toLocaleString()}
                    </div>
                    <p className="text-muted-foreground">Total Points Stored</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Deposit
                    </Button>
                    <Button variant="outline" size="sm">
                      <ArrowDownLeft className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'earned' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : ''}{transaction.amount}
                        </p>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Transactions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earn Points Tab */}
          <TabsContent value="earn" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Refer Agents</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Earn 100 points for each successful referral
                  </p>
                  <Button className="w-full">Start Referring</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Vendor Partnerships</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Partner with vendors and earn ongoing points
                  </p>
                  <Button className="w-full" variant="outline">Explore Partners</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Daily Check-ins</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Login daily to earn bonus points
                  </p>
                  <Button className="w-full" variant="outline">Check In</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Spend Points Tab */}
          <TabsContent value="spend" className="space-y-6">
            <div className="text-center py-8">
              <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Marketplace Integration</h3>
              <p className="text-muted-foreground mb-6">
                Use your points in the marketplace to purchase services and products
              </p>
              <Button size="lg">
                Go to Marketplace
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Complete history of your point transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'earned' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : ''}{transaction.amount} points
                        </p>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};