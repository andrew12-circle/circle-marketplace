import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface Deal {
  id: string;
  close_date: string;
  sale_price: number;
}

interface SalePriceTrendChartProps {
  deals: Deal[];
}

export const SalePriceTrendChart = ({ deals }: SalePriceTrendChartProps) => {
  // Sort deals by date and create trend data
  const sortedDeals = [...deals].sort((a, b) => 
    new Date(a.close_date).getTime() - new Date(b.close_date).getTime()
  );

  // Create monthly averages for trend
  const monthlyData = sortedDeals.reduce((acc: any[], deal) => {
    const month = format(parseISO(deal.close_date), 'MMM yyyy');
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      existing.prices.push(deal.sale_price);
      existing.avgPrice = existing.prices.reduce((sum: number, price: number) => sum + price, 0) / existing.prices.length;
    } else {
      acc.push({
        month,
        prices: [deal.sale_price],
        avgPrice: deal.sale_price,
        date: deal.close_date
      });
    }
    
    return acc;
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Avg: ${value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p className="text-sm">No verified deals to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="avgPrice" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="font-medium text-lg">
            ${(sortedDeals[sortedDeals.length - 1]?.sale_price / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-muted-foreground">Latest Sale</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-lg">
            ${((sortedDeals.reduce((sum, deal) => sum + deal.sale_price, 0) / sortedDeals.length) / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-muted-foreground">Overall Avg</div>
        </div>
      </div>
    </div>
  );
};