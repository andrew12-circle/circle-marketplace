import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, Edit, Save, X } from "lucide-react";

interface Deal {
  id: string;
  address: string;
  close_date: string;
  role: 'buyer' | 'seller';
  sale_price: number;
  lender_name?: string;
  title_company?: string;
  status: 'verified' | 'pending' | 'missing_info';
  created_at: string;
  user_id: string;
}

interface DealsTableProps {
  deals: Deal[];
  onDealUpdate: (deal: Deal) => void;
}

export const DealsTable = ({ deals, onDealUpdate }: DealsTableProps) => {
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Deal>>({});

  // Mock partner data - in production this would come from user's historical data
  const commonLenders = [
    "Jane Doe - Franklin Mortgage",
    "John Smith - Music City Lending", 
    "Sarah Wilson - First Tennessee Bank",
    "Mike Johnson - Pinnacle Financial",
    "Lisa Brown - Regions Mortgage"
  ];

  const commonTitleCompanies = [
    "Reliant Title",
    "First American Title",
    "Chicago Title",
    "Stewart Title",
    "Fidelity National Title"
  ];

  const startEdit = (deal: Deal) => {
    setEditingDeal(deal.id);
    setEditForm(deal);
  };

  const cancelEdit = () => {
    setEditingDeal(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingDeal && editForm) {
      const updatedDeal: Deal = {
        ...editForm as Deal,
        status: (editForm.lender_name && editForm.title_company) ? 'verified' : 'missing_info'
      };
      onDealUpdate(updatedDeal);
      setEditingDeal(null);
      setEditForm({});
    }
  };

  const getStatusIcon = (status: Deal['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missing_info':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Deal['status']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Verified</Badge>;
      case 'missing_info':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">⚠️ Missing Info</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Close Date</TableHead>
            <TableHead>My Role</TableHead>
            <TableHead>Sale Price</TableHead>
            <TableHead>Lender / LO</TableHead>
            <TableHead>Title Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{deal.address}</TableCell>
              <TableCell>{new Date(deal.close_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant={deal.role === 'seller' ? 'default' : 'secondary'}>
                  {deal.role === 'seller' ? 'Seller' : 'Buyer'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                ${deal.sale_price.toLocaleString()}
              </TableCell>
              <TableCell>
                {editingDeal === deal.id ? (
                  <Select
                    value={editForm.lender_name || ""}
                    onValueChange={(value) => setEditForm({...editForm, lender_name: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Partner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {commonLenders.map((lender) => (
                        <SelectItem key={lender} value={lender}>
                          {lender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={!deal.lender_name ? "text-muted-foreground" : ""}>
                    {deal.lender_name || "[Select Partner...]"}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {editingDeal === deal.id ? (
                  <Select
                    value={editForm.title_company || ""}
                    onValueChange={(value) => setEditForm({...editForm, title_company: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Partner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {commonTitleCompanies.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={!deal.title_company ? "text-muted-foreground" : ""}>
                    {deal.title_company || "[Select Partner...]"}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(deal.status)}
                  {getStatusBadge(deal.status)}
                </div>
              </TableCell>
              <TableCell>
                {editingDeal === deal.id ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={saveEdit} className="h-8 w-8 p-0">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 w-8 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => startEdit(deal)}
                    className="h-8 w-8 p-0"
                    disabled={deal.status === 'verified'}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};