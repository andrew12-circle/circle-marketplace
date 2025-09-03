import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  MousePointer, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Filter
} from "lucide-react";

interface AffiliateReportsProps {
  affiliateId: string;
}

export const AffiliateReports = ({ affiliateId }: AffiliateReportsProps) => {
  const [dateRange, setDateRange] = useState("30");
  const [destinationType, setDestinationType] = useState("all");

  // Mock data - in a real app this would come from the API
  const reportData = {
    summary: {
      totalClicks: 482,
      totalConversions: 12,
      conversionRate: 2.49,
      totalEarnings: 287.40,
      epc: 0.60 // earnings per click
    },
    linkPerformance: [
      {
        link: "circle.example.com/pro?aff=john123",
        destination: "Circle Pro",
        clicks: 234,
        conversions: 8,
        earnings: 232.80,
        conversionRate: 3.42
      },
      {
        link: "circle.example.com/marketplace?aff=john123",
        destination: "Marketplace",
        clicks: 156,
        conversions: 3,
        earnings: 44.70,
        conversionRate: 1.92
      },
      {
        link: "circle.example.com/academy?aff=john123",
        destination: "Academy",
        clicks: 92,
        conversions: 1,
        earnings: 9.90,
        conversionRate: 1.09
      }
    ],
    recentConversions: [
      {
        date: "2024-01-15",
        type: "Circle Pro Signup",
        amount: 19.40,
        status: "approved"
      },
      {
        date: "2024-01-14",
        type: "Marketplace Purchase",
        amount: 29.90,
        status: "approved"
      },
      {
        date: "2024-01-12",
        type: "Circle Pro Signup",
        amount: 19.40,
        status: "pending"
      }
    ]
  };

  const exportData = (format: 'csv' | 'pdf') => {
    // In a real implementation, this would generate and download the report
    console.log(`Exporting ${format} report for ${dateRange} days`);
    alert(`${format.toUpperCase()} export started`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Reports</h2>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={destinationType} onValueChange={setDestinationType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All destinations</SelectItem>
              <SelectItem value="pro_membership">Circle Pro</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="academy">Academy</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total Clicks</span>
            </div>
            <div className="text-2xl font-bold">{reportData.summary.totalClicks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Conversions</span>
            </div>
            <div className="text-2xl font-bold">{reportData.summary.totalConversions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Conv. Rate</span>
            </div>
            <div className="text-2xl font-bold">{reportData.summary.conversionRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Earnings</span>
            </div>
            <div className="text-2xl font-bold">${reportData.summary.totalEarnings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">EPC</span>
            </div>
            <div className="text-2xl font-bold">${reportData.summary.epc}</div>
            <div className="text-xs text-muted-foreground">Earnings per click</div>
          </CardContent>
        </Card>
      </div>

      {/* Link Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Link Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Link</th>
                  <th className="text-left py-2">Destination</th>
                  <th className="text-right py-2">Clicks</th>
                  <th className="text-right py-2">Conversions</th>
                  <th className="text-right py-2">Conv. Rate</th>
                  <th className="text-right py-2">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {reportData.linkPerformance.map((link, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">
                      <div className="font-mono text-sm truncate max-w-48">
                        {link.link}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{link.destination}</Badge>
                    </td>
                    <td className="text-right py-3">{link.clicks}</td>
                    <td className="text-right py-3">{link.conversions}</td>
                    <td className="text-right py-3">{link.conversionRate}%</td>
                    <td className="text-right py-3 font-semibold">${link.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.recentConversions.map((conversion, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{conversion.type}</div>
                    <div className="text-sm text-muted-foreground">{conversion.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={conversion.status === 'approved' ? 'default' : 'secondary'}>
                    {conversion.status}
                  </Badge>
                  <div className="font-semibold">${conversion.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/20 rounded flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Performance chart would go here</p>
              <p className="text-sm text-muted-foreground">Showing clicks, conversions, and earnings over time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};