import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, ExternalLink, RefreshCw, Search, Info } from 'lucide-react';

interface ServicePricingMirrorProps {
  serviceId: string;
  serviceName: string;
  currentScreenshotUrl?: string;
  currentPricingUrl?: string;
  lastCapturedAt?: string;
  serviceWebsiteUrl?: string;
}

export function ServicePricingMirror({
  serviceId,
  serviceName,
  currentScreenshotUrl,
  currentPricingUrl,
  lastCapturedAt,
  serviceWebsiteUrl
}: ServicePricingMirrorProps) {
  const [pricingUrl, setPricingUrl] = useState(currentPricingUrl || serviceWebsiteUrl || '');
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(currentScreenshotUrl);
  const [autoDetect, setAutoDetect] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCapture = async () => {
    if (!pricingUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a pricing page URL",
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-service-pricing', {
        body: {
          service_id: serviceId,
          pricing_url: pricingUrl,
          auto_detect: autoDetect
        }
      });

      if (error) throw error;

      if (data?.success) {
        setScreenshotUrl(data.screenshot_url);
        if (data.detected_url) {
          setDetectedUrl(data.detected_url);
        }
        toast({
          title: "Screenshot Captured",
          description: data.auto_detected 
            ? `Auto-detected and captured pricing page for ${serviceName}`
            : `Pricing page screenshot for ${serviceName} has been captured successfully`,
        });
      } else {
        throw new Error(data?.error || 'Failed to capture screenshot');
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: "Capture Failed",
        description: error.message || "Failed to capture pricing screenshot",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Pricing Mirror for {serviceName}
        </CardTitle>
        <CardDescription>
          Capture and monitor service pricing pages automatically for competitive analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input and Auto-Detect */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pricing-url">Service Pricing Page URL</Label>
            <div className="flex gap-2">
              <Input
                id="pricing-url"
                type="url"
                placeholder={serviceWebsiteUrl || "https://service.com/pricing"}
                value={pricingUrl}
                onChange={(e) => setPricingUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleCapture} 
                disabled={isCapturing || !pricingUrl}
                className="flex items-center gap-2"
              >
                {isCapturing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : autoDetect ? (
                  <Search className="w-4 h-4" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                {isCapturing ? 'Capturing...' : autoDetect ? 'Auto-Detect & Capture' : 'Capture'}
              </Button>
            </div>
          </div>

          {/* Auto-Detect Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Auto-Detect Pricing Page</Label>
                <p className="text-xs text-muted-foreground">
                  If enabled, will try to find the pricing page automatically from the main website URL
                </p>
              </div>
            </div>
            <Switch
              checked={autoDetect}
              onCheckedChange={setAutoDetect}
            />
          </div>

          {/* Auto-Detect Info */}
          {autoDetect && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Auto-detect will search for common pricing page paths like /pricing, /plans, /subscribe, etc.
                If no specific pricing page is found, it will capture the provided URL.
              </AlertDescription>
            </Alert>
          )}

          {/* Detected URL Display */}
          {detectedUrl && detectedUrl !== pricingUrl && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Search className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Auto-Detected Pricing Page</p>
                  <p className="text-xs text-green-600 break-all">{detectedUrl}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Info */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>
            <strong>Last Captured:</strong> {formatDate(lastCapturedAt)}
          </div>
          {screenshotUrl && (
            <Badge variant="outline" className="text-green-600">
              Screenshot Available
            </Badge>
          )}
        </div>

        {/* Current Screenshot Display */}
        {screenshotUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Current Pricing Screenshot</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(screenshotUrl, '_blank')}
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View Full Size
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={screenshotUrl}
                alt={`${serviceName} pricing page screenshot`}
                className="w-full h-auto max-h-96 object-contain bg-gray-50"
                onError={(e) => {
                  console.error('Failed to load screenshot:', e);
                  toast({
                    title: "Image Load Error",
                    description: "Failed to load the pricing screenshot",
                    variant: "destructive",
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* Help Text */}
        {!screenshotUrl && (
          <Alert>
            <AlertDescription>
              Enter the service's pricing page URL above and click "Capture" to take a screenshot.
              This will help monitor pricing changes and competitive analysis across Circle marketplace services.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}