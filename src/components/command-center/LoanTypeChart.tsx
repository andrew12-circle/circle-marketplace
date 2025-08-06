import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '@/hooks/useAgentData';

interface LoanTypeChartProps {
  transactions: Transaction[];
}

export const LoanTypeChart = ({ transactions }: LoanTypeChartProps) => {
  // Group by loan type and property type
  const loanData = transactions.reduce((acc, transaction) => {
    const loanType = transaction.loan_type || 'Unknown';
    const propertyType = transaction.property_type;
    
    if (!acc[loanType]) {
      acc[loanType] = { name: loanType, SFH: 0, TH: 0, Condo: 0, Commercial: 0, total: 0 };
    }
    
    acc[loanType][propertyType] += transaction.price;
    acc[loanType].total += transaction.price;
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(loanData).map(item => ({
    ...item,
    total: item.total / 1000000 // Convert to millions for display
  }));

  const formatTooltip = (value: number, name: string) => {
    if (name === 'total') {
      return [`$${value.toFixed(1)}M`, 'Total Volume'];
    }
    return [`$${(value / 1000000).toFixed(1)}M`, name];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Closings by Loan Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Volume ($M)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelStyle={{ color: 'black' }}
              />
              <Bar dataKey="SFH" stackId="a" fill="hsl(var(--chart-1))" name="Single Family" />
              <Bar dataKey="TH" stackId="a" fill="hsl(var(--chart-2))" name="Townhome" />
              <Bar dataKey="Condo" stackId="a" fill="hsl(var(--chart-3))" name="Condo" />
              <Bar dataKey="Commercial" stackId="a" fill="hsl(var(--chart-4))" name="Commercial" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }}></div>
            <span>Single Family</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }}></div>
            <span>Townhome</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-3))' }}></div>
            <span>Condo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-4))' }}></div>
            <span>Commercial</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};