import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Users, Search, Filter, MoreHorizontal, Key, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { logEvent } from '@/lib/events';

interface UserProfile {
  id: string;
  user_id: string;
  email?: string;
  display_name: string | null;
  business_name: string | null;
  is_creator: boolean | null;
  creator_verified: boolean | null;
  creator_joined_at: string | null;
  specialties: string[] | null;
  is_admin: boolean | null;
  is_pro?: boolean | null;
  is_pro_member?: boolean | null;
  created_at: string;
  updated_at: string;
}

// Helper functions
const isMaybeUUID = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  return new Promise((resolve, reject) => {
    t = setTimeout(() => reject(new Error("users_fetch_timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); })
     .catch((e) => { clearTimeout(t); reject(e); });
  });
}

export const OptimizedUserManagement = () => {
  const { toast } = useToast();
  
  // State management
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const USERS_PER_PAGE = 20;
  
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Debounce effect
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Load users effect
  useEffect(() => {
    loadUsers();
  }, [currentPage, debouncedSearchTerm, userFilter]);

  // Filter users effect
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, userFilter, currentPage]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (currentPage - 1) * USERS_PER_PAGE;
      const to = from + USERS_PER_PAGE - 1;

      // Build query safely: search only text cols by default
      let query = supabase
        .from('profiles')
        .select(
          `
            id,
            user_id,
            display_name,
            business_name,
            is_admin,
            is_pro_member,
            is_pro,
            is_creator,
            creator_verified,
            creator_joined_at,
            specialties,
            created_at,
            updated_at
          `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (userFilter === 'admins') {
        query = query.eq('is_admin', true);
      } else if (userFilter === 'creators') {
        query = query.eq('is_creator', true);
      } else if (userFilter === 'pro') {
        query = query.or('is_pro.eq.true,is_pro_member.eq.true');
      } else if (userFilter === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('created_at', sevenDaysAgo.toISOString());
      }

      const term = debouncedSearchTerm;
      if (term) {
        // Default to text ilike search
        const searchConditions = [
          `display_name.ilike.%${term}%`,
          `business_name.ilike.%${term}%`
        ];
        
        // Optionally include exact id match ONLY if UUID
        if (isMaybeUUID(term)) {
          searchConditions.push(`user_id.eq.${term}`);
        }
        
        query = query.or(searchConditions.join(','));
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const rows = data || [];
      // Normalize Pro flag without changing UI:
      const normalized = rows.map((r: any) => ({
        ...r,
        // read: prefer is_pro_member, fall back to legacy is_pro
        __isProResolved: r.is_pro_member ?? r.is_pro ?? false,
      }));

      setUsers(normalized);
      setTotalUsers(count || 0);
      setTotalPages(Math.ceil((count || 0) / USERS_PER_PAGE));
      
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error?.message === 'users_fetch_timeout' ? 'Request timed out - please try again' : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (searchTerm && searchTerm !== debouncedSearchTerm) {
      // Client-side filtering for immediate feedback
      filtered = filtered.filter(user => 
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id.includes(searchTerm)
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: nextStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      const updateUser = (user: UserProfile & { __isProResolved?: boolean }) => 
        user.user_id === userId 
          ? { ...user, is_admin: nextStatus }
          : user;

      setUsers(users.map(updateUser));
      setFilteredUsers(filteredUsers.map(updateUser));

      toast({
        title: 'Admin Status Updated',
        description: `User ${nextStatus ? 'granted' : 'removed from'} admin privileges`,
      });
    } catch (error: any) {
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
      const nextStatus = !currentStatus;
      
      // Update both is_pro_member and is_pro for compatibility
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_pro_member: nextStatus, 
          is_pro: nextStatus 
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      const updateUser = (user: UserProfile & { __isProResolved?: boolean }) => 
        user.user_id === userId 
          ? { 
              ...user, 
              is_pro: nextStatus, 
              is_pro_member: nextStatus,
              __isProResolved: nextStatus 
            }
          : user;

      setUsers(users.map(updateUser));
      setFilteredUsers(filteredUsers.map(updateUser));

      // Log the admin action
      await logEvent('admin_pro_toggle', { 
        target_user: userId, 
        new_status: nextStatus 
      });

      toast({
        title: 'Pro Status Updated',
        description: `User ${nextStatus ? 'granted' : 'removed from'} Pro membership`,
      });
    } catch (error: any) {
      console.error('Error updating Pro status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update Pro status',
        variant: 'destructive',
      });
    }
  };

  const handleToggleCreator = async (userId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_creator: nextStatus,
          creator_joined_at: nextStatus ? new Date().toISOString() : null,
          creator_verified: nextStatus ? false : null
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      const updateUser = (user: UserProfile) => 
        user.user_id === userId 
          ? { 
              ...user, 
              is_creator: nextStatus,
              creator_joined_at: nextStatus ? new Date().toISOString() : null,
              creator_verified: nextStatus ? false : user.creator_verified
            }
          : user;

      setUsers(users.map(updateUser));
      setFilteredUsers(filteredUsers.map(updateUser));

      toast({
        title: 'Creator Status Updated',
        description: `User ${nextStatus ? 'granted' : 'removed from'} creator privileges`,
      });
    } catch (error: any) {
      console.error('Error updating creator status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update creator status',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { email }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Password Reset',
        description: data.message || 'Password reset email sent',
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Remove from local state
      setUsers(users.filter(user => user.user_id !== userId));
      setFilteredUsers(filteredUsers.filter(user => user.user_id !== userId));

      toast({
        title: 'User Deleted',
        description: 'User has been successfully deleted',
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      return;
    }

    try {
      const errors = [];
      
      for (const userId of selectedUsers) {
        try {
          const { data, error } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId }
          });
          
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
        } catch (error: any) {
          errors.push(`Failed to delete user ${userId}: ${error.message || 'Unknown error'}`);
        }
      }

      // Remove from local state (only successful deletions)
      setUsers(users.filter(user => !selectedUsers.includes(user.user_id)));
      setFilteredUsers(filteredUsers.filter(user => !selectedUsers.includes(user.user_id)));
      setSelectedUsers([]);

      if (errors.length > 0) {
        toast({
          title: 'Partial Success',
          description: `${selectedUsers.length - errors.length} users deleted successfully. ${errors.length} failed.`,
          variant: 'destructive',
        });
        console.error('Bulk delete errors:', errors);
      } else {
        toast({
          title: 'Bulk Delete Complete',
          description: `Successfully deleted ${selectedUsers.length} users`,
        });
      }
    } catch (error: any) {
      console.error('Error in bulk delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete users',
        variant: 'destructive',
      });
    }
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderUserRow = (user: UserProfile & { __isProResolved?: boolean }) => (
    <tr key={user.user_id} className="border-b hover:bg-muted/50">
      <td className="p-4">
        <Checkbox
          checked={selectedUsers.includes(user.user_id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedUsers([...selectedUsers, user.user_id]);
            } else {
              setSelectedUsers(selectedUsers.filter(id => id !== user.user_id));
            }
          }}
        />
      </td>
      <td className="p-4">
        <div>
          <div className="font-medium">{user.display_name || 'No name'}</div>
          <div className="text-sm text-muted-foreground">ID: {user.user_id.slice(0, 8)}...</div>
          {user.business_name && (
            <div className="text-xs text-muted-foreground">{user.business_name}</div>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1">
          {user.is_admin && <Badge variant="destructive">Admin</Badge>}
          {((user.__isProResolved ?? user.is_pro_member) ?? (user.is_pro || false)) && <Badge variant="default">Pro</Badge>}
          {user.is_creator && <Badge variant="secondary">Creator</Badge>}
          {user.creator_verified && <Badge variant="outline">Verified</Badge>}
        </div>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Switch
            checked={user.is_admin || false}
            onCheckedChange={() => handleToggleAdmin(user.user_id, user.is_admin || false)}
          />
          <span className="text-xs">Admin</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Switch
            checked={(user.__isProResolved ?? user.is_pro_member) ?? (user.is_pro || false)}
            onCheckedChange={() => handleTogglePro(user.user_id, (user.__isProResolved ?? user.is_pro_member) ?? (user.is_pro || false))}
          />
          <span className="text-xs">Pro</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Switch
            checked={user.is_creator || false}
            onCheckedChange={() => handleToggleCreator(user.user_id, user.is_creator || false)}
          />
          <span className="text-xs">Creator</span>
        </div>
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleResetPassword(user.user_id, '')}>
              <Key className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteUser(user.user_id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>User Management</CardTitle>
            <Badge variant="outline">{totalUsers} users</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admins">Admins</SelectItem>
                <SelectItem value="pro">Pro Members</SelectItem>
                <SelectItem value="creators">Creators</SelectItem>
                <SelectItem value="recent">Recent (7 days)</SelectItem>
              </SelectContent>
            </Select>
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
              onClick={() => {
                setSearchTerm('');
                setUserFilter('all');
                setCurrentPage(1);
                loadUsers();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            {selectedUsers.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedUsers.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">Error loading users</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error || 'Failed to load user data'}
            </p>
            <Button 
              onClick={loadUsers}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
        {!error && filteredUsers.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No users found
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm ? 'Try adjusting your search terms' : 'No users available'}
            </p>
          </div>
        ) : !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(filteredUsers.map(u => u.user_id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Roles</th>
                    <th className="text-left p-4">Admin</th>
                    <th className="text-left p-4">Pro</th>
                    <th className="text-left p-4">Creator</th>
                    <th className="text-left p-4">Joined</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">
                          <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                        </td>
                        <td className="p-4">
                          <div className="space-y-2">
                            <div className="w-32 h-4 bg-muted animate-pulse rounded" />
                            <div className="w-48 h-3 bg-muted animate-pulse rounded" />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                        </td>
                        <td className="p-4">
                          <div className="w-8 h-5 bg-muted animate-pulse rounded" />
                        </td>
                        <td className="p-4">
                          <div className="w-8 h-5 bg-muted animate-pulse rounded" />
                        </td>
                        <td className="p-4">
                          <div className="w-8 h-5 bg-muted animate-pulse rounded" />
                        </td>
                        <td className="p-4">
                          <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                        </td>
                        <td className="p-4">
                          <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredUsers.map(renderUserRow)
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(currentPage * USERS_PER_PAGE, totalUsers)} of {totalUsers} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(1, currentPage - 2);
                      if (page > totalPages) return null;
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};