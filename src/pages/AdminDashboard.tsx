import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Star, AlertTriangle, ArrowLeft, RefreshCw, ChevronDown, Key, Trash2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SecureAdminGuard } from '@/components/admin/SecureAdminGuard';
import { useSecureAdminOperations } from '@/hooks/useSecureAdminOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContentPromotionPanel } from '@/components/admin/ContentPromotionPanel';
import { YouTubeImportPanel } from '@/components/admin/YouTubeImportPanel';
import { YouTubeChannelImportPanel } from '@/components/admin/YouTubeChannelImportPanel';

import { RESPAComplianceManager } from '@/components/admin/RESPAComplianceManager';
import RESPADocumentationViewer from '@/components/admin/RESPADocumentationViewer';
import VendorSSPManager from '@/components/admin/VendorSSPManager';
import RESPAServiceManager from '@/components/admin/RESPAServiceManager';
import { AdvancedSplitCalculator } from '@/components/admin/AdvancedSplitCalculator';
import { ServiceImportPanel } from '@/components/admin/ServiceImportPanel';
import { ServiceManagementPanel } from '@/components/admin/ServiceManagementPanel';
import { VendorImportPanel } from '@/components/admin/VendorImportPanel';
import { VendorManagementPanel } from '@/components/admin/VendorManagementPanel';
import { VendorBudgetManager } from '@/components/admin/VendorBudgetManager';
import { VendorRESPAManager } from '@/components/admin/VendorRESPAManager';
import { VendorSortOrderManager } from '@/components/admin/VendorSortOrderManager';
import { VendorActivityAnalytics } from '@/components/admin/VendorActivityAnalytics';
import { VendorInvitationPanel } from '@/components/admin/VendorInvitationPanel';
import { AgentInvitationPanel } from '@/components/admin/AgentInvitationPanel';
import VendorPointAllocationPanel from '@/components/admin/VendorPointAllocationPanel';
import AntiScrapingSystem from '@/components/security/AntiScrapingSystem';
import { CreatorPayoutDashboard } from '@/components/admin/CreatorPayoutDashboard';
import { ImageVectorizationPanel } from '@/components/admin/ImageVectorizationPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Upload, Building, Youtube, DollarSign, BarChart3, Coins, Shield as ShieldIcon, Users2, Send, BookOpen } from 'lucide-react';

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
  created_at: string;
}

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  
  // Enhanced user management state
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const USERS_PER_PAGE = 20;
  
  const {
    loading: operationLoading,
    toggleAdminStatus,
    toggleCreatorStatus,
    toggleVerificationStatus
  } = useSecureAdminOperations();

  // Check if user is admin
  const isAdmin = profile?.is_admin || false;

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      return;
    }

    loadUsers();
  }, [user, isAdmin, loading, currentPage, userSearchTerm, userFilter]);

  useEffect(() => {
    filterUsers();
  }, [users, userSearchTerm, userFilter, currentPage]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          auth_users:user_id (email)
        `, { count: 'exact' });

      // Apply filters
      if (userFilter === 'admins') {
        query = query.eq('is_admin', true);
      } else if (userFilter === 'creators') {
        query = query.eq('is_creator', true);
      } else if (userFilter === 'vendors') {
        query = query.eq('vendor_enabled', true);
      } else if (userFilter === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('created_at', sevenDaysAgo.toISOString());
      }

      // Apply search
      if (userSearchTerm) {
        query = query.or(`display_name.ilike.%${userSearchTerm}%,business_name.ilike.%${userSearchTerm}%,user_id.eq.${userSearchTerm}`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE - 1);

      if (error) throw error;
      
      setUsers(data || []);
      setTotalUsers(count || 0);
      setTotalPages(Math.ceil((count || 0) / USERS_PER_PAGE));
      
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (userSearchTerm) {
      filtered = filtered.filter(user => 
        user.display_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.business_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.user_id.includes(userSearchTerm)
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });

      if (error) throw error;

      toast({
        title: 'Password Reset',
        description: `Password reset email sent to ${email}`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset password',
        variant: 'destructive',
      });
    }
  };

  const handleSetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Password Updated',
        description: 'User password has been updated successfully',
      });
    } catch (error) {
      console.error('Error setting password:', error);
      toast({
        title: 'Error',
        description: 'Failed to set password',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      // Remove from local state
      setUsers(users.filter(user => user.user_id !== userId));
      setFilteredUsers(filteredUsers.filter(user => user.user_id !== userId));

      toast({
        title: 'User Deleted',
        description: 'User has been successfully deleted',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;
      }

      // Remove from local state
      setUsers(users.filter(user => !selectedUsers.includes(user.user_id)));
      setFilteredUsers(filteredUsers.filter(user => !selectedUsers.includes(user.user_id)));
      setSelectedUsers([]);

      toast({
        title: 'Bulk Delete Complete',
        description: `Successfully deleted ${selectedUsers.length} users`,
      });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete some users',
        variant: 'destructive',
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Security check: Verify we have admin access to this data
      if (data && data.length > 0) {
        const adminCount = data.filter(user => user.is_admin).length;
        if (adminCount === 0) {
          setSecurityWarnings(prev => [...prev, 'No admin users found in system - potential security issue']);
        }
      }
      
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

  const handleToggleCreatorStatus = async (userId: string, currentStatus: boolean) => {
    const result = await toggleCreatorStatus(userId, currentStatus);
    if (result.success) {
      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { 
              ...user, 
              is_creator: !currentStatus,
              creator_joined_at: !currentStatus ? new Date().toISOString() : null,
              creator_verified: !currentStatus ? false : user.creator_verified
            }
          : user
      ));
    }
  };

  const handleToggleVerificationStatus = async (userId: string, currentStatus: boolean) => {
    const result = await toggleVerificationStatus(userId, currentStatus);
    if (result.success) {
      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, creator_verified: !currentStatus }
          : user
      ));
    }
  };

  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    const result = await toggleAdminStatus(userId, currentStatus);
    if (result.success) {
      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, is_admin: !currentStatus }
          : user
      ));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SecureAdminGuard requireElevatedPrivileges={true}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Secure Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users, content, and system operations with enhanced security
          </p>
          
          {securityWarnings.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Warnings:</strong>
                <ul className="list-disc list-inside mt-2">
                  {securityWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

      <Tabs defaultValue="users" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-12">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="creators" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Creators
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="vectorization" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Points
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            YouTube
          </TabsTrigger>
          <TabsTrigger value="agent-invites" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Agent Invites
          </TabsTrigger>
          <TabsTrigger value="respa" className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4" />
            RESPA
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="space-y-6">
          <CreatorPayoutDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Advanced User Management ({users.length} loaded)
              </CardTitle>
              <CardDescription>
                Manage user accounts, permissions, and authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search users by email, name, or ID..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                    <SelectItem value="creators">Creators Only</SelectItem>
                    <SelectItem value="vendors">Vendors Only</SelectItem>
                    <SelectItem value="recent">Recent (7 days)</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadUsers} disabled={loadingUsers} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({totalUsers} total users)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loadingUsers}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loadingUsers}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {user.display_name || user.business_name || 'Unnamed User'}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            {user.email || user.id}
                          </span>
                          {user.is_admin && (
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

                      <div className="flex items-center gap-2">
                        {/* Role Toggles */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">Admin</label>
                          <Switch
                            checked={user.is_admin || false}
                            disabled={operationLoading}
                            onCheckedChange={() => handleToggleAdminStatus(user.user_id, user.is_admin || false)}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">Creator</label>
                          <Switch
                            checked={user.is_creator || false}
                            disabled={operationLoading}
                            onCheckedChange={() => handleToggleCreatorStatus(user.user_id, user.is_creator || false)}
                          />
                        </div>

                        {user.is_creator && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Verified</label>
                            <Switch
                              checked={user.creator_verified || false}
                              disabled={operationLoading}
                              onCheckedChange={() => handleToggleVerificationStatus(user.user_id, user.creator_verified || false)}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleResetPassword(user.user_id, user.email || '')}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSetPassword(user.user_id)}>
                              <Key className="h-4 w-4 mr-2" />
                              Set New Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.user_id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedUsers.length} users selected
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedUsers([])}>
                        Clear Selection
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vectorization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Image Vectorization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageVectorizationPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContentPromotionPanel />
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ServiceManagementPanel />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ServiceImportPanel />
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <VendorSSPManager />
          <VendorInvitationPanel />
          <VendorManagementPanel />
          <VendorSortOrderManager />
          <VendorRESPAManager />
          <VendorBudgetManager />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VendorImportPanel />
          </div>
        </TabsContent>

        <TabsContent value="points" className="space-y-6">
          <VendorPointAllocationPanel />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <VendorActivityAnalytics />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <AntiScrapingSystem />
        </TabsContent>

        <TabsContent value="youtube" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <YouTubeImportPanel />
            <YouTubeChannelImportPanel />
          </div>
        </TabsContent>

        <TabsContent value="agent-invites" className="space-y-6">
          <AgentInvitationPanel />
        </TabsContent>

        <TabsContent value="respa" className="space-y-6">
          <RESPAServiceManager />
          <RESPAComplianceManager />
          <RESPADocumentationViewer />
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <AdvancedSplitCalculator />
        </TabsContent>
      </Tabs>
      </div>
    </SecureAdminGuard>
  );
}