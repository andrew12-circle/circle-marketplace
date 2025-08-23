import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  User, 
  Clock, 
  Star, 
  ShoppingCart,
  Eye,
  DollarSign,
  Download,
  CheckCircle
} from 'lucide-react';

interface Playbook {
  id: string;
  title: string;
  description: string;
  playbook_price: number;
  revenue_share_percentage: number;
  created_at: string;
  metadata: any;
  profiles: {
    display_name: string;
  };
}

export const PlaybookMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedPlaybooks, setPurchasedPlaybooks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPlaybooks();
    if (user) {
      fetchUserPurchases();
    }
  }, [user]);

  const fetchPlaybooks = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          id,
          title,
          description,
          playbook_price,
          revenue_share_percentage,
          created_at,
          metadata,
          profiles:creator_id (display_name)
        `)
        .eq('is_agent_playbook', true)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaybooks(data || []);
    } catch (error) {
      console.error('Error fetching playbooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playbooks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playbook_access')
        .select('playbook_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setPurchasedPlaybooks(new Set(data.map(p => p.playbook_id)));
    } catch (error) {
      console.error('Error fetching user purchases:', error);
    }
  };

  const handlePurchase = async (playbookId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to purchase playbooks',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-playbook-payment', {
        body: { playbookId }
      });

      if (error) throw error;

      if (data.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to create payment session. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Agent Playbook Marketplace</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Learn from top-performing agents and grow your business
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="font-semibold">Expert Strategies</div>
            <div className="text-sm text-muted-foreground">From successful agents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-semibold">Instant Access</div>
            <div className="text-sm text-muted-foreground">Download immediately</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-semibold">$99 Each</div>
            <div className="text-sm text-muted-foreground">Professional playbooks</div>
          </CardContent>
        </Card>
      </div>

      {playbooks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Playbooks Available</h3>
            <p className="text-muted-foreground">
              Check back soon for new agent playbooks, or create your own to start earning!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((playbook) => {
            const isPurchased = purchasedPlaybooks.has(playbook.id);
            const isOwnPlaybook = user?.id === playbook.metadata?.creator_id;
            
            return (
              <Card key={playbook.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {playbook.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{playbook.profiles?.display_name || 'Anonymous Agent'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {playbook.description}
                  </p>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {playbook.metadata?.playbook_data && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {Object.keys(playbook.metadata.playbook_data).length} sections
                          </span>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        ${playbook.playbook_price}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        One-time purchase
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isOwnPlaybook ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>Your Playbook</span>
                      </div>
                    ) : isPurchased ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Purchased</span>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handlePurchase(playbook.id)}
                        className="w-full"
                        size="sm"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Purchase for ${playbook.playbook_price}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};