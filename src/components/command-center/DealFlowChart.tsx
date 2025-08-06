import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '@/hooks/useAgentData';
import { format, parseISO, startOfMonth } from 'date-fns';

interface DealFlowChartProps {
  transactions: Transaction[];
}

export const DealFlowChart = ({ transactions }: DealFlowChartProps) => {
  const [viewMode, setViewMode] = useState<'buyer' | 'seller' | 'both'>('both');

  // Group transactions by month
  const monthlyData = transactions.reduce((acc, transaction) => {
    const monthKey = format(startOfMonth(parseISO(transaction.close_date)), 'yyyy-MM');
    const monthLabel = format(parseISO(transaction.close_date), 'MMM yyyy');
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthLabel,
        buyerCount: 0,
        sellerCount: 0,
        buyerVolume: 0,
        sellerVolume: 0,
      };
    }
    
    if (transaction.side === 'buyer') {
      acc[monthKey].buyerCount += 1;
      acc[monthKey].buyerVolume += transaction.price;
    } else {
      acc[monthKey].sellerCount += 1;
      acc[monthKey].sellerVolume += transaction.price;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .map((item: any) => ({
      ...item,
      buyerVolume: item.buyerVolume / 1000000, // Convert to millions
      sellerVolume: item.sellerVolume / 1000000,
      totalCount: item.buyerCount + item.sellerCount,
      totalVolume: (item.buyerVolume + item.sellerVolume),
    }));

  const formatTooltip = (value: number, name: string) => {
    if (name.includes('Volume')) {
      return [`$${value.toFixed(1)}M`, name];
    }
    return [value, name];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Monthly Deal Flow</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'buyer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('buyer')}
            >
              Buyer
            </Button>
            <Button
              variant={viewMode === 'seller' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('seller')}
            >
              Seller
            </Button>
            <Button
              variant={viewMode === 'both' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('both')}
            >
              Both
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Count / Volume ($M)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelStyle={{ color: 'black' }}
              />
              
              {(viewMode === 'buyer' || viewMode === 'both') && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="buyerCount" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Buyer Count"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="buyerVolume" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Buyer Volume"
                    dot={{ r: 4 }}
                  />
                </>
              )}
              
              {(viewMode === 'seller' || viewMode === 'both') && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="sellerCount" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    name="Seller Count"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sellerVolume" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Seller Volume"
                    dot={{ r: 4 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
          {(viewMode === 'buyer' || viewMode === 'both') && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }}></div>
                <span>Buyer Count</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded border-dashed border-2" style={{ borderColor: 'hsl(var(--chart-2))' }}></div>
                <span>Buyer Volume</span>
              </div>
            </>
          )}
          {(viewMode === 'seller' || viewMode === 'both') && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded" style={{ backgroundColor: 'hsl(var(--chart-3))' }}></div>
                <span>Seller Count</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded border-dashed border-2" style={{ borderColor: 'hsl(var(--chart-4))' }}></div>
                <span>Seller Volume</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};