import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Server, 
  Activity, 
  RefreshCw, 
  TrendingUp, 
  MapPin,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface RegionMetrics {
  region: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  load: number;
  connections: number;
  lastUpdated: string;
}

interface DeploymentConfig {
  region: string;
  environment: 'production' | 'staging' | 'development';
  version: string;
  instances: number;
  autoScaling: boolean;
  loadBalancer: boolean;
}

interface PerformanceMetric {
  region: string;
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold: number;
}

export default function MultiRegionDeployment() {
  const { toast } = useToast();
  const [regionMetrics, setRegionMetrics] = useState<RegionMetrics[]>([]);
  const [deploymentConfigs, setDeploymentConfigs] = useState<DeploymentConfig[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const fetchRegionData = async () => {
    try {
      setLoading(true);

      // Mock regional data
      const mockRegions: RegionMetrics[] = [
        {
          region: 'us-east-1',
          status: 'healthy',
          latency: 45,
          uptime: 99.95,
          load: 68,
          connections: 1247,
          lastUpdated: new Date().toISOString()
        },
        {
          region: 'us-west-2',
          status: 'healthy',
          latency: 52,
          uptime: 99.92,
          load: 72,
          connections: 892,
          lastUpdated: new Date().toISOString()
        },
        {
          region: 'eu-west-1',
          status: 'degraded',
          latency: 89,
          uptime: 98.76,
          load: 85,
          connections: 654,
          lastUpdated: new Date().toISOString()
        },
        {
          region: 'ap-southeast-1',
          status: 'healthy',
          latency: 71,
          uptime: 99.88,
          load: 45,
          connections: 432,
          lastUpdated: new Date().toISOString()
        },
        {
          region: 'ap-northeast-1',
          status: 'healthy',
          latency: 63,
          uptime: 99.91,
          load: 58,
          connections: 567,
          lastUpdated: new Date().toISOString()
        }
      ];

      const mockConfigs: DeploymentConfig[] = [
        {
          region: 'us-east-1',
          environment: 'production',
          version: 'v2.4.1',
          instances: 8,
          autoScaling: true,
          loadBalancer: true
        },
        {
          region: 'us-west-2',
          environment: 'production',
          version: 'v2.4.1',
          instances: 6,
          autoScaling: true,
          loadBalancer: true
        },
        {
          region: 'eu-west-1',
          environment: 'production',
          version: 'v2.4.0',
          instances: 4,
          autoScaling: true,
          loadBalancer: true
        },
        {
          region: 'ap-southeast-1',
          environment: 'production',
          version: 'v2.4.1',
          instances: 3,
          autoScaling: false,
          loadBalancer: true
        },
        {
          region: 'ap-northeast-1',
          environment: 'staging',
          version: 'v2.5.0-beta',
          instances: 2,
          autoScaling: false,
          loadBalancer: false
        }
      ];

      const mockMetrics: PerformanceMetric[] = [
        { region: 'us-east-1', metric: 'CPU Usage', value: 68, unit: '%', trend: 'up', threshold: 80 },
        { region: 'us-east-1', metric: 'Memory Usage', value: 74, unit: '%', trend: 'stable', threshold: 85 },
        { region: 'us-east-1', metric: 'Disk I/O', value: 45, unit: 'MB/s', trend: 'down', threshold: 100 },
        { region: 'us-west-2', metric: 'CPU Usage', value: 72, unit: '%', trend: 'up', threshold: 80 },
        { region: 'us-west-2', metric: 'Memory Usage', value: 68, unit: '%', trend: 'stable', threshold: 85 },
        { region: 'eu-west-1', metric: 'CPU Usage', value: 85, unit: '%', trend: 'up', threshold: 80 },
        { region: 'eu-west-1', metric: 'Memory Usage', value: 89, unit: '%', trend: 'up', threshold: 85 },
        { region: 'ap-southeast-1', metric: 'CPU Usage', value: 45, unit: '%', trend: 'stable', threshold: 80 },
        { region: 'ap-northeast-1', metric: 'CPU Usage', value: 58, unit: '%', trend: 'down', threshold: 80 }
      ];

      setRegionMetrics(mockRegions);
      setDeploymentConfigs(mockConfigs);
      setPerformanceMetrics(mockMetrics);

    } catch (error) {
      console.error('Error fetching region data:', error);
      toast({
        title: "Error",
        description: "Failed to load region data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />;
      case 'stable': return <Activity className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  const filteredMetrics = selectedRegion === 'all' 
    ? regionMetrics 
    : regionMetrics.filter(m => m.region === selectedRegion);

  const filteredConfigs = selectedRegion === 'all'
    ? deploymentConfigs
    : deploymentConfigs.filter(c => c.region === selectedRegion);

  const filteredPerformance = selectedRegion === 'all'
    ? performanceMetrics
    : performanceMetrics.filter(p => p.region === selectedRegion);

  useEffect(() => {
    fetchRegionData();
    const interval = setInterval(fetchRegionData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
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
            <Globe className="h-8 w-8 text-primary" />
            Multi-Region Deployment
          </h1>
          <p className="text-muted-foreground">Global infrastructure monitoring and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regionMetrics.map(region => (
                <SelectItem key={region.region} value={region.region}>
                  {region.region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchRegionData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Regions</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionMetrics.length}</div>
            <p className="text-xs text-muted-foreground">
              {regionMetrics.filter(r => r.status === 'healthy').length} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(regionMetrics.reduce((sum, r) => sum + r.latency, 0) / regionMetrics.length)}ms
            </div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {regionMetrics.reduce((sum, r) => sum + r.connections, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(regionMetrics.reduce((sum, r) => sum + r.uptime, 0) / regionMetrics.length).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Average uptime</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Regional Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="failover">Failover Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMetrics.map((region) => (
              <Card key={region.region}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <CardTitle className="text-lg">{region.region}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(region.status)}
                      <Badge 
                        variant={region.status === 'healthy' ? 'secondary' : 'destructive'}
                        className={getStatusColor(region.status)}
                      >
                        {region.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Latency</span>
                        <span className="font-medium">{region.latency}ms</span>
                      </div>
                      <Progress value={Math.min((region.latency / 100) * 100, 100)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Load</span>
                        <span className="font-medium">{region.load}%</span>
                      </div>
                      <Progress 
                        value={region.load} 
                        className={region.load > 80 ? 'text-destructive' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">{region.uptime}%</span>
                      </div>
                      <Progress value={region.uptime} />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Connections</span>
                      <span className="font-medium">{region.connections.toLocaleString()}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(region.lastUpdated).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <div className="space-y-4">
            {filteredConfigs.map((config) => (
              <Card key={config.region}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      <CardTitle>{config.region}</CardTitle>
                    </div>
                    <Badge variant={config.environment === 'production' ? 'default' : 'secondary'}>
                      {config.environment}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Version:</span>
                        <span className="font-medium">{config.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Instances:</span>
                        <span className="font-medium">{config.instances}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Auto Scaling:</span>
                        <Badge variant={config.autoScaling ? 'secondary' : 'outline'}>
                          {config.autoScaling ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Load Balancer:</span>
                        <Badge variant={config.loadBalancer ? 'secondary' : 'outline'}>
                          {config.loadBalancer ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPerformance.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{metric.metric}</CardTitle>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <CardDescription>{metric.region}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>
                    <Progress 
                      value={(metric.value / metric.threshold) * 100}
                      className={metric.value > metric.threshold ? 'text-destructive' : ''}
                    />
                    <div className="text-xs text-muted-foreground">
                      Threshold: {metric.threshold}{metric.unit}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failover Strategy</CardTitle>
              <CardDescription>
                Multi-region disaster recovery and failover configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Primary Region:</strong> us-east-1 | <strong>Secondary:</strong> us-west-2 | 
                    <strong>RTO:</strong> 5 minutes | <strong>RPO:</strong> 1 minute
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Failover Triggers</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div>• Region availability &lt; 95%</div>
                      <div>• Latency &gt; 200ms for 5 minutes</div>
                      <div>• Error rate &gt; 5% for 3 minutes</div>
                      <div>• Manual failover initiated</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Recovery Process</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div>1. DNS traffic routing update</div>
                      <div>2. Database replica promotion</div>
                      <div>3. Application instance scaling</div>
                      <div>4. Health check validation</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Recent Failover Tests</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
                      <span>us-east-1 → us-west-2</span>
                      <span className="text-green-600">Success (4m 23s)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
                      <span>eu-west-1 → us-east-1</span>
                      <span className="text-green-600">Success (3m 45s)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                      <span>ap-southeast-1 → ap-northeast-1</span>
                      <span className="text-yellow-600">Partial (7m 12s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};