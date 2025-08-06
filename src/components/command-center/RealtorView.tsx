import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAgentData } from '@/hooks/useAgentData';
import { 
  Facebook, Instagram, Linkedin, Youtube, Globe,
  Search, ShoppingCart, Upload, MapPin, DollarSign,
  TrendingUp, Building, Users
} from 'lucide-react';
import { PerformanceSnapshot } from './PerformanceSnapshot';
import { LoanTypeChart } from './LoanTypeChart';
import { DealFlowChart } from './DealFlowChart';
import { TransactionMap } from './TransactionMap';
import { LenderTable } from './LenderTable';
import { TitleCompanyTable } from './TitleCompanyTable';

export const RealtorView = () => {
  const [timeRange, setTimeRange] = useState(12);
  const { agent, transactions, stats, loading, error } = useAgentData(timeRange);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Error loading agent data</p>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agent) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No agent profile found</p>
            <p className="text-sm">Please create your agent profile to view performance data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const agentInitials = `${agent.first_name[0]}${agent.last_name[0]}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Agent Contact Card */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarImage src={agent.photo_url} alt={`${agent.first_name} ${agent.last_name}`} />
              <AvatarFallback className="text-xl font-semibold">
                {agentInitials}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">
              {agent.first_name} {agent.last_name}
            </CardTitle>
            {agent.brokerage && (
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <Building className="h-4 w-4" />
                {agent.brokerage}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contact Info */}
            <div className="space-y-2">
              <p className="text-sm">{agent.email}</p>
              {agent.phone && <p className="text-sm">{agent.phone}</p>}
              {agent.years_active && (
                <p className="text-sm text-muted-foreground">
                  {agent.years_active} years active
                </p>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex justify-center space-x-3">
              {agent.social_facebook && (
                <Button variant="outline" size="icon" asChild>
                  <a href={agent.social_facebook} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {agent.social_instagram && (
                <Button variant="outline" size="icon" asChild>
                  <a href={agent.social_instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {agent.social_linkedin && (
                <Button variant="outline" size="icon" asChild>
                  <a href={agent.social_linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {agent.social_youtube && (
                <Button variant="outline" size="icon" asChild>
                  <a href={agent.social_youtube} target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {agent.social_zillow && (
                <Button variant="outline" size="icon" asChild>
                  <a href={agent.social_zillow} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Instant Track Record
              </Button>
              <Button className="w-full" variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button className="w-full" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Push to CRM
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Main Summary */}
      <div className="lg:col-span-2 space-y-6">
        {/* Time Range Toggle */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Performance Overview</CardTitle>
              <Select
                value={timeRange.toString()}
                onValueChange={(value) => setTimeRange(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                  <SelectItem value="24">Last 24 months</SelectItem>
                  <SelectItem value="36">Last 36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Performance Snapshot */}
        {stats && <PerformanceSnapshot stats={stats} />}

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <LoanTypeChart transactions={transactions} />
          <DealFlowChart transactions={transactions} />
        </div>

        {/* Map View */}
        <TransactionMap transactions={transactions} />

        {/* Tables Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <LenderTable lenders={stats?.lenders || []} />
          <TitleCompanyTable titleCompanies={stats?.titleCompanies || []} />
        </div>
      </div>
    </div>
  );
};