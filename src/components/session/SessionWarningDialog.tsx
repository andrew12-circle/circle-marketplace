import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Monitor } from "lucide-react";

interface SessionWarning {
  type: 'concurrent_sessions' | 'ip_change' | 'device_change';
  message: string;
  data?: any;
}

interface SessionWarningDialogProps {
  warning: SessionWarning | null;
  onDismiss: () => void;
  onViewSessions: () => void;
}

export function SessionWarningDialog({ warning, onDismiss, onViewSessions }: SessionWarningDialogProps) {
  if (!warning) return null;

  const getIcon = () => {
    switch (warning.type) {
      case 'concurrent_sessions':
        return <Monitor className="h-6 w-6 text-amber-500" />;
      case 'ip_change':
      case 'device_change':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <Shield className="h-6 w-6 text-blue-500" />;
    }
  };

  const getTitle = () => {
    switch (warning.type) {
      case 'concurrent_sessions':
        return 'Multiple Active Sessions Detected';
      case 'ip_change':
        return 'IP Address Change Detected';
      case 'device_change':
        return 'New Device Detected';
      default:
        return 'Security Notice';
    }
  };

  const getDescription = () => {
    switch (warning.type) {
      case 'concurrent_sessions':
        return 'You have multiple active sessions. This could indicate account sharing, which violates our terms of service.';
      case 'ip_change':
        return 'Your IP address has changed during this session. This could indicate your account is being accessed from multiple locations.';
      case 'device_change':
        return 'A new device or browser is accessing your account. If this wasn\'t you, please secure your account immediately.';
      default:
        return warning.message;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {warning.message}
          </AlertDescription>
        </Alert>

        {warning.data?.activeSessions && (
          <div className="text-sm text-muted-foreground">
            <p>Active sessions: {warning.data.activeSessions} of {warning.data.maxSessions} allowed</p>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
          <Button onClick={onViewSessions}>
            Manage Sessions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}