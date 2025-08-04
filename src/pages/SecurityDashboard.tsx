import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SecurityMonitoringPanel from '@/components/admin/SecurityMonitoringPanel';
import { SecurityEventMonitor } from '@/components/security/SecurityEventMonitor';
import { SecurityAuditLog } from '@/components/security/SecurityAuditLog';

export default function SecurityDashboard() {
  const navigate = useNavigate();

  return (
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
          Security Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor security events, audit logs, and system security status
        </p>
      </div>

      <div className="space-y-6">
        <SecurityMonitoringPanel />
        <SecurityEventMonitor />
        <SecurityAuditLog />
      </div>
    </div>
  );
}