import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Home, DollarSign, Calendar } from 'lucide-react';

interface Deal {
  id: string;
  address: string;
  close_date?: string;
  role: 'buyer' | 'seller';
  sale_price?: number;
  lender_name?: string;
  title_company?: string;
  status: 'active' | 'under_contract' | 'closed' | 'cancelled';
  created_at: string;
  user_id: string;
}

interface DealsTableProps {
  deals: Deal[];
  onDealUpdate?: (deal: Deal) => void;
}

// Mock deals data
const mockDeals: Deal[] = [
  {
    id: '1',
    address: '1245 Oak Street, Franklin, TN',
    close_date: '2024-02-15',
    role: 'buyer',
    sale_price: 585000,
    lender_name: 'First Heritage Mortgage',
    title_company: 'Universal Title',
    status: 'closed',
    created_at: '2024-01-10',
    user_id: '1'
  },
  {
    id: '2',
    address: '3467 Maple Ave, Brentwood, TN',
    close_date: '2024-03-01',
    role: 'seller',
    sale_price: 725000,
    lender_name: 'Wells Fargo Bank',
    title_company: 'Stewart Title',
    status: 'under_contract',
    created_at: '2024-01-20',
    user_id: '1'
  },
  {
    id: '3',
    address: '789 Pine Ridge Dr, Cool Springs, TN',
    role: 'buyer',
    sale_price: 450000,
    status: 'active',
    created_at: '2024-02-01',
    user_id: '1'
  },
  {
    id: '4',
    address: '2156 Elm Court, Nashville, TN',
    close_date: '2024-01-28',
    role: 'seller',
    sale_price: 395000,
    lender_name: 'CMG Mortgage',
    title_company: 'First American',
    status: 'closed',
    created_at: '2023-12-15',
    user_id: '1'
  },
  {
    id: '5',
    address: '4523 Birch Lane, Murfreesboro, TN',
    role: 'buyer',
    sale_price: 520000,
    lender_name: 'Rocket Mortgage',
    status: 'active',
    created_at: '2024-02-10',
    user_id: '1'
  }
];

export const DealsTable = ({ deals, onDealUpdate }: DealsTableProps) => {
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Deal>>({});

  // Use mock data if no deals provided
  const displayDeals = deals.length > 0 ? deals : mockDeals;

  const startEdit = (deal: Deal) => {
    setEditingDeal(deal.id);
    setEditForm({
      lender_name: deal.lender_name,
      title_company: deal.title_company,
    });
  };

  const cancelEdit = () => {
    setEditingDeal(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingDeal || !onDealUpdate) return;
    
    const deal = displayDeals.find(d => d.id === editingDeal);
    if (!deal) return;

    const updatedDeal = {
      ...deal,
      ...editForm,
      status: (editForm.lender_name && editForm.title_company) ? 'under_contract' : 'active'
    } as Deal;

    onDealUpdate(updatedDeal);
    setEditingDeal(null);
    setEditForm({});
  };

  const getStatusIcon = (status: Deal['status']) => {
    switch (status) {
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'under_contract':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'active':
        return <Home className="h-4 w-4 text-orange-500" />;
      case 'cancelled':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Deal['status']) => {
    const variants: Record<Deal['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      closed: 'default',
      under_contract: 'secondary',
      active: 'outline',
      cancelled: 'destructive'
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Active Deals Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Close Date</TableHead>
              <TableHead>Lender</TableHead>
              <TableHead>Title Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayDeals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell className="font-medium">{deal.address}</TableCell>
                <TableCell>
                  <Badge variant={deal.role === 'buyer' ? 'default' : 'secondary'}>
                    {deal.role.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    {formatCurrency(deal.sale_price)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    {formatDate(deal.close_date)}
                  </div>
                </TableCell>
                <TableCell>
                  {editingDeal === deal.id ? (
                    <Input
                      value={editForm.lender_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, lender_name: e.target.value })}
                      placeholder="Enter lender name"
                      className="w-32"
                    />
                  ) : (
                    deal.lender_name || 'Not assigned'
                  )}
                </TableCell>
                <TableCell>
                  {editingDeal === deal.id ? (
                    <Select
                      value={editForm.title_company || ''}
                      onValueChange={(value) => setEditForm({ ...editForm, title_company: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select title co." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Universal Title">Universal Title</SelectItem>
                        <SelectItem value="Stewart Title">Stewart Title</SelectItem>
                        <SelectItem value="First American">First American</SelectItem>
                        <SelectItem value="Champion Title">Champion Title</SelectItem>
                        <SelectItem value="Old Republic">Old Republic</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    deal.title_company || 'Not assigned'
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(deal.status)}</TableCell>
                <TableCell>
                  {editingDeal === deal.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit}>Save</Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(deal)}
                      disabled={deal.status === 'closed'}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};