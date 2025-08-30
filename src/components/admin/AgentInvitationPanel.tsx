import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus
} from 'lucide-react';

interface AgentInvitation {
  id: string;
  agent_email: string;
  agent_name: string;
  agent_company: string;
  status: string;
  invited_at: string;
  responded_at: string | null;
}

export const AgentInvitationPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<AgentInvitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    agent_email: '',
    agent_name: '',
    agent_company: '',
    invitation_message: `Hi [Agent Name],

I hope this email finds you well! I'm reaching out because I've been following your success in real estate, and I'm impressed by your achievements.

We're launching an exciting opportunity at Circle Network where top-performing agents like yourself can share their expertise and earn substantial income. Here's what makes this special:

🎯 **Create Agent Playbooks**: Share your proven strategies, systems, and processes
💰 **Earn $69.30 per sale**: We price playbooks at $99, you keep 70% ($69.30 each)
📈 **Help Other Agents**: Your expertise helps agents across the country succeed
🏆 **Build Authority**: Establish yourself as a thought leader in real estate

We're specifically looking for agents who have:
- Consistent high performance in their market
- Proven systems and processes that work
- A willingness to share their knowledge
- Stories of overcoming challenges

If this sounds interesting, I'd love to set up a quick call to discuss how this could work for you. The platform handles all the technical aspects - you just focus on sharing your expertise.

Would you be open to a brief conversation about this opportunity?

Best regards,
[Your Name]
Circle Network Team

P.S. We're starting with a small group of elite agents, so spots are limited.`
  });

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_invitations')
        .select('*')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setInvitations((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invitations',
        variant: 'destructive'
      });
    }
  };

  const sendInvitation = async () => {
    if (!formData.agent_email || !formData.agent_name) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agent_invitations')
        .insert({
          agent_email: formData.agent_email,
          agent_name: formData.agent_name,
          agent_company: formData.agent_company,
          invitation_message: formData.invitation_message.replace('[Agent Name]', formData.agent_name),
          invited_by: user?.id
        } as any);

      if (error) throw error;

      toast({
        title: 'Invitation Sent!',
        description: `Invitation sent to ${formData.agent_name}`,
      });

      // Reset form
      setFormData({
        agent_email: '',
        agent_name: '',
        agent_company: '',
        invitation_message: formData.invitation_message
      });
      setShowInviteForm(false);
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      sent: 'secondary',
      accepted: 'default',
      declined: 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Agent Invitation System</h2>
          <p className="text-muted-foreground">Invite top agents to create playbooks and earn revenue</p>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{invitations.length}</p>
              </div>
              <Send className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{invitations.filter(i => i.status === 'accepted').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{invitations.filter(i => i.status === 'sent').length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">
                  {invitations.length > 0 ? Math.round((invitations.filter(i => i.status !== 'sent').length / invitations.length) * 100) : 0}%
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitation Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Top Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="agent_name">Agent Name *</Label>
                <Input
                  id="agent_name"
                  value={formData.agent_name}
                  onChange={(e) => setFormData({...formData, agent_name: e.target.value})}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="agent_email">Email Address *</Label>
                <Input
                  id="agent_email"
                  type="email"
                  value={formData.agent_email}
                  onChange={(e) => setFormData({...formData, agent_email: e.target.value})}
                  placeholder="john@realtygroup.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="agent_company">Company/Brokerage</Label>
              <Input
                id="agent_company"
                value={formData.agent_company}
                onChange={(e) => setFormData({...formData, agent_company: e.target.value})}
                placeholder="Realty Group Inc."
              />
            </div>
            <div>
              <Label htmlFor="invitation_message">Invitation Message</Label>
              <Textarea
                id="invitation_message"
                value={formData.invitation_message}
                onChange={(e) => setFormData({...formData, invitation_message: e.target.value})}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={sendInvitation} disabled={loading}>
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invitation.agent_name}</div>
                      <div className="text-sm text-muted-foreground">{invitation.agent_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{invitation.agent_company || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invitation.status)}
                      {getStatusBadge(invitation.status)}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(invitation.invited_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {invitation.responded_at ? new Date(invitation.responded_at).toLocaleDateString() : '-'}
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