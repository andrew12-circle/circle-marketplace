import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VirtualizedTable } from './VirtualizedTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Users, Search, Filter, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
  user_id: string;
  display_name: string;
  is_admin: boolean;
  is_pro_member: boolean;
  created_at: string;
  updated_at: string;
}

export const OptimizedUserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [degradedMode, setDegraded] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Direct Supabase query instead of relying on RPC
  const { data: users = [], isLoading, error, refetch } = useQuery<UserProfile[]>({
    queryKey: ['user-profiles', debouncedSearch],
    queryFn: async (): Promise<UserProfile[]> => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 15000)
      );

      const queryPromise = async (): Promise<UserProfile[]> => {
        let query = supabase
          .from('profiles')
          .select('user_id, display_name, is_admin, is_pro_member, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(500);

        if (debouncedSearch) {
          query = query.or(`display_name.ilike.%${debouncedSearch}%,business_name.ilike.%${debouncedSearch}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as UserProfile[];
      };

      try {
        const result = await Promise.race([queryPromise(), timeoutPromise]);
        setDegraded(false);
        return result;
      } catch (error: any) {
        if (error.message === 'Query timeout') {
          setDegraded(true);
          return [];
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Debug logging
  console.log('User Management Debug:', {
    users: users,
    isLoading,
    error,
    userCount: users?.length || 0
  });

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('admin_toggle_admin_status', {
        target_user: userId,
        new_status: !currentStatus,
      });

      if (error) throw error;

      toast({
        title: 'Admin Status Updated',
        description: `User ${!currentStatus ? 'granted' : 'removed from'} admin privileges`,
      });

      refetch();
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      const isRpcMissing = error?.message?.includes('function') || error?.code === '42883';
      toast({
        title: 'Error',
        description: isRpcMissing ? 'Admin functions not yet deployed' : 'Failed to update admin status',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePro = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('admin_set_pro_status', {
        target_user: userId,
        pro: !currentStatus,
      });

      if (error) throw error;

      toast({
        title: 'Pro Status Updated',
        description: `User ${!currentStatus ? 'granted' : 'removed from'} Pro membership`,
      });

      refetch();
    } catch (error: any) {
      console.error('Error updating Pro status:', error);
      const isRpcMissing = error?.message?.includes('function') || error?.code === '42883';
      toast({
        title: 'Error',
        description: isRpcMissing ? 'Admin functions not yet deployed' : 'Failed to update Pro status',
        variant: 'destructive',
      });
    }
  };

  const columns = useMemo(() => [
    {
      key: 'display_name' as keyof UserProfile,
      header: 'Name',
      width: 200,
      render: (value: string) => (
        <div className="font-medium">{value || 'No name'}</div>
      ),
    },
    {
      key: 'is_admin' as keyof UserProfile,
      header: 'Admin',
      width: 100,
      render: (value: boolean, user: UserProfile) => (
        <Switch
          checked={value}
          onCheckedChange={() => handleToggleAdmin(user.user_id, value)}
        />
      ),
    },
    {
      key: 'is_pro_member' as keyof UserProfile,
      header: 'Pro',
      width: 100,
      render: (value: boolean, user: UserProfile) => (
        <Switch
          checked={value}
          onCheckedChange={() => handleTogglePro(user.user_id, value)}
        />
      ),
    },
    {
      key: 'created_at' as keyof UserProfile,
      header: 'Joined',
      width: 150,
      render: (value: string) => (
        <div className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </div>
      ),
    },
  ], []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>User Management</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {degradedMode && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System is running in degraded mode due to timeout. Some features may be limited.
              <Button 
                variant="link" 
                className="p-0 ml-2 h-auto" 
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">Error loading users</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message || 'Failed to load user data'}
            </p>
            <Button 
              onClick={() => refetch()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        )}
        {!error && users.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No users found
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {debouncedSearch ? 'Try adjusting your search terms' : 'No users available'}
            </p>
          </div>
        ) : !error && (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="font-medium">{user.display_name || 'No name'}</div>
                  <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </Badge>
                  <Badge variant={user.is_pro_member ? 'default' : 'outline'}>
                    {user.is_pro_member ? 'Pro' : 'Free'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <Switch
                    checked={user.is_admin}
                    onCheckedChange={() => handleToggleAdmin(user.user_id, user.is_admin)}
                  />
                  <Switch
                    checked={user.is_pro_member}
                    onCheckedChange={() => handleTogglePro(user.user_id, user.is_pro_member)}
                  />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};