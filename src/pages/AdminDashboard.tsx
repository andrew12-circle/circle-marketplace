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
import { Users, Shield, Star, AlertTriangle, ArrowLeft, RefreshCw, ChevronDown, Key, Trash2, Activity, TrendingUp, Globe, Lock } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SecureAdminGuard } from '@/components/admin/SecureAdminGuard';
import { SpiritualAdminGuard } from '@/components/admin/SpiritualAdminGuard';
import { useSecureAdminOperations } from '@/hooks/useSecureAdminOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContentPromotionPanel } from '@/components/admin/ContentPromotionPanel';
import { YouTubeImportPanel } from '@/components/admin/YouTubeImportPanel';
import { YouTubeChannelImportPanel } from '@/components/admin/YouTubeChannelImportPanel';

import { RESPAComplianceManager } from '@/components/admin/RESPAComplianceManager';
import { RESPADisclaimerManager } from '@/components/admin/RESPADisclaimerManager';
import { ServiceDisclaimerManager } from '@/components/admin/ServiceDisclaimerManager';
import { ServiceReviewsManager } from '@/components/admin/ServiceReviewsManager';
import RESPADocumentationViewer from '@/components/admin/RESPADocumentationViewer';
import VendorSSPManager from '@/components/admin/VendorSSPManager';
import RESPAServiceManager from '@/components/admin/RESPAServiceManager';
import { AdvancedSplitCalculator } from '@/components/admin/AdvancedSplitCalculator';
import { ServiceImportPanel } from '@/components/admin/ServiceImportPanel';
import { ServiceManagementPanel } from '@/components/admin/ServiceManagementPanel';
import { VendorImportPanel } from '@/components/admin/VendorImportPanel';
import RankImpactMonitor from '@/components/admin/RankImpactMonitor';
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
import BulkFAQGenerator from '@/components/admin/BulkFAQGenerator';
import { VendorQuestionsManager } from '@/components/admin/VendorQuestionsManager';
import { AdminHealthDashboard } from '@/components/admin/AdminHealthDashboard';
import { RetentionAnalyticsDashboard } from '@/components/admin/RetentionAnalyticsDashboard';
import { SponsoredPlacementsManager } from '@/components/admin/SponsoredPlacementsManager';
import { ServiceVisibilityManager } from '@/components/admin/ServiceVisibilityManager';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Building, Youtube, DollarSign, BarChart3, Coins, Shield as ShieldIcon, Users2, Send, BookOpen, Heart, MessageSquare } from 'lucide-react';
import { SpiritualDashboard } from '@/components/admin/SpiritualDashboard';

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
        .select('*', { count: 'exact' });

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

      // Apply search - fix the search logic to avoid UUID type errors
      if (userSearchTerm) {
        // Only search in text fields, not UUID fields
        query = query.or(`display_name.ilike.%${userSearchTerm}%,business_name.ilike.%${userSearchTerm}%`);
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
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { email }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Password Reset',
        description: data.message,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive',
      });
    }
  };

  const handleSetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-set-password', {
        body: { userId, password: newPassword }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Password Updated',
        description: data.message,
      });
    } catch (error) {
      console.error('Error setting password:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set password',
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
      if (data.error) throw new Error(data.error);

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
        description: error instanceof Error ? error.message : 'Failed to delete user',
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
          if (data.error) throw new Error(data.error);
        } catch (error) {
          errors.push(`Failed to delete user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete users',
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

  const handleToggleProStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, is_pro: !currentStatus }
          : user
      ));

      toast({
        title: 'Pro Status Updated',
        description: `User ${!currentStatus ? 'granted' : 'removed'} pro membership`,
      });
    } catch (error) {
      console.error('Error updating pro status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update pro status',
        variant: 'destructive',
      });
    }
  };

  // Show loading while auth is still loading
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Only redirect after we're sure auth and profile have loaded
  if (!user || !isAdmin) {
    console.log('AdminDashboard: Redirecting user', { 
      hasUser: !!user, 
      isAdmin, 
      profileLoaded: !!profile,
      loading 
    });
    return <Navigate to="/" replace />;
  }

  return (
    <SpiritualAdminGuard operation="admin_dashboard_access">
      <SecureAdminGuard requireElevatedPrivileges={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Professional Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const state = window.history.state as { idx?: number } | null;
                    const idx = state?.idx ?? 0;
                    if (idx > 0) {
                      navigate(-1);
                    } else {
                      navigate('/', { replace: true });
                    }
                  }}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="h-6 w-px bg-slate-300" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-slate-900">Admin Console</h1>
                    <p className="text-sm text-slate-500">Enterprise Management Portal</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-emerald-700">System Operational</span>
                </div>
                <Badge variant="outline" className="bg-slate-50 border-slate-300 text-slate-700">
                  v2.4.1
                </Badge>
                <Button variant="secondary" onClick={() => navigate('/admin/commissions')}>
                  Commissions Tracking
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {securityWarnings.length > 0 && (
            <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Alerts Detected:</strong>
                <ul className="list-disc list-inside mt-2">
                  {securityWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Modern Tab Navigation */}
          <Tabs defaultValue="users" className="w-full space-y-8">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 xl:grid-cols-12 gap-1 bg-muted/50 p-1 rounded-lg h-auto">
              {/* User Management Group */}
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="creators" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Users2 className="h-4 w-4" />
                <span className="hidden sm:inline">Creators</span>
              </TabsTrigger>
              <TabsTrigger 
                value="agent-invites" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Invites</span>
              </TabsTrigger>

              {/* Content & Services Group */}
              <TabsTrigger 
                value="content" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Services</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vendors" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Vendors</span>
              </TabsTrigger>
              <TabsTrigger 
                value="youtube" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Youtube className="h-4 w-4" />
                <span className="hidden sm:inline">YouTube</span>
              </TabsTrigger>

              {/* Analytics & Operations Group */}
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sponsored" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Sponsored</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ranking" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Ranking</span>
              </TabsTrigger>
              <TabsTrigger 
                value="points" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">Points</span>
              </TabsTrigger>

              {/* Security & Compliance Group */}
              <TabsTrigger 
                value="security" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger 
                value="health" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Health</span>
              </TabsTrigger>
              <TabsTrigger 
                value="respa" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <ShieldIcon className="h-4 w-4" />
                <span className="hidden sm:inline">RESPA</span>
              </TabsTrigger>
              <TabsTrigger 
                value="spiritual" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Spiritual</span>
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="creators" className="space-y-6">
          <CreatorPayoutDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-8">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      User Management
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                      {totalUsers.toLocaleString()} registered users • {filteredUsers.length} shown
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Live</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filters - Professional Design */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        placeholder="Search by name, email, or user ID..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                      />
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-48 bg-white border-slate-200">
                      <SelectValue placeholder="Filter users" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admins">Administrators</SelectItem>
                      <SelectItem value="creators">Content Creators</SelectItem>
                      <SelectItem value="vendors">Service Vendors</SelectItem>
                      <SelectItem value="recent">New Users (7 days)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={loadUsers} 
                    disabled={loadingUsers} 
                    variant="outline"
                    className="bg-white hover:bg-slate-50 border-slate-200"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Pagination - Professional Design */}
              <div className="flex items-center justify-between mb-6 py-3 px-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="h-4 w-px bg-slate-300" />
                  <span className="text-sm text-slate-600">
                    {totalUsers.toLocaleString()} total users
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loadingUsers}
                    className="bg-white"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loadingUsers}
                    className="bg-white"
                  >
                    Next
                  </Button>
                </div>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm font-medium text-slate-600">Loading users...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <Card
                      key={user.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-slate-700">
                                  {(user.display_name || user.business_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 truncate">
                                  {user.display_name || user.business_name || 'Unnamed User'}
                                </h3>
                                <p className="text-sm text-slate-500 truncate">
                                  {user.email || `ID: ${user.user_id.slice(0, 8)}...`}
                                </p>
                              </div>
                            </div>
                            
                            {/* Status Badges */}
                            <div className="flex items-center gap-2 mb-3">
                              {user.is_admin && (
                                <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Administrator
                                </Badge>
                              )}
                              {user.is_creator && (
                                <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                                  <Star className="h-3 w-3 mr-1" />
                                  Creator
                                </Badge>
                              )}
                              {user.creator_verified && (
                                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                                  <Star className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {user.is_pro && (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Pro Member
                                </Badge>
                              )}
                            </div>
                            
                            {/* Meta Info */}
                            <div className="text-xs text-slate-500 space-x-4">
                              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                              {user.creator_joined_at && (
                                <span>Creator since {new Date(user.creator_joined_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-6 ml-6">
                            {/* Role Toggles */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col items-center gap-2">
                                <label className="text-xs font-medium text-slate-600">Admin</label>
                                <Switch
                                  checked={user.is_admin || false}
                                  disabled={operationLoading}
                                  onCheckedChange={() => handleToggleAdminStatus(user.user_id, user.is_admin || false)}
                                  className="data-[state=checked]:bg-red-600"
                                />
                              </div>
                              
                              <div className="flex flex-col items-center gap-2">
                                <label className="text-xs font-medium text-slate-600">Creator</label>
                                <Switch
                                  checked={user.is_creator || false}
                                  disabled={operationLoading}
                                  onCheckedChange={() => handleToggleCreatorStatus(user.user_id, user.is_creator || false)}
                                  className="data-[state=checked]:bg-purple-600"
                                />
                              </div>
                              
                              <div className="flex flex-col items-center gap-2">
                                <label className="text-xs font-medium text-slate-600">Pro</label>
                                <Switch
                                  checked={user.is_pro || false}
                                  disabled={operationLoading}
                                  onCheckedChange={() => handleToggleProStatus(user.user_id, user.is_pro || false)}
                                  className="data-[state=checked]:bg-amber-600"
                                />
                              </div>
                              
                              {user.is_creator && (
                                <div className="flex flex-col items-center gap-2">
                                  <label className="text-xs font-medium text-slate-600">Verified</label>
                                  <Switch
                                    checked={user.creator_verified || false}
                                    disabled={operationLoading}
                                    onCheckedChange={() => handleToggleVerificationStatus(user.user_id, user.creator_verified || false)}
                                    className="data-[state=checked]:bg-green-600"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Action Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-white hover:bg-slate-50 border-slate-200"
                                >
                                  Actions
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-lg">
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
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <Card className="mt-6 bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">{selectedUsers.length}</span>
                        </div>
                        <span className="text-sm font-medium text-blue-900">
                          {selectedUsers.length} users selected
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedUsers([])}
                          className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Clear Selection
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={handleBulkDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
          <ServiceDisclaimerManager />
          <BulkFAQGenerator />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ServiceImportPanel />
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <ServiceReviewsManager />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <div className="space-y-6">
            <VendorManagementPanel />
            
          </div>
          <VendorSSPManager />
          <VendorInvitationPanel />
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

        <TabsContent value="sponsored" className="space-y-6">
          <SponsoredPlacementsManager />
        </TabsContent>

        <TabsContent value="ranking" className="space-y-6">
          <RankImpactMonitor />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <AntiScrapingSystem />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <AdminHealthDashboard />
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
          <RESPADisclaimerManager />
          <RESPAServiceManager />
          <RESPAComplianceManager />
          <RESPADocumentationViewer />
        </TabsContent>

            <TabsContent value="spiritual" className="space-y-6">
              <SpiritualDashboard />
            </TabsContent>

            <TabsContent value="retention" className="space-y-6">
              <RetentionAnalyticsDashboard />
            </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <AdvancedSplitCalculator />
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </SecureAdminGuard>
    </SpiritualAdminGuard>
  );
}
