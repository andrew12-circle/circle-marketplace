// @ts-nocheck
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Webhook, 
  Youtube, 
  Facebook,
  Mail,
  Zap,
  Globe,
  Code,
  Settings,
  Copy,
  CheckCircle,
  ExternalLink,
  Rss,
  Bot
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  webhook_url: string;
  content_type: string;
  is_active: boolean;
  created_at: string;
}

export const ContentAPIConnections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Webhook Management
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookName, setWebhookName] = useState('');
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  
  // API Keys
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [mailchimpApiKey, setMailchimpApiKey] = useState('');
  
  // Zapier Integration
  const [zapierWebhook, setZapierWebhook] = useState('');
  
  // RSS Feeds
  const [rssFeeds, setRssFeeds] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Generate unique webhook URL for this creator
  const generateWebhookUrl = () => {
    if (!user) return;
    
    const webhookId = `${user.id}-${Date.now()}`;
    const baseUrl = 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/content-webhook';
    const generatedUrl = `${baseUrl}/${webhookId}`;
    setWebhookUrl(generatedUrl);
  };

  const createWebhook = async () => {
    if (!webhookUrl || !webhookName || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('creator_webhooks')
        .insert({
          user_id: user.id,
          name: webhookName,
          webhook_url: webhookUrl,
          content_type: 'mixed',
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Webhook Created!',
        description: 'Your content webhook is ready to receive data.',
      });

      setWebhookName('');
      setWebhookUrl('');
      loadWebhooks();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to create webhook. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWebhooks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('creator_webhooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWebhooks(data);
    }
  };

  const testZapierIntegration = async () => {
    if (!zapierWebhook) {
      toast({
        title: "Error",
        description: "Please enter your Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await fetch(zapierWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          test: true,
          creator_id: user?.id,
          timestamp: new Date().toISOString(),
          message: "Test from Circle Creator Platform"
        }),
      });

      toast({
        title: "Test Sent!",
        description: "Check your Zapier workflow to confirm the test was received.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test to Zapier webhook.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveApiKeys = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('creator_api_configs')
        .upsert({
          user_id: user.id,
          youtube_api_key: youtubeApiKey || null,
          mailchimp_api_key: mailchimpApiKey || null,
          zapier_webhook: zapierWebhook || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'API Keys Saved!',
        description: 'Your API configurations have been securely stored.',
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to save API configurations.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRssImport = async () => {
    if (!rssFeeds.trim() || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-rss-import', {
        body: {
          userId: user.id,
          rssFeeds: rssFeeds.split('\n').filter(url => url.trim())
        }
      });

      if (error) throw error;

      toast({
        title: 'RSS Import Configured!',
        description: `Set up automatic import for ${data.feedCount} RSS feeds.`,
      });

      setRssFeeds('');
    } catch (error) {
      console.error('Error setting up RSS import:', error);
      toast({
        title: 'Error',
        description: 'Failed to configure RSS import.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Copied to clipboard',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Automated Content Connections
        </h2>
        <p className="text-muted-foreground mt-2">
          Set up automatic imports and API connections to streamline your content workflow
        </p>
      </div>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="zapier" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Zapier
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="rss" className="flex items-center gap-2">
            <Rss className="w-4 h-4" />
            RSS Feeds
          </TabsTrigger>
          <TabsTrigger value="browser" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Browser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-blue-600" />
                Content Webhooks
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Send content directly to your platform via HTTP webhooks. Perfect for automation tools.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="webhook-name">Webhook Name</Label>
                  <Input
                    id="webhook-name"
                    value={webhookName}
                    onChange={(e) => setWebhookName(e.target.value)}
                    placeholder="My Content Webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="Generated webhook URL"
                      readOnly
                    />
                    <Button variant="outline" onClick={generateWebhookUrl}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={createWebhook} 
                    disabled={!webhookUrl || !webhookName || loading}
                    className="w-full"
                  >
                    Create Webhook
                  </Button>
                </div>
              </div>

              {webhooks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Your Webhooks</h4>
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h5 className="font-medium">{webhook.name}</h5>
                        <p className="text-sm text-muted-foreground font-mono">
                          {webhook.webhook_url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={webhook.is_active ? "default" : "secondary"}>
                          {webhook.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(webhook.webhook_url)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How to use webhooks:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Send POST requests to your webhook URL with content data</li>
                  <li>• Include fields: title, description, content_url, content_type</li>
                  <li>• Content will automatically appear in your dashboard</li>
                  <li>• Perfect for CRM systems, automation tools, or custom scripts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zapier" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Zapier Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect with 5000+ apps using Zapier. Automatically import content from anywhere.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="zapier-webhook">Your Zapier Webhook URL</Label>
                <Input
                  id="zapier-webhook"
                  value={zapierWebhook}
                  onChange={(e) => setZapierWebhook(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={testZapierIntegration} disabled={loading} variant="outline">
                  Test Connection
                </Button>
                <Button onClick={saveApiKeys} disabled={loading}>
                  Save Configuration
                </Button>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">Popular Zapier Workflows:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-orange-800">
                  <div>• YouTube → Auto-import new videos</div>
                  <div>• Gmail → Convert emails to playbooks</div>
                  <div>• Facebook → Import page posts</div>
                  <div>• RSS → Sync blog content</div>
                  <div>• Airtable → Import content database</div>
                  <div>• Slack → Save important messages</div>
                </div>
                <Button 
                  variant="link" 
                  className="text-orange-600 p-0 mt-2"
                  asChild
                >
                  <a href="https://zapier.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Create Zapier Workflows
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-green-600" />
                Direct API Integrations
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect directly to platform APIs for automatic content sync.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="youtube-api">YouTube Data API Key</Label>
                  <Input
                    id="youtube-api"
                    type="password"
                    value={youtubeApiKey}
                    onChange={(e) => setYoutubeApiKey(e.target.value)}
                    placeholder="Your YouTube API key"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-import from your YouTube channels
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="mailchimp-api">Mailchimp API Key</Label>
                  <Input
                    id="mailchimp-api"
                    type="password"
                    value={mailchimpApiKey}
                    onChange={(e) => setMailchimpApiKey(e.target.value)}
                    placeholder="Your Mailchimp API key"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Import email campaigns as playbooks
                  </p>
                </div>
              </div>

              <Button onClick={saveApiKeys} disabled={loading} className="w-full">
                Save API Keys
              </Button>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">API Benefits:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Automatic daily sync of new content</li>
                  <li>• Metadata preservation (views, likes, etc.)</li>
                  <li>• Bulk import capabilities</li>
                  <li>• Real-time notifications of new content</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rss" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rss className="w-5 h-5 text-purple-600" />
                RSS Feed Import
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Automatically import content from RSS feeds, blogs, and podcasts.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rss-feeds">RSS Feed URLs (one per line)</Label>
                <Textarea
                  id="rss-feeds"
                  value={rssFeeds}
                  onChange={(e) => setRssFeeds(e.target.value)}
                  placeholder="https://example.com/feed.xml&#10;https://youtube.com/feeds/videos.xml?channel_id=YOUR_CHANNEL&#10;https://anchor.fm/s/podcast-id/podcast/rss"
                  rows={6}
                />
              </div>

              <Button onClick={setupRssImport} disabled={loading} className="w-full">
                Setup RSS Import
              </Button>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Supported RSS Sources:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-800">
                  <div>• YouTube channel feeds</div>
                  <div>• Blog RSS feeds</div>
                  <div>• Podcast RSS feeds</div>
                  <div>• Medium publications</div>
                  <div>• LinkedIn article feeds</div>
                  <div>• Any standard RSS/Atom feed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browser" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Browser Extension (Coming Soon)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                One-click import while browsing YouTube, Facebook, and other platforms.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Bot className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Browser Extension in Development</h3>
                <p className="text-muted-foreground mb-4">
                  Get notified when our Chrome extension is ready for one-click content import.
                </p>
                <Button variant="outline">
                  Join Waitlist
                </Button>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Planned Features:</h4>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• One-click import from any video page</li>
                  <li>• Bulk select and import from channel pages</li>
                  <li>• Auto-detect and suggest content categories</li>
                  <li>• Real-time import progress notifications</li>
                  <li>• Works on YouTube, Facebook, LinkedIn, and more</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};