import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

// Import all the lazy-loaded components from OptimizedAdminTabs
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

// Additional components with fallbacks
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

const EnhancedWebAnalyticsDashboard = React.lazy(() => 
  import('../analytics/EnhancedWebAnalyticsDashboard').then(module => ({ default: module.EnhancedWebAnalyticsDashboard })).catch(() => ({ default: () => <PlaceholderCard title="Enhanced Website Analytics" /> }))
);

const BulkServiceResearch = React.lazy(() => 
  import('./BulkServiceResearch').then(module => ({ default: module.default })).catch(() => ({ default: () => <PlaceholderCard title="Bulk Service Research" /> }))
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
const LoadingFallback = ({ title }: { title: string }) => (
  <Card>
    <CardContent className="p-8">
      <div className="flex items-center justify-center space-y-4 flex-col">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-muted-foreground">Loading {title}...</p>
      </div>
    </CardContent>
  </Card>
);

// Static commission component
const CommissionsContent = () => (
  <Card>
    <CardContent className="p-6 text-center">
      <div className="h-12 w-12 text-green-600 mx-auto mb-4 flex items-center justify-center">
        💰
      </div>
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
);

// Static settings component
const SettingsContent = () => (
  <Card>
    <CardContent className="p-6 text-center">
      <div className="h-12 w-12 text-blue-600 mx-auto mb-4 flex items-center justify-center">
        ⚙️
      </div>
      <h3 className="text-lg font-semibold mb-2">System Configuration</h3>
      <p className="text-muted-foreground">
        Global application settings and preferences
      </p>
    </CardContent>
  </Card>
);

export function AdminContentRouter() {
  return (
    <div className="p-6">
      <Routes>
        <Route path="/" element={<Navigate to="/admin/overview" replace />} />
        
        <Route path="/overview" element={
          <Suspense fallback={<LoadingFallback title="Overview Dashboard" />}>
            <OptimizedOverview />
          </Suspense>
        } />
        
        <Route path="/users" element={
          <Suspense fallback={<LoadingFallback title="User Management" />}>
            <OptimizedUserManagement />
          </Suspense>
        } />
        
        <Route path="/content" element={
          <Suspense fallback={<LoadingFallback title="Content Management" />}>
            <ContentPromotionPanel />
          </Suspense>
        } />
        
        <Route path="/services" element={
          <Suspense fallback={<LoadingFallback title="Service Management" />}>
            <div className="space-y-6">
              <ServiceManagementPanelWrapper />
              <BulkServiceResearch />
            </div>
          </Suspense>
        } />
        
        <Route path="/reviews" element={
          <Suspense fallback={<LoadingFallback title="Reviews Management" />}>
            <ServiceReviewsManager />
          </Suspense>
        } />
        
        <Route path="/vendors" element={
          <Suspense fallback={<LoadingFallback title="Vendor Management" />}>
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
        } />
        
        <Route path="/points" element={
          <Suspense fallback={<LoadingFallback title="Points Management" />}>
            <VendorPointAllocationPanel />
          </Suspense>
        } />
        
        <Route path="/analytics" element={
          <Suspense fallback={<LoadingFallback title="Analytics Dashboard" />}>
            <VendorActivityAnalyticsWrapper />
          </Suspense>
        } />
        
        <Route path="/website-analytics" element={
          <Suspense fallback={<LoadingFallback title="Website Analytics" />}>
            <EnhancedWebAnalyticsDashboard />
          </Suspense>
        } />
        
        <Route path="/sponsored" element={
          <Suspense fallback={<LoadingFallback title="Sponsored Placements" />}>
            <SponsoredPlacementsManager />
          </Suspense>
        } />
        
        <Route path="/ranking" element={
          <Suspense fallback={<LoadingFallback title="Ranking Monitor" />}>
            <RankImpactMonitor />
          </Suspense>
        } />
        
        <Route path="/security" element={
          <Suspense fallback={<LoadingFallback title="Security System" />}>
            <AntiScrapingSystem />
          </Suspense>
        } />
        
        <Route path="/health" element={
          <Suspense fallback={<LoadingFallback title="System Health" />}>
            <AdminHealthDashboard />
          </Suspense>
        } />
        
        <Route path="/youtube" element={
          <Suspense fallback={<LoadingFallback title="YouTube Import" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <YouTubeImportPanel />
              <YouTubeChannelImportPanel />
            </div>
          </Suspense>
        } />
        
        <Route path="/agent-invites" element={
          <Suspense fallback={<LoadingFallback title="Agent Invitations" />}>
            <AgentInvitationPanel />
          </Suspense>
        } />
        
        <Route path="/respa" element={
          <Suspense fallback={<LoadingFallback title="RESPA Compliance" />}>
            <div className="space-y-6">
              <RESPADisclaimerManager />
              <RESPAServiceManager />
              <RESPAComplianceManagerWrapper />
              <RESPADocumentationViewer />
            </div>
          </Suspense>
        } />
        
        <Route path="/spiritual" element={
          <Suspense fallback={<LoadingFallback title="Spiritual Dashboard" />}>
            <SpiritualDashboard />
          </Suspense>
        } />
        
        <Route path="/commissions" element={<CommissionsContent />} />
        
        <Route path="/affiliates" element={
          <Suspense fallback={<LoadingFallback title="Affiliate Management" />}>
            <AdminAffiliates />
          </Suspense>
        } />
        
        <Route path="/retention" element={
          <Suspense fallback={<LoadingFallback title="Retention Analytics" />}>
            <div className="space-y-6">
              <RetentionAnalyticsDashboardWrapper />
              <CreatorPayoutDashboardWrapper />
            </div>
          </Suspense>
        } />
        
        <Route path="/calculator" element={
          <Suspense fallback={<LoadingFallback title="Advanced Calculator" />}>
            <AdvancedSplitCalculator />
          </Suspense>
        } />
        
        <Route path="/bookings" element={
          <Suspense fallback={<LoadingFallback title="Booking Management" />}>
            <AdminBookings />
          </Suspense>
        } />
        
        <Route path="/settings" element={<SettingsContent />} />
        
        {/* Fallback route */}
        <Route path="/*" element={<Navigate to="/admin/overview" replace />} />
      </Routes>
    </div>
  );
}