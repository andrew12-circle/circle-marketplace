import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  CreditCard,
  Lock,
  Activity,
  Brain
} from 'lucide-react';

interface FraudEvent {
  id: string;
  event_type: string;
  user_id: string;
  risk_score: number;
  details: any;
  status: 'pending' | 'reviewed' | 'false_positive' | 'confirmed';
  created_at: string;
}

interface FraudMetrics {
  totalEvents: number;
  highRiskEvents: number;
  resolvedEvents: number;
  avgRiskScore: number;
  falsePositiveRate: number;
}

interface RiskPattern {
  pattern_type: string;
  frequency: number;
  avg_risk_score: number;
  description: string;
}

export default function AdvancedFraudPrevention() {
  const { toast } = useToast();
  const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null);
  const [riskPatterns, setRiskPatterns] = useState<RiskPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFraudData = async () => {
    try {
      setRefreshing(true);

      // Mock fraud events - in real implementation, this would come from fraud detection system
      const mockEvents: FraudEvent[] = [
        {
          id: '1',
          event_type: 'suspicious_payment',
          user_id: 'user_123',
          risk_score: 85,
          details: {
            payment_amount: 5000,
            payment_method: 'credit_card',
            location: 'Unknown',
            velocity_flags: ['high_amount', 'new_payment_method']
          },
          status: 'pending',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          event_type: 'account_takeover_attempt',
          user_id: 'user_456',
          risk_score: 92,
          details: {
            login_attempts: 8,
            ip_location: 'Nigeria',
            device_fingerprint: 'unknown',
            time_anomaly: true
          },
          status: 'pending',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          event_type: 'fake_vendor_registration',
          user_id: 'vendor_789',
          risk_score: 78,
          details: {
            business_verification: 'failed',
            document_quality: 'low',
            contact_verification: 'failed',
            similar_registrations: 3
          },
          status: 'reviewed',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          event_type: 'money_laundering_pattern',
          user_id: 'user_101',
          risk_score: 95,
          details: {
            transaction_pattern: 'structuring',
            total_amount: 45000,
            frequency: 'daily',
            beneficial_owner: 'unclear'
          },
          status: 'confirmed',
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        }
      ];

      setFraudEvents(mockEvents);

      // Calculate metrics
      const totalEvents = mockEvents.length;
      const highRiskEvents = mockEvents.filter(e => e.risk_score >= 80).length;
      const resolvedEvents = mockEvents.filter(e => e.status !== 'pending').length;
      const avgRiskScore = mockEvents.reduce((sum, e) => sum + e.risk_score, 0) / totalEvents;
      const falsePositiveRate = (mockEvents.filter(e => e.status === 'false_positive').length / resolvedEvents) * 100;

      setMetrics({
        totalEvents,
        highRiskEvents,
        resolvedEvents,
        avgRiskScore,
        falsePositiveRate
      });

      // Mock risk patterns
      setRiskPatterns([
        {
          pattern_type: 'Velocity Fraud',
          frequency: 15,
          avg_risk_score: 82,
          description: 'Multiple high-value transactions in short time periods'
        },
        {
          pattern_type: 'Geographic Anomaly',
          frequency: 8,
          avg_risk_score: 75,
          description: 'Transactions from unusual geographic locations'
        },
        {
          pattern_type: 'Device Fingerprinting',
          frequency: 12,
          avg_risk_score: 68,
          description: 'Suspicious device characteristics or spoofing attempts'
        },
        {
          pattern_type: 'Account Behavior',
          frequency: 20,
          avg_risk_score: 71,
          description: 'Unusual account usage patterns or dormant account activation'
        }
      ]);

    } catch (error) {
      console.error('Error fetching fraud data:', error);
      toast({
        title: "Error",
        description: "Failed to load fraud prevention data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateEventStatus = async (eventId: string, newStatus: string) => {
    try {
      setFraudEvents(prev => prev.map(event =>
        event.id === eventId ? { ...event, status: newStatus as any } : event
      ));

      toast({
        title: "Status Updated",
        description: `Event marked as ${newStatus.replace('_', ' ')}`
      });

      // In real implementation, this would update the database
      // await supabase.from('fraud_events').update({ status: newStatus }).eq('id', eventId);

    } catch (error) {
      console.error('Error updating event status:', error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 90) return 'destructive';
    if (score >= 70) return 'default';
    if (score >= 50) return 'secondary';
    return 'outline';
  };

  const getRiskIcon = (eventType: string) => {
    switch (eventType) {
      case 'suspicious_payment': return <CreditCard className="h-4 w-4" />;
      case 'account_takeover_attempt': return <Lock className="h-4 w-4" />;
      case 'fake_vendor_registration': return <Users className="h-4 w-4" />;
      case 'money_laundering_pattern': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchFraudData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Advanced Fraud Prevention
          </h1>
          <p className="text-muted-foreground">AI-powered fraud detection and risk management</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchFraudData}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalEvents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics?.highRiskEvents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.resolvedEvents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgRiskScore.toFixed(1) || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positive</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.falsePositiveRate.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Fraud Events</TabsTrigger>
          <TabsTrigger value="patterns">Risk Patterns</TabsTrigger>
          <TabsTrigger value="ml-insights">ML Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {fraudEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRiskIcon(event.event_type)}
                    <CardTitle className="text-lg capitalize">
                      {event.event_type.replace('_', ' ')}
                    </CardTitle>
                    <Badge variant={getRiskColor(event.risk_score)}>
                      Risk: {event.risk_score}%
                    </Badge>
                    <Badge variant={event.status === 'pending' ? 'destructive' : 'secondary'}>
                      {event.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Event Details</h4>
                    <div className="grid gap-2 text-sm">
                      <div><strong>User ID:</strong> {event.user_id}</div>
                      {Object.entries(event.details).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key.replace('_', ' ')}:</strong> {
                            typeof value === 'object' 
                              ? JSON.stringify(value) 
                              : String(value)
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Risk Score:</span>
                    <Progress value={event.risk_score} className="flex-1 max-w-[200px]" />
                    <span className="text-sm">{event.risk_score}%</span>
                  </div>

                  {event.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateEventStatus(event.id, 'false_positive')}
                      >
                        Mark False Positive
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateEventStatus(event.id, 'confirmed')}
                      >
                        Confirm Fraud
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateEventStatus(event.id, 'reviewed')}
                      >
                        Mark Reviewed
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {riskPatterns.map((pattern, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {pattern.pattern_type}
                  <Badge variant="outline">
                    {pattern.frequency} occurrences
                  </Badge>
                </CardTitle>
                <CardDescription>{pattern.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Average Risk Score</span>
                    <span className="font-medium">{pattern.avg_risk_score}%</span>
                  </div>
                  <Progress value={pattern.avg_risk_score} />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ml-insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Machine Learning Insights
              </CardTitle>
              <CardDescription>
                AI-powered analysis of fraud patterns and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Model Performance:</strong> Current fraud detection model is operating at 94.2% accuracy 
                    with a 12% false positive rate. Consider retraining with recent data.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pattern Discovery:</strong> New fraud pattern detected involving rapid account creation 
                    followed by high-value transactions. 23 similar cases identified in the last 7 days.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Risk Threshold Recommendation:</strong> Consider lowering risk threshold from 80% to 75% 
                    to catch emerging fraud patterns, accepting a 3% increase in false positives.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Model Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span className="font-medium">94.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precision:</span>
                        <span className="font-medium">89.7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recall:</span>
                        <span className="font-medium">91.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>F1 Score:</span>
                        <span className="font-medium">90.5%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Feature Importance</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Transaction Amount:</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Geographic Location:</span>
                        <span className="font-medium">22%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Patterns:</span>
                        <span className="font-medium">19%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Device Fingerprint:</span>
                        <span className="font-medium">15%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};