import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Download, 
  Calendar,
  DollarSign,
  Eye
} from 'lucide-react';

interface PurchasedPlaybook {
  id: string;
  playbook_id: string;
  purchase_id: string;
  access_granted_at: string;
  content: {
    id: string;
    title: string;
    description: string;
    playbook_price: number;
    metadata: any;
    profiles: {
      display_name: string;
    };
  };
}

export const MyPlaybooks = () => {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<PurchasedPlaybook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPlaybooks();
    }
  }, [user]);

  const fetchUserPlaybooks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playbook_access')
        .select(`
          id,
          playbook_id,
          purchase_id,
          access_granted_at,
          content:playbook_id (
            id,
            title,
            description,
            playbook_price,
            metadata,
            profiles:creator_id (display_name)
          )
        `)
        .eq('user_id', user.id)
        .order('access_granted_at', { ascending: false });

      if (error) throw error;
      setPlaybooks(data || []);
    } catch (error) {
      console.error('Error fetching user playbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlaybook = (playbook: PurchasedPlaybook) => {
    // For now, we'll show the playbook data in a simple format
    // In a real implementation, you'd navigate to a dedicated playbook viewer
    const playbookData = playbook.content.metadata?.playbook_data;
    if (playbookData) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${playbook.content.title}</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                h2 { color: #555; margin-top: 30px; }
                .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
                .meta { color: #666; font-size: 0.9em; }
              </style>
            </head>
            <body>
              <h1>${playbook.content.title}</h1>
              <div class="meta">
                <p><strong>Created by:</strong> ${playbook.content.profiles?.display_name || 'Anonymous Agent'}</p>
                <p><strong>Description:</strong> ${playbook.content.description}</p>
              </div>
              ${Object.entries(playbookData).map(([key, value]) => `
                <div class="section">
                  <h2>Section ${key.replace('section_', '').replace('_content', '')}</h2>
                  <div>${value}</div>
                </div>
              `).join('')}
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Loading your playbooks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">My Playbooks</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Access your purchased agent playbooks
          </p>
        </div>
      </div>

      {playbooks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Playbooks Purchased</h3>
            <p className="text-muted-foreground mb-4">
              You haven't purchased any playbooks yet. Browse the marketplace to find expert strategies.
            </p>
            <Button onClick={() => window.location.href = '/academy'}>
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="space-y-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {item.content.title}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ${item.content.playbook_price}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      By {item.content.profiles?.display_name || 'Anonymous'}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {item.content.description}
                </p>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Purchased {new Date(item.access_granted_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {item.content.metadata?.playbook_data && (
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(item.content.metadata.playbook_data).length} sections included
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={() => handleViewPlaybook(item)}
                    className="w-full"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Playbook
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Simple download as JSON for now
                      const dataStr = JSON.stringify(item.content.metadata?.playbook_data, null, 2);
                      const dataBlob = new Blob([dataStr], {type: 'application/json'});
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${item.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_playbook.json`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};