import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Search, Plus, Eye } from 'lucide-react';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  user_email?: string;
  user_name?: string;
}

interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

export const CustomerSupportTools = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form states for new ticket
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium' as const
  });

  const fetchTickets = async () => {
    try {
      // In a real implementation, this would fetch from a support_tickets table
      // For now, we'll use mock data
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          user_id: 'user1',
          subject: 'Unable to book consultation',
          description: 'I am experiencing issues when trying to book a consultation with a vendor.',
          status: 'open',
          priority: 'high',
          category: 'technical',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user_email: 'user@example.com',
          user_name: 'John Doe'
        },
        {
          id: '2',
          user_id: 'user2',
          subject: 'Payment issue',
          description: 'My payment was processed but the service was not activated.',
          status: 'in_progress',
          priority: 'urgent',
          category: 'billing',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          assigned_to: user?.id,
          user_email: 'customer@example.com',
          user_name: 'Jane Smith'
        },
        {
          id: '3',
          user_id: 'user3',
          subject: 'Account verification',
          description: 'I submitted my documents for verification but have not heard back.',
          status: 'resolved',
          priority: 'medium',
          category: 'account',
          created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user_email: 'vendor@example.com',
          user_name: 'Mike Johnson'
        }
      ];

      setTickets(mockTickets);

      // Calculate metrics
      const totalTickets = mockTickets.length;
      const openTickets = mockTickets.filter(t => t.status === 'open').length;
      const resolvedTickets = mockTickets.filter(t => t.status === 'resolved').length;

      setMetrics({
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResponseTime: 2.5, // hours
        avgResolutionTime: 24 // hours
      });

    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    try {
      // In a real implementation, this would insert into support_tickets table
      const newTicket: SupportTicket = {
        id: Date.now().toString(),
        user_id: user?.id || '',
        subject: newTicketForm.subject,
        description: newTicketForm.description,
        status: 'open',
        priority: newTicketForm.priority,
        category: newTicketForm.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_email: user?.email || '',
        user_name: user?.email?.split('@')[0] || 'User'
      };

      setTickets(prev => [newTicket, ...prev]);
      setNewTicketForm({ subject: '', description: '', category: '', priority: 'medium' });
      setNewTicketOpen(false);

      toast({
        title: "Success",
        description: "Support ticket created successfully"
      });

    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive"
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() }
          : ticket
      ));

      toast({
        title: "Success",
        description: "Ticket status updated successfully"
      });

    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Support</h1>
          <p className="text-muted-foreground">Manage and respond to customer inquiries</p>
        </div>
        <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Submit a new support request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Subject"
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
              />
              <Select
                value={newTicketForm.category}
                onValueChange={(value) => setNewTicketForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="general">General Inquiry</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newTicketForm.priority}
                onValueChange={(value) => setNewTicketForm(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Describe your issue..."
                value={newTicketForm.description}
                onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
              <Button onClick={createTicket} className="w-full">
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTickets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.openTickets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.resolvedTickets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgResponseTime || 0}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgResolutionTime || 0}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    #{ticket.id}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {ticket.user_name} ({ticket.user_email})
                </div>
                <div>Created: {new Date(ticket.created_at).toLocaleDateString()}</div>
                <div>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{ticket.description}</p>
              <div className="flex gap-2">
                {ticket.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                  >
                    Start Working
                  </Button>
                )}
                {ticket.status === 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                  >
                    Mark Resolved
                  </Button>
                )}
                {ticket.status === 'resolved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTicketStatus(ticket.id, 'closed')}
                  >
                    Close Ticket
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tickets found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};