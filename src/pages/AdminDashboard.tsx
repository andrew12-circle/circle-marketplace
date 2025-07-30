import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Star } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { ContentPromotionPanel } from '@/components/admin/ContentPromotionPanel';
import { YouTubeImportPanel } from '@/components/admin/YouTubeImportPanel';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  business_name: string | null;
  is_creator: boolean | null;
  creator_verified: boolean | null;
  creator_joined_at: string | null;
  specialties: string[] | null;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Check if user is admin
  const isAdmin = profile?.specialties?.includes('admin') || false;

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      return;
    }

    fetchUsers();
  }, [user, isAdmin, loading]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleCreatorStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const updates: any = {
        is_creator: !currentStatus,
      };

      // If enabling creator status, set joined date
      if (!currentStatus) {
        updates.creator_joined_at = new Date().toISOString();
      } else {
        // If disabling, clear creator fields
        updates.creator_joined_at = null;
        updates.creator_verified = false;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, ...updates }
          : user
      ));

      toast({
        title: 'Success',
        description: `Creator status ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating creator status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update creator status',
        variant: 'destructive',
      });
    }
  };

  const toggleVerificationStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ creator_verified: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, creator_verified: !currentStatus }
          : user
      ));

      toast({
        title: 'Success',
        description: `Creator ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      let specialties = users.find(u => u.user_id === userId)?.specialties || [];
      
      if (!currentStatus) {
        // Add admin to specialties
        specialties = [...(specialties || []), 'admin'];
      } else {
        // Remove admin from specialties
        specialties = (specialties || []).filter(s => s !== 'admin');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ specialties })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, specialties }
          : user
      ));

      toast({
        title: 'Success',
        description: `Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`,
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update admin status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage users and creator permissions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentPromotionPanel />
        <YouTubeImportPanel />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management ({users.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <p>Loading users...</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">
                        {user.display_name || user.business_name || 'Unnamed User'}
                      </h3>
                      {user.specialties?.includes('admin') && (
                        <Badge variant="destructive">Admin</Badge>
                      )}
                      {user.is_creator && (
                        <Badge variant="secondary">Creator</Badge>
                      )}
                      {user.creator_verified && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                      {user.creator_joined_at && (
                        <span className="ml-4">
                          Creator since: {new Date(user.creator_joined_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Admin</label>
                      <Switch
                        checked={user.specialties?.includes('admin') || false}
                        onCheckedChange={() => toggleAdminStatus(user.user_id, user.specialties?.includes('admin') || false)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Creator</label>
                      <Switch
                        checked={user.is_creator || false}
                        onCheckedChange={() => toggleCreatorStatus(user.user_id, user.is_creator || false)}
                      />
                    </div>

                    {user.is_creator && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Verified</label>
                        <Switch
                          checked={user.creator_verified || false}
                          onCheckedChange={() => toggleVerificationStatus(user.user_id, user.creator_verified || false)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}