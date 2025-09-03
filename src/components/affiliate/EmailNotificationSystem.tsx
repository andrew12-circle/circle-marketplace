import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailNotification {
  id: string;
  type: string;
  subject: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
}

export const EmailNotificationSystem = () => {
  const [notifications] = React.useState<EmailNotification[]>([
    {
      id: '1',
      type: 'application_received',
      subject: 'Your affiliate application has been received',
      sent_at: new Date().toISOString(),
      status: 'delivered'
    },
    {
      id: '2',
      type: 'approval_pending',
      subject: 'Application under review - Additional info needed',
      sent_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'opened'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Clock className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'opened': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'secondary';
      case 'delivered': return 'default';
      case 'opened': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(notification.status)}
                <div>
                  <p className="font-medium">{notification.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(notification.sent_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(notification.status) as any}>
                  {notification.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};