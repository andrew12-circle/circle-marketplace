import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Transaction } from '@/hooks/useAgentData';

interface TransactionMapProps {
  transactions: Transaction[];
}

export const TransactionMap = ({ transactions }: TransactionMapProps) => {
  // For now, display a placeholder since we need to implement actual map integration
  const transactionsWithLocation = transactions.filter(t => t.latitude && t.longitude);
  
  const propertyTypeColors = {
    'SFH': 'bg-blue-500',
    'TH': 'bg-green-500',
    'Condo': 'bg-purple-500',
    'Commercial': 'bg-orange-500'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Transaction Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactionsWithLocation.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No location data available for transactions
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Add coordinates to your transactions to see them on the map
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Placeholder for map - would integrate with Mapbox or similar */}
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-lg font-semibold">Interactive Map</p>
                <p className="text-sm text-muted-foreground">
                  {transactionsWithLocation.length} transactions with location data
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {Object.entries(propertyTypeColors).map(([type, colorClass]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                  <span>{type === 'SFH' ? 'Single Family' : type === 'TH' ? 'Townhome' : type}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};