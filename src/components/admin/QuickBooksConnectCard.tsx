import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getConnectionForOrg, QBOConnection } from '@/lib/qbo-auth';
import { getCompanyInfo, CompanyInfo } from '@/lib/qbo';
import { supabase } from '@/integrations/supabase/client';

interface QuickBooksConnectCardProps {
  orgId?: string;
}

export const QuickBooksConnectCard: React.FC<QuickBooksConnectCardProps> = ({ 
  orgId = '00000000-0000-0000-0000-000000000000' // Default org ID for now
}) => {
  const [connection, setConnection] = useState<QBOConnection | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadConnection();
  }, [orgId]);

  const loadConnection = async () => {
    setIsLoading(true);
    try {
      const conn = await getConnectionForOrg(orgId);
      setConnection(conn);
    } catch (error) {
      console.error('Failed to load QBO connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Redirect directly to the QBO connect edge function
      window.location.href = `${window.location.origin}/functions/v1/qbo-connect`;
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect to QuickBooks');
    }
  };

  const handleRefresh = async () => {
    if (!connection) return;

    setIsRefreshing(true);
    try {
      const info = await getCompanyInfo(orgId);
      setCompanyInfo(info);
      toast.success('Company information refreshed');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh company information');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestInvoice = async () => {
    if (!connection) return;

    try {
      // This is a test function - remove in production
      const { data, error } = await supabase.functions.invoke('qbo-test-invoice', {
        body: {
          org_id: orgId,
          customer_ref: '1', // Default customer
          amount: 100.00,
          description: 'Test invoice from Circle admin'
        }
      });

      if (error) {
        console.error('Test invoice error:', error);
        toast.error('Failed to create test invoice');
        return;
      }

      toast.success('Test invoice created successfully!');
      console.log('Invoice created:', data);
    } catch (error) {
      console.error('Test invoice error:', error);
      toast.error('Failed to create test invoice');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white text-xs font-bold">
              QB
            </div>
            QuickBooks Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading connection status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white text-xs font-bold">
            QB
          </div>
          QuickBooks Integration
          {connection && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connection ? (
          // Not connected state
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Connect to QuickBooks Online</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Integrate with QuickBooks to sync customers, create invoices, and manage financial data.
            </p>
            <Button onClick={handleConnect} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Connect to QuickBooks
            </Button>
          </div>
        ) : (
          // Connected state
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Connected to QuickBooks</h4>
                <p className="text-sm text-muted-foreground">
                  Realm ID: {connection.realm_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(connection.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {companyInfo && (
              <div className="bg-muted/50 rounded-lg p-3">
                <h5 className="font-medium mb-2">Company Information</h5>
                <div className="text-sm space-y-1">
                  <div><strong>Name:</strong> {companyInfo.QueryResponse.CompanyInfo[0]?.CompanyName}</div>
                  <div><strong>Legal Name:</strong> {companyInfo.QueryResponse.CompanyInfo[0]?.LegalName}</div>
                  <div><strong>ID:</strong> {companyInfo.QueryResponse.CompanyInfo[0]?.Id}</div>
                </div>
              </div>
            )}

            {/* Test button - remove in production */}
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTestInvoice}
                className="gap-2"
              >
                Create Test Invoice
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};