import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Building, 
  BarChart3, 
  Settings,
  Shield,
  DollarSign,
  Activity
} from 'lucide-react';

// Lazy load heavy components
const OptimizedUserManagement = React.lazy(() => 
  import('./OptimizedUserManagement').then(module => ({ default: module.OptimizedUserManagement }))
);

const VendorManagementPanelWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.VendorManagementPanelWrapper }))
);

const ServiceManagementPanelWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.ServiceManagementPanelWrapper }))
);

const AdminDashboard = React.lazy(() => 
  import('./AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);

const RESPAComplianceManagerWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.RESPAComplianceManagerWrapper }))
);

// Loading fallback component
const TabLoadingFallback = ({ title }: { title: string }) => (
  <Card>
    <CardContent className="p-8">
      <div className="flex items-center justify-center space-y-4 flex-col">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-muted-foreground">Loading {title}...</p>
      </div>
    </CardContent>
  </Card>
);

export const OptimizedAdminTabs = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7 gap-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Overview Dashboard" />}>
            <AdminDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="User Management" />}>
            <OptimizedUserManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Vendor Management" />}>
            <VendorManagementPanelWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Service Management" />}>
            <ServiceManagementPanelWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Analytics features coming soon with improved performance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="RESPA Compliance" />}>
            <RESPAComplianceManagerWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Settings</h3>
              <p className="text-muted-foreground">
                Advanced system configuration options.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};