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
  Activity,
  Upload,
  Youtube,
  Coins,
  Star,
  Send,
  BookOpen,
  Heart,
  MessageSquare,
  Calendar,
  TrendingUp,
  Eye,
  Globe,
  Lock,
  Package
} from 'lucide-react';

// Lazy load heavy components
const OptimizedUserManagement = React.lazy(() => 
  import('./OptimizedUserManagement').then(module => ({ default: module.OptimizedUserManagement }))
);

const OptimizedOverview = React.lazy(() => 
  import('./OptimizedOverview').then(module => ({ default: module.OptimizedOverview }))
);

const VendorManagementPanelWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.VendorManagementPanelWrapper }))
);

const ServiceManagementPanelWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.ServiceManagementPanelWrapper }))
);

const RESPAComplianceManagerWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.RESPAComplianceManagerWrapper }))
);

const VendorActivityAnalyticsWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.VendorActivityAnalyticsWrapper }))
);

const CreatorPayoutDashboardWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.CreatorPayoutDashboardWrapper }))
);

const RetentionAnalyticsDashboardWrapper = React.lazy(() => 
  import('./LazyAdminPanel').then(module => ({ default: module.RetentionAnalyticsDashboardWrapper }))
);

// Additional components - fallback to placeholder if not available
const ContentPromotionPanel = React.lazy(() => 
  import('./ContentPromotionPanel').then(module => ({ default: module.ContentPromotionPanel })).catch(() => ({ default: () => <PlaceholderCard title="Content Promotion" /> }))
);

const ServiceReviewsManager = React.lazy(() => 
  import('./ServiceReviewsManager').then(module => ({ default: module.ServiceReviewsManager })).catch(() => ({ default: () => <PlaceholderCard title="Service Reviews" /> }))
);

const VendorSSPManager = React.lazy(() => 
  import('./VendorSSPManager').then(module => ({ default: module.default })).catch(() => ({ default: () => <PlaceholderCard title="Vendor SSP Manager" /> }))
);

const VendorInvitationPanel = React.lazy(() => 
  import('./VendorInvitationPanel').then(module => ({ default: module.VendorInvitationPanel })).catch(() => ({ default: () => <PlaceholderCard title="Vendor Invitations" /> }))
);

const VendorSortOrderManager = React.lazy(() => 
  import('./VendorSortOrderManager').then(module => ({ default: module.VendorSortOrderManager })).catch(() => ({ default: () => <PlaceholderCard title="Vendor Sort Order" /> }))
);

const VendorRESPAManager = React.lazy(() => 
  import('./VendorRESPAManager').then(module => ({ default: module.VendorRESPAManager })).catch(() => ({ default: () => <PlaceholderCard title="Vendor RESPA" /> }))
);

const VendorBudgetManager = React.lazy(() => 
  import('./VendorBudgetManager').then(module => ({ default: module.VendorBudgetManager })).catch(() => ({ default: () => <PlaceholderCard title="Vendor Budget" /> }))
);

const VendorPointAllocationPanel = React.lazy(() => 
  import('./VendorPointAllocationPanel').then(module => ({ default: module.default })).catch(() => ({ default: () => <PlaceholderCard title="Point Allocation" /> }))
);

const SponsoredPlacementsManager = React.lazy(() => 
  import('./SponsoredPlacementsManager').then(module => ({ default: module.SponsoredPlacementsManager })).catch(() => ({ default: () => <PlaceholderCard title="Sponsored Placements" /> }))
);

const RankImpactMonitor = React.lazy(() => 
  import('./RankImpactMonitor').then(module => ({ default: module.default })).catch(() => ({ default: () => <PlaceholderCard title="Rank Impact Monitor" /> }))
);

const AntiScrapingSystem = React.lazy(() => 
  import('../security/AntiScrapingSystem').then(module => ({ default: module.default })).catch(() => ({ default: () => <PlaceholderCard title="Security System" /> }))
);

const AdminHealthDashboard = React.lazy(() => 
  import('./AdminHealthDashboard').then(module => ({ default: module.AdminHealthDashboard })).catch(() => ({ default: () => <PlaceholderCard title="System Health" /> }))
);

const YouTubeImportPanel = React.lazy(() => 
  import('./YouTubeImportPanel').then(module => ({ default: module.YouTubeImportPanel })).catch(() => ({ default: () => <PlaceholderCard title="YouTube Import" /> }))
);

const YouTubeChannelImportPanel = React.lazy(() => 
  import('./YouTubeChannelImportPanel').then(module => ({ default: module.YouTubeChannelImportPanel })).catch(() => ({ default: () => <PlaceholderCard title="YouTube Channels" /> }))
);

const AgentInvitationPanel = React.lazy(() => 
  import('./AgentInvitationPanel').then(module => ({ default: module.AgentInvitationPanel })).catch(() => ({ default: () => <PlaceholderCard title="Agent Invitations" /> }))
);

const RESPADisclaimerManager = React.lazy(() => 
  import('./RESPADisclaimerManager').then(module => ({ default: module.RESPADisclaimerManager })).catch(() => ({ default: () => <PlaceholderCard title="RESPA Disclaimers" /> }))
);

const RESPAServiceManager = React.lazy(() => 
  import('./RESPAServiceManager').then(module => ({ default: module.default })).catch(() => ({ default: () => <PlaceholderCard title="RESPA Services" /> }))
);

