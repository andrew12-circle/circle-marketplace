
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { BarChart, Users, DollarSign, TrendingUp, Funnel } from "lucide-react";

// Import existing admin components
import { AdminHealthDashboard } from "@/components/admin/AdminHealthDashboard";
import { ServiceManagementPanel } from "@/components/admin/ServiceManagementPanel";
import { VendorManagementPanel } from "@/components/admin/VendorManagementPanel";
import { AgentInvitationPanel } from "@/components/admin/AgentInvitationPanel";
import { VendorInvitationPanel } from "@/components/admin/VendorInvitationPanel";
import { SecurityMonitoringPanel } from "@/components/admin/SecurityMonitoringPanel";

// Import new funnel analytics
import { FunnelAnalyticsDashboard } from "@/components/analytics/FunnelAnalyticsDashboard";

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not admin
  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your Circle platform</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <Funnel className="w-4 h-4" />
            Funnel Analytics
          </TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminHealthDashboard />
        </TabsContent>

        <TabsContent value="funnel">
          <FunnelAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="services">
          <ServiceManagementPanel />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorManagementPanel />
        </TabsContent>

        <TabsContent value="agents">
          <AgentInvitationPanel />
        </TabsContent>

        <TabsContent value="invitations">
          <div className="grid gap-6">
            <AgentInvitationPanel />
            <VendorInvitationPanel />
          </div>
        </TabsContent>

        <TabsContent value="security">
          <SecurityMonitoringPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
