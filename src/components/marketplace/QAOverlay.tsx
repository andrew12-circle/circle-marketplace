import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  Database, 
  ShoppingCart, 
  Users, 
  Network, 
  X,
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/hooks/useLocation';

interface QAOverlayProps {
  onClose: () => void;
}

interface DiagnosticInfo {
  category: string;
  label: string;
  value: any;
  status: 'good' | 'warning' | 'error';
  details?: string;
}

export const QAOverlay = ({ onClose }: QAOverlayProps) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo[]>([]);
  const { data: marketplaceData, isLoading, error } = useMarketplaceData();
  const { user, profile } = useAuth();
  const { location } = useLocation();

  useEffect(() => {
    const gatherDiagnostics = (): DiagnosticInfo[] => {
      const diags: DiagnosticInfo[] = [];

      // Marketplace Data Health
      diags.push({
        category: 'Marketplace',
        label: 'Data Loading',
        value: isLoading ? 'Loading...' : (error ? 'Error' : 'Loaded'),
        status: isLoading ? 'warning' : (error ? 'error' : 'good'),
        details: error?.message
      });

      if (marketplaceData) {
        diags.push({
          category: 'Marketplace',
          label: 'Services Count',
          value: marketplaceData.services?.length || 0,
          status: (marketplaceData.services?.length || 0) > 0 ? 'good' : 'error',
          details: 'Total active services in marketplace'
        });

        diags.push({
          category: 'Marketplace',
          label: 'Vendors Count', 
          value: marketplaceData.vendors?.length || 0,
          status: (marketplaceData.vendors?.length || 0) > 0 ? 'good' : 'error',
          details: 'Total active vendors (including pending)'
        });
      }

      // Authentication Status
      diags.push({
        category: 'Auth',
        label: 'User Authenticated',
        value: !!user ? 'Yes' : 'No',
        status: !!user ? 'good' : 'warning',
        details: user?.id || 'Not logged in'
      });

      diags.push({
        category: 'Auth',
        label: 'Profile Loaded',
        value: !!profile ? 'Yes' : 'No', 
        status: !!profile ? 'good' : 'warning',
        details: profile ? 'Profile data available' : 'No profile data'
      });

      // Location Services
      diags.push({
        category: 'Location',
        label: 'User Location',
        value: location?.state || 'Unknown',
        status: !!location?.state ? 'good' : 'warning',
        details: location ? `${location.city}, ${location.state}` : 'Location not detected'
      });

      // UI Elements
      const vendorModals = document.querySelectorAll('[data-vendor-modal]');
      diags.push({
        category: 'UI',
        label: 'Vendor Modals',
        value: vendorModals.length,
        status: 'good',
        details: 'Vendor selection modals in DOM'
      });

      const cartElements = document.querySelectorAll('[data-cart]');
      diags.push({
        category: 'UI',
        label: 'Cart Elements',
        value: cartElements.length,
        status: cartElements.length > 0 ? 'good' : 'warning',
        details: 'Cart-related elements in DOM'
      });

      // Network Connectivity
      diags.push({
        category: 'Network',
        label: 'Online Status',
        value: navigator.onLine ? 'Online' : 'Offline',
        status: navigator.onLine ? 'good' : 'error',
        details: 'Browser connectivity status'
      });

      // Error Boundaries  
      const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
      diags.push({
        category: 'Reliability',
        label: 'Error Boundaries',
        value: errorBoundaries.length,
        status: errorBoundaries.length > 0 ? 'good' : 'warning',
        details: 'Error boundary components active'
      });

      return diags;
    };

    setDiagnostics(gatherDiagnostics());
  }, [marketplaceData, isLoading, error, user, profile, location]);

  const getStatusColor = (status: DiagnosticInfo['status']) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: DiagnosticInfo['status']) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-3 h-3" />;
      case 'warning': return <AlertTriangle className="w-3 h-3" />;
      case 'error': return <X className="w-3 h-3" />;
      default: return <Bug className="w-3 h-3" />;
    }
  };

  const groupedDiagnostics = diagnostics.reduce((acc, diag) => {
    if (!acc[diag.category]) acc[diag.category] = [];
    acc[diag.category].push(diag);
    return acc;
  }, {} as Record<string, DiagnosticInfo[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Marketplace': return <ShoppingCart className="w-4 h-4" />;
      case 'Auth': return <Users className="w-4 h-4" />;
      case 'Location': return <Database className="w-4 h-4" />;
      case 'UI': return <Bug className="w-4 h-4" />;
      case 'Network': return <Network className="w-4 h-4" />;
      case 'Reliability': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bug className="w-5 h-5" />
              QA Diagnostics Overlay
            </CardTitle>
            <CardDescription>
              Real-time system health and diagnostic information
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/qa', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Full QA Runner
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-4 pt-4">
          {Object.entries(groupedDiagnostics).map(([category, categoryDiags]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2 font-medium text-sm">
                {getCategoryIcon(category)}
                {category}
              </div>
              
              <div className="grid gap-2 ml-6">
                {categoryDiags.map((diag, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${getStatusColor(diag.status)}`}>
                        {getStatusIcon(diag.status)}
                        {diag.status.toUpperCase()}
                      </span>
                      <span className="font-medium text-sm">{diag.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{diag.value}</div>
                      {diag.details && (
                        <div className="text-xs text-muted-foreground">{diag.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Separator />

          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Usage:</strong> Add <code>?qa=1</code> to any URL for enhanced diagnostics</div>
            <div><strong>Full Testing:</strong> Visit <code>/qa</code> for comprehensive end-to-end testing</div>
            <div><strong>Console:</strong> Check browser console for detailed logs and errors</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};