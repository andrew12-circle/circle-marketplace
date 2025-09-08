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
  is_verified: boolean;
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
  } = useKeysetPagination<UserProfile>({
    rpcFunction: 'get_profiles_keyset',
    searchTerm: debouncedSearch,
    pageSize: 50,
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

      // Trigger refetch
      reset();
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update admin status',
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

      // Trigger refetch
      reset();
    } catch (error) {
      console.error('Error updating Pro status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update Pro status',
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
      key: 'is_verified' as keyof UserProfile,
      header: 'Status',
      width: 120,
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Verified' : 'Unverified'}
        </Badge>
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
        <VirtualizedTable
          data={users}
          columns={columns}
          height={600}
          itemHeight={60}
          loading={isLoading}
          onLoadMore={loadMore}
          hasNextPage={hasNextPage}
        />
      </CardContent>
    </Card>
  );
};