const RESPADocumentationViewer = React.lazy(() => 
  import('./RESPADocumentationViewer').then(module => ({ default: module.default })).catch(() => ({ default: () => <PlaceholderCard title="RESPA Documentation" /> }))
);

const SpiritualDashboard = React.lazy(() => 
  import('./SpiritualDashboard').then(module => ({ default: module.SpiritualDashboard })).catch(() => ({ default: () => <PlaceholderCard title="Spiritual Dashboard" /> }))
);

const AdminAffiliates = React.lazy(() => 
  import('./AdminAffiliates').then(module => ({ default: module.AdminAffiliates })).catch(() => ({ default: () => <PlaceholderCard title="Affiliate Management" /> }))
);

const AdvancedSplitCalculator = React.lazy(() => 
  import('./AdvancedSplitCalculator').then(module => ({ default: module.AdvancedSplitCalculator })).catch(() => ({ default: () => <PlaceholderCard title="Split Calculator" /> }))
);

const AdminBookings = React.lazy(() => 
  import('../../pages/AdminBookings').then(module => ({ default: module.default })).catch(() => ({ default: () => <PlaceholderCard title="Booking Management" /> }))
);


const VendorImportPanel = React.lazy(() => 
  import('./VendorImportPanel').then(module => ({ default: module.VendorImportPanel })).catch(() => ({ default: () => <PlaceholderCard title="Vendor Import" /> }))
);

// Placeholder component for missing functionality
const PlaceholderCard = ({ title }: { title: string }) => (
  <Card>
    <CardContent className="p-6 text-center">
      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">
        This feature is being restored from the previous admin dashboard.
      </p>
    </CardContent>
  </Card>
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
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2 whitespace-nowrap">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 whitespace-nowrap">
              <Upload className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2 whitespace-nowrap">
              <BarChart3 className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2 whitespace-nowrap">
              <Star className="h-4 w-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2 whitespace-nowrap">
              <Building className="h-4 w-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center gap-2 whitespace-nowrap">
              <Coins className="h-4 w-4" />
              Points
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 whitespace-nowrap">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="sponsored" className="flex items-center gap-2 whitespace-nowrap">
              <Eye className="h-4 w-4" />
              Sponsored
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2 whitespace-nowrap">
              <BarChart3 className="h-4 w-4" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 whitespace-nowrap">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2 whitespace-nowrap">
              <Activity className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2 whitespace-nowrap">
              <Youtube className="h-4 w-4" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="agent-invites" className="flex items-center gap-2 whitespace-nowrap">
              <Send className="h-4 w-4" />
              Agent Invites
            </TabsTrigger>
            <TabsTrigger value="respa" className="flex items-center gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4" />
              RESPA
            </TabsTrigger>
            <TabsTrigger value="spiritual" className="flex items-center gap-2 whitespace-nowrap">
              <Heart className="h-4 w-4" />
              Spiritual
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2 whitespace-nowrap">
              <DollarSign className="h-4 w-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="flex items-center gap-2 whitespace-nowrap">
              <Globe className="h-4 w-4" />
              Affiliates
            </TabsTrigger>
            <TabsTrigger value="retention" className="flex items-center gap-2 whitespace-nowrap">
              <TrendingUp className="h-4 w-4" />
              Retention
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2 whitespace-nowrap">
              <BarChart3 className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 whitespace-nowrap">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Overview Dashboard" />}>
            <OptimizedOverview />
          </Suspense>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="User Management" />}>
            <OptimizedUserManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Content Management" />}>
            <ContentPromotionPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Service Management" />}>
            <ServiceManagementPanelWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Reviews Management" />}>
            <ServiceReviewsManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Vendor Management" />}>
            <div className="space-y-6">
              <VendorManagementPanelWrapper />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VendorSSPManager />
                <VendorInvitationPanel />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <VendorSortOrderManager />
                <VendorRESPAManager />
                <VendorBudgetManager />
              </div>
              <VendorImportPanel />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="points" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Points Management" />}>
            <VendorPointAllocationPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Analytics Dashboard" />}>
            <VendorActivityAnalyticsWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="sponsored" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Sponsored Placements" />}>
            <SponsoredPlacementsManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Ranking Monitor" />}>
            <RankImpactMonitor />
          </Suspense>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Security System" />}>
            <AntiScrapingSystem />
          </Suspense>
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="System Health" />}>
            <AdminHealthDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="youtube" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="YouTube Import" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <YouTubeImportPanel />
              <YouTubeChannelImportPanel />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="agent-invites" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Agent Invitations" />}>
            <AgentInvitationPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="respa" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="RESPA Compliance" />}>
            <div className="space-y-6">
              <RESPADisclaimerManager />
              <RESPAServiceManager />
              <RESPAComplianceManagerWrapper />
              <RESPADocumentationViewer />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="spiritual" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Spiritual Dashboard" />}>
            <SpiritualDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Commissions Tracking</h3>
              <p className="text-muted-foreground mb-4">
                Monitor and manage commission structures
              </p>
              <button 
                onClick={() => window.open('/admin/commissions', '_blank')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Open Commissions Dashboard
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Affiliate Management" />}>
            <AdminAffiliates />
          </Suspense>
        </TabsContent>

        <TabsContent value="retention" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Retention Analytics" />}>
            <RetentionAnalyticsDashboardWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="calculator" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Split Calculator" />}>
            <AdvancedSplitCalculator />
          </Suspense>
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <Suspense fallback={<TabLoadingFallback title="Booking Management" />}>
            <AdminBookings />
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