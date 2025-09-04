import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Monitor, 
  MapPin, 
  Clock, 
  Smartphone, 
  Laptop, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { formatDistance } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { toast } from "sonner";

export function SessionManagementPage() {
  const { profile } = useAuth();
  const sessionManagement = useSessionManagement();
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    sessionManagement.loadActiveSessions();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      sessionManagement.loadActiveSessions();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  function getDeviceIcon(userAgent: string) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  }

  function getBrowserInfo(userAgent: string) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  }

  async function handleRevokeSession(sessionId: string) {
    try {
      await sessionManagement.revokeSessions([sessionId]);
      toast.success('Session revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  }

  const currentSession = sessionManagement.activeSessions.find(
    s => s.session_id === sessionManagement.currentSessionId
  );
  const otherSessions = sessionManagement.activeSessions.filter(
    s => s.session_id !== sessionManagement.currentSessionId
  );

  const sessionsToShow = showAllSessions ? otherSessions : otherSessions.slice(0, 3);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Session Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your active login sessions across devices
          </p>
        </div>

        {/* Security Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {sessionManagement.activeSessions.length}
                </div>
                <div className="text-sm text-muted-foreground">Active Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(sessionManagement.activeSessions.map(s => s.ip_address)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Locations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(sessionManagement.activeSessions.map(s => getBrowserInfo(s.user_agent))).size}
                </div>
                <div className="text-sm text-muted-foreground">Different Browsers</div>
              </div>
            </div>

            {sessionManagement.activeSessions.length > 3 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-md border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Multiple active sessions detected. Review for any unauthorized access.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-refresh sessions</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically refresh session list every 30 seconds
                </div>
              </div>
              <Switch 
                checked={autoRefresh} 
                onCheckedChange={setAutoRefresh}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => sessionManagement.loadActiveSessions()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Session */}
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>
              This is your current login session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentSession ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(currentSession.user_agent)}
                  <div>
                    <div className="font-medium">{getBrowserInfo(currentSession.user_agent)}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        IP: {currentSession.ip_address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Active now
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">Current</Badge>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Current session information unavailable</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Other Active Sessions ({otherSessions.length})</span>
                {otherSessions.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    className="flex items-center gap-2"
                  >
                    {showAllSessions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAllSessions ? 'Show Less' : `Show All (${otherSessions.length})`}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Sessions active on other devices or browsers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionsToShow.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.user_agent)}
                    <div>
                      <div className="font-medium">{getBrowserInfo(session.user_agent)}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          IP: {session.ip_address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistance(new Date(session.last_activity), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.session_id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No other sessions */}
        {otherSessions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">No Other Sessions</h3>
              <p className="text-sm text-muted-foreground">
                This is your only active session. Your account is secure.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
