import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Eye, Filter } from 'lucide-react';
import { AgentProfileModal } from './AgentProfileModal';

interface SSPFilters {
  location: string;
  minBuyerCount: string;
  maxBuyerCount: string;
  minSellerCount: string;
  maxSellerCount: string;
  loanTypes: string[];
  minPrice: string;
  maxPrice: string;
  propertyTypes: string[];
  titleCompany: string;
  lender: string;
  timePeriod: string;
}

// Mock data for demonstration
const mockAgents = [
  {
    id: '1',
    name: 'Nikki L.',
    buyerCount: 43,
    sellerCount: 33,
    avgPrice: 540000,
    volume: 41000000,
    titleCompanies: 2,
    lenders: 4,
    brokerage: 'Keller Williams',
    email: 'nikki@example.com',
    phone: '(555) 123-4567',
  },
  {
    id: '2',
    name: 'John D.',
    buyerCount: 38,
    sellerCount: 28,
    avgPrice: 485000,
    volume: 32000000,
    titleCompanies: 3,
    lenders: 5,
    brokerage: 'RE/MAX',
    email: 'john@example.com',
    phone: '(555) 987-6543',
  },
  {
    id: '3',
    name: 'Sarah M.',
    buyerCount: 52,
    sellerCount: 41,
    avgPrice: 612000,
    volume: 57000000,
    titleCompanies: 2,
    lenders: 3,
    brokerage: 'Coldwell Banker',
    email: 'sarah@example.com',
    phone: '(555) 456-7890',
  },
];

export const SSPView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [filters, setFilters] = useState<SSPFilters>({
    location: '',
    minBuyerCount: '',
    maxBuyerCount: '',
    minSellerCount: '',
    maxSellerCount: '',
    loanTypes: [],
    minPrice: '',
    maxPrice: '',
    propertyTypes: [],
    titleCompany: '',
    lender: '',
    timePeriod: '12',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredAgents = mockAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.brokerage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Agent Search & Analytics</CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search agents by name or brokerage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  placeholder="City, Zip, County..."
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Buyer Count</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    value={filters.minBuyerCount}
                    onChange={(e) => setFilters({...filters, minBuyerCount: e.target.value})}
                  />
                  <Input
                    placeholder="Max"
                    value={filters.maxBuyerCount}
                    onChange={(e) => setFilters({...filters, maxBuyerCount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Seller Count</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    value={filters.minSellerCount}
                    onChange={(e) => setFilters({...filters, minSellerCount: e.target.value})}
                  />
                  <Input
                    placeholder="Max"
                    value={filters.maxSellerCount}
                    onChange={(e) => setFilters({...filters, maxSellerCount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Time Period</label>
                <Select
                  value={filters.timePeriod}
                  onValueChange={(value) => setFilters({...filters, timePeriod: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  />
                  <Input
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Loan Types</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select types..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conventional">Conventional</SelectItem>
                    <SelectItem value="fha">FHA</SelectItem>
                    <SelectItem value="va">VA</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Property Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select types..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sfh">Single Family</SelectItem>
                    <SelectItem value="townhome">Townhome</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Title Company</label>
                <Input
                  placeholder="Search title companies..."
                  value={filters.titleCompany}
                  onChange={(e) => setFilters({...filters, titleCompany: e.target.value})}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Results ({filteredAgents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead className="text-center">Buyer Ct</TableHead>
                <TableHead className="text-center">Seller Ct</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-center">Title Co</TableHead>
                <TableHead className="text-center">Lenders</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">{agent.brokerage}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{agent.buyerCount}</TableCell>
                  <TableCell className="text-center">{agent.sellerCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(agent.avgPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(agent.volume)}</TableCell>
                  <TableCell className="text-center">{agent.titleCompanies}</TableCell>
                  <TableCell className="text-center">{agent.lenders}</TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedAgent(agent)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{agent.name} - Detailed Profile</DialogTitle>
                        </DialogHeader>
                        {selectedAgent && <AgentProfileModal agent={selectedAgent} />}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};