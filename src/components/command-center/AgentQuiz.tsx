
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp } from 'lucide-react';

interface AgentQuizProps {
  onSubmit: (buyers: number, sellers: number, avgPrice: number) => Promise<void>;
}

export const AgentQuiz = ({ onSubmit }: AgentQuizProps) => {
  const [buyers, setBuyers] = useState('');
  const [sellers, setSellers] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyers || !sellers || !avgPrice) return;

    setLoading(true);
    try {
      await onSubmit(
        parseInt(buyers) || 0,
        parseInt(sellers) || 0,
        parseFloat(avgPrice.replace(/[,$]/g, '')) || 0
      );
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(parseInt(num));
  };

  const handlePriceChange = (value: string) => {
    setAvgPrice(formatCurrency(value));
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Quick Performance Setup</CardTitle>
        <p className="text-sm text-muted-foreground">
          Help us understand your recent performance to provide better insights
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyers">Buyer Side Deals (Last 12 months)</Label>
              <Input
                id="buyers"
                type="number"
                min="0"
                value={buyers}
                onChange={(e) => setBuyers(e.target.value)}
                placeholder="e.g., 8"
              />
            </div>
            <div>
              <Label htmlFor="sellers">Seller Side Deals (Last 12 months)</Label>
              <Input
                id="sellers"
                type="number"
                min="0"
                value={sellers}
                onChange={(e) => setSellers(e.target.value)}
                placeholder="e.g., 12"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="avgPrice">Average Sale Price</Label>
            <Input
              id="avgPrice"
              value={avgPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="$450,000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Average price across all your deals
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Why do we ask this?</p>
            <p className="text-muted-foreground">
              This helps us calculate your performance metrics and provide relevant recommendations. 
              When we connect your data feed, this information will be automatically updated.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={!buyers || !sellers || !avgPrice || loading}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save Performance Data'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
