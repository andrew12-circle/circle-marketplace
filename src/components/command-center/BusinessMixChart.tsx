import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Deal {
  id: string;
  role: 'buyer' | 'seller';
  sale_price: number;
}

interface BusinessMixChartProps {
  deals: Deal[];
}

export const BusinessMixChart = ({ deals }: BusinessMixChartProps) => {
  const buyerDeals = deals.filter(deal => deal.role === 'buyer');
  const sellerDeals = deals.filter(deal => deal.role === 'seller');
  
  const data = [
    {
      name: 'Buyer Side',
      value: buyerDeals.length,
      volume: buyerDeals.reduce((sum, deal) => sum + deal.sale_price, 0),
      color: 'hsl(var(--primary))'
    },
    {
      name: 'Seller Side', 
      value: sellerDeals.length,
      volume: sellerDeals.reduce((sum, deal) => sum + deal.sale_price, 0),
      color: 'hsl(var(--secondary))'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} deals • ${(data.volume / 1000000).toFixed(1)}M volume
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
            fontSize={12}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}</span>
            </div>
            <div className="text-right">
              <div className="font-medium">{entry.value} deals</div>
              <div className="text-xs text-muted-foreground">
                ${(entry.volume / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};