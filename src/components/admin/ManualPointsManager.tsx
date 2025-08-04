import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Coins, Users, TrendingUp, History } from 'lucide-react';

interface User {
  user_id: string;
  display_name: string;
  email: string;
  circle_points: number;
}

interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'addition' | 'deduction';
  reason: string;
  admin_notes: string;
  created_at: string;
  admin_id: string;
  user_name: string;
}

export function ManualPointsManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  
  const [formData, setFormData] = useState({
    points: '',
    reason: '',
    admin_notes: ''
  });

  useEffect(() => {
    loadUsers();
    loadRecentTransactions();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, circle_points')
        .not('display_name', 'is', null)
        .order('display_name');

      if (error) throw error;

      // For now, we'll use a placeholder email since auth.admin requires service role
      const enrichedUsers = data?.map(user => ({
        ...user,
        email: 'Available in profile', // Could be fetched with service role
        circle_points: user.circle_points || 0
      })) || [];

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      // This would require a manual_point_transactions table
      // For now, we'll just show empty state
      setTransactions([]);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPoints = async () => {
    if (!selectedUser || !formData.points || !formData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const pointsToAdd = parseInt(formData.points);
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive number of points",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Update user's circle_points
      const newTotal = selectedUser.circle_points + pointsToAdd;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ circle_points: newTotal })
        .eq('user_id', selectedUser.user_id);

      if (updateError) throw updateError;

      // Log the transaction in audit_log for tracking
      const { error: auditError } = await supabase
        .from('audit_log')
        .insert({
          operation: 'manual_points_addition',
          table_name: 'profiles',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          old_data: { circle_points: selectedUser.circle_points },
          new_data: { 
            circle_points: newTotal,
            reason: formData.reason,
            admin_notes: formData.admin_notes,
            target_user: selectedUser.user_id
          }
        });

      if (auditError) console.warn('Audit log failed:', auditError);

      toast({
        title: "Success",
        description: `Added ${pointsToAdd} points to ${selectedUser.display_name}'s wallet`,
      });

      // Update local state
      setUsers(users.map(user => 
        user.user_id === selectedUser.user_id 
          ? { ...user, circle_points: newTotal }
          : user
      ));
      
      setSelectedUser({ ...selectedUser, circle_points: newTotal });

      // Reset form
      setFormData({
        points: '',
        reason: '',
        admin_notes: ''
      });

    } catch (error: any) {
      console.error('Error adding points:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add points",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manual Points Manager</h2>
          <p className="text-muted-foreground">Add points directly to user wallets</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Points Distributed</p>
                <p className="text-2xl font-bold">
                  {users.reduce((sum, user) => sum + user.circle_points, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Average Per User</p>
                <p className="text-2xl font-bold">
                  {users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.circle_points, 0) / users.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.user_id === user.user_id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current Points</p>
                      <p className="font-bold text-green-600">{user.circle_points}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Points Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedUser ? (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedUser.display_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-sm">Current Points: <span className="font-bold text-green-600">{selectedUser.circle_points}</span></p>
                </div>

                <div>
                  <Label htmlFor="points">Points to Add *</Label>
                  <Input
                    id="points"
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    placeholder="e.g., 1000"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonus">Bonus/Reward</SelectItem>
                      <SelectItem value="compensation">Compensation</SelectItem>
                      <SelectItem value="promotion">Promotional Credits</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="correction">Balance Correction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="admin_notes">Admin Notes</Label>
                  <Textarea
                    id="admin_notes"
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                    placeholder="Additional notes for internal tracking..."
                  />
                </div>

                <Button 
                  onClick={handleAddPoints} 
                  disabled={loading || !formData.points || !formData.reason}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Adding Points...' : 'Add Points'}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a user from the list to add points</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}