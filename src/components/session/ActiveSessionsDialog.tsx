import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Monitor, 
  MapPin, 
  Clock, 
  Smartphone, 
  Laptop, 
  Globe,
  Trash2,
  Shield
} from "lucide-react";
import { formatDistance } from "date-fns";
import { toast } from "sonner";

interface SessionInfo {
  id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  created_at: string;
  device_fingerprint?: string;
}

interface ActiveSessionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionInfo[];
  currentSessionId: string;
  onRevokeSessions: (sessionIds: string[]) => Promise<void>;
}

export function ActiveSessionsDialog({ 
  isOpen, 
  onClose, 
  sessions, 
  currentSessionId,
  onRevokeSessions 
}: ActiveSessionsDialogProps) {
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isRevoking, setIsRevoking] = useState(false);

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

  function getLocationInfo(ipAddress: string) {
    // In a real app, you'd use an IP geolocation service
    // For demo purposes, just show the IP
    return `IP: ${ipAddress}`;
  }

  async function handleRevokeSelected() {
    if (selectedSessions.size === 0) return;
    
    setIsRevoking(true);
    try {
      await onRevokeSessions(Array.from(selectedSessions));
      setSelectedSessions(new Set());
      toast.success(`Revoked ${selectedSessions.size} session(s)`);
    } catch (error) {
      toast.error('Failed to revoke sessions');
    } finally {
      setIsRevoking(false);
    }
  }

  function toggleSessionSelection(sessionId: string) {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  }

  const currentSession = sessions.find(s => s.session_id === currentSessionId);
  const otherSessions = sessions.filter(s => s.session_id !== currentSessionId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions ({sessions.length})
          </DialogTitle>
          <DialogDescription>
            Manage your active login sessions. Revoke any suspicious sessions immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Session */}
          {currentSession && (
            <div>
              <h4 className="font-medium mb-2">Current Session</h4>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(currentSession.user_agent)}
                      <span>{getBrowserInfo(currentSession.user_agent)}</span>
                      <Badge variant="secondary">Current</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {getLocationInfo(currentSession.ip_address)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Active now
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other Sessions */}
          {otherSessions.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Other Sessions ({otherSessions.length})</h4>
                {selectedSessions.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRevokeSelected}
                    disabled={isRevoking}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Revoke Selected ({selectedSessions.size})
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {otherSessions.map((session) => (
                  <Card 
                    key={session.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedSessions.has(session.session_id) 
                        ? 'ring-2 ring-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleSessionSelection(session.session_id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(session.user_agent)}
                          <span>{getBrowserInfo(session.user_agent)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedSessions.has(session.session_id) && (
                            <Badge variant="destructive">Selected</Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {getLocationInfo(session.ip_address)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Last active {formatDistance(new Date(session.last_activity), new Date(), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          Started {formatDistance(new Date(session.created_at), new Date(), { addSuffix: true })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {sessions.length === 1 && (
            <div className="text-center py-4 text-muted-foreground">
              <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>This is your only active session</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
