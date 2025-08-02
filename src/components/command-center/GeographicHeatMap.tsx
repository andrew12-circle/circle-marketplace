import { MapPin } from "lucide-react";

interface Deal {
  id: string;
  address: string;
  sale_price: number;
  role: 'buyer' | 'seller';
}

interface GeographicHeatMapProps {
  deals: Deal[];
}

export const GeographicHeatMap = ({ deals }: GeographicHeatMapProps) => {
  // Mock Franklin area data - in production this would use real mapping
  const franklinAreas = [
    { name: "Downtown Franklin", deals: deals.filter(d => d.address.includes("Main")).length, avgPrice: 1200000 },
    { name: "Cool Springs", deals: deals.filter(d => d.address.includes("Oak")).length, avgPrice: 850000 },
    { name: "Westhaven", deals: deals.filter(d => d.address.includes("Maple")).length, avgPrice: 910000 },
    { name: "Berry Farms", deals: 0, avgPrice: 0 },
    { name: "Fieldstone Farms", deals: 0, avgPrice: 0 }
  ];

  const maxDeals = Math.max(...franklinAreas.map(area => area.deals));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {franklinAreas.map((area) => (
          <div key={area.name} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MapPin 
                  className="w-5 h-5" 
                  style={{ 
                    color: area.deals > 0 ? `hsl(var(--primary))` : '#d1d5db',
                    opacity: maxDeals > 0 ? 0.3 + (area.deals / maxDeals) * 0.7 : 0.3
                  }} 
                />
                {area.deals > 0 && (
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                    {area.deals}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium text-sm">{area.name}</div>
                <div className="text-xs text-muted-foreground">
                  {area.deals > 0 ? `Avg: $${(area.avgPrice / 1000).toFixed(0)}k` : 'No activity'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{area.deals} deals</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          Franklin territory visualization • {deals.length} verified deals
        </p>
      </div>
    </div>
  );
};