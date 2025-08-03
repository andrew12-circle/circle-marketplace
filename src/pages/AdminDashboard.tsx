import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Star, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { SecureAdminGuard } from '@/components/admin/SecureAdminGuard';
import { useSecureAdminOperations } from '@/hooks/useSecureAdminOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContentPromotionPanel } from '@/components/admin/ContentPromotionPanel';
import { YouTubeImportPanel } from '@/components/admin/YouTubeImportPanel';
import { YouTubeChannelImportPanel } from '@/components/admin/YouTubeChannelImportPanel';
import SecurityMonitoringPanel from '@/components/admin/SecurityMonitoringPanel';
import { RESPAComplianceManager } from '@/components/admin/RESPAComplianceManager';
import { AdvancedSplitCalculator } from '@/components/admin/AdvancedSplitCalculator';
import { SecurityEventMonitor } from '@/components/security/SecurityEventMonitor';
import { SecurityAuditLog } from '@/components/security/SecurityAuditLog';
import { ServiceImportPanel } from '@/components/admin/ServiceImportPanel';
import { ServiceManagementPanel } from '@/components/admin/ServiceManagementPanel';
import { VendorImportPanel } from '@/components/admin/VendorImportPanel';
import { VendorBudgetManager } from '@/components/admin/VendorBudgetManager';
import { VendorRESPAManager } from '@/components/admin/VendorRESPAManager';
import { VendorSortOrderManager } from '@/components/admin/VendorSortOrderManager';
import { VendorManagementPanel } from '@/components/admin/VendorManagementPanel';
import { ImageVectorizationPanel } from '@/components/admin/ImageVectorizationPanel';
import { VendorActivityAnalytics } from '@/components/admin/VendorActivityAnalytics';
import { VendorInvitationPanel } from '@/components/admin/VendorInvitationPanel';
import { AgentInvitationPanel } from '@/components/admin/AgentInvitationPanel';
import VendorPointAllocationPanel from '@/components/admin/VendorPointAllocationPanel';
import AntiScrapingSystem from '@/components/security/AntiScrapingSystem';
import { CreatorPayoutDashboard } from '@/components/admin/CreatorPayoutDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Upload, Building, Youtube, DollarSign, BarChart3, Coins, Shield as ShieldIcon, Users2, Send, BookOpen } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  
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

    fetchUsers();
  }, [user, isAdmin, loading]);

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
          <SecurityMonitoringPanel />
          <SecurityEventMonitor />
          <SecurityAuditLog />

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

                      <div className="flex items-center gap-4">
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
                      </div>
                    </div>
                  ))}
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
          <RESPAComplianceManager />
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <AdvancedSplitCalculator />
        </TabsContent>
      </Tabs>
      </div>
    </SecureAdminGuard>
  );
}