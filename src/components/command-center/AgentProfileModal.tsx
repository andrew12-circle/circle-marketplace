import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building, Phone, Mail, MapPin, TrendingUp, 
  DollarSign, Users, Calendar 
} from 'lucide-react';

interface AgentProfileModalProps {
  agent: {
    id: string;
    name: string;
    buyerCount: number;
    sellerCount: number;
    avgPrice: number;
    volume: number;
    titleCompanies: number;
    lenders: number;
    brokerage: string;
    email: string;
    phone: string;
  };
}

export const AgentProfileModal = ({ agent }: AgentProfileModalProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const agentInitials = agent.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${agent.name}`} />
          <AvatarFallback className="text-lg font-semibold">
            {agentInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-2xl font-bold">{agent.name}</h3>
          <p className="text-muted-foreground flex items-center gap-2 mb-2">
            <Building className="h-4 w-4" />
            {agent.brokerage}
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {agent.email}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {agent.phone}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Add to Contacts</Button>
          <Button size="sm">Connect</Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{agent.buyerCount}</div>
            <div className="text-sm text-muted-foreground">Buyer Deals</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Building className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{agent.sellerCount}</div>
            <div className="text-sm text-muted-foreground">Seller Deals</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(agent.avgPrice)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Price</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(agent.volume)}
            </div>
            <div className="text-sm text-muted-foreground">Total Volume</div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Network */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Professional Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Title Companies Used</span>
              <Badge variant="secondary">{agent.titleCompanies}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Lenders Worked With</span>
              <Badge variant="secondary">{agent.lenders}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Market Focus</span>
              <Badge>Residential</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Closed buyer deal - $580K</span>
              <span className="text-muted-foreground ml-auto">2 days ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Listed new property - $645K</span>
              <span className="text-muted-foreground ml-auto">5 days ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Contract signed - $520K</span>
              <span className="text-muted-foreground ml-auto">1 week ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mutual Connections Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Mutual Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-sm text-muted-foreground">Direct Closings</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-muted-foreground">Shared Office</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-muted-foreground">Indirect Deals</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};