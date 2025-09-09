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
import { useKeysetPagination } from '@/hooks/useKeysetPagination';
import { Users, Search, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface UserProfile {
  user_id: string;
  display_name: string;
  is_admin: boolean;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

export const OptimizedUserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    data: users,
    isLoading,
    hasNextPage,
    loadMore,
    reset,
    error,
  } = useKeysetPagination<UserProfile>({
    rpcFunction: 'get_profiles_keyset',
    searchTerm: debouncedSearch,
    pageSize: 50,
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

      reset();
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

      reset();
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
      key: 'is_pro' as keyof UserProfile,
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
              onClick={reset}
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">Error loading users</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message || 'Failed to load user data'}
            </p>
            <button 
              onClick={reset}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
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
          <VirtualizedTable
            data={users}
            columns={columns}
            height={600}
            itemHeight={60}
            loading={isLoading}
            onLoadMore={loadMore}
            hasNextPage={hasNextPage}
          />
        )}
      </CardContent>
    </Card>
  );
};