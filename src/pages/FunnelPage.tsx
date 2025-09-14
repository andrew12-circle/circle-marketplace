import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { trackServiceEvent } from '@/lib/events';
import { ServiceFunnelModal } from '@/components/marketplace/ServiceFunnelModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PublicService = any; // Use any to avoid type conflicts


const FunnelSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="max-w-md mx-auto">
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Service Not Found</h3>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button onClick={() => window.location.href = '/'} className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Return to Marketplace
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default function FunnelPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const [service, setService] = useState<PublicService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get tracking parameters
  const view = searchParams.get('view') ?? 'funnel';
  const ref = searchParams.get('ref');
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');
  const utmTerm = searchParams.get('utm_term');
  const utmContent = searchParams.get('utm_content');

  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      try {
        if (!serviceId) {
          throw new Error('Missing service ID in URL');
        }

        // Validate service ID format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(serviceId)) {
          throw new Error('Invalid service ID format');
        }

        console.log('🔄 Loading service for funnel:', serviceId);

        const { data, error } = await supabase
          .from('services')
          .select(`
            id,
            title,
            description,
            category,
            funnel_content,
            pricing_tiers,
            retail_price,
            pro_price,
            co_pay_price,
            requires_quote,
            respa_split_limit,
            image_url,
            vendor_name,
            vendor_website,
            is_active
          `)
          .eq('id', serviceId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('❌ Error loading service:', error);
          throw new Error('Service not found or unavailable');
        }

        if (!cancelled) {
          setService(data);
          setError(null);
          
          // Track funnel view event (fire and forget)
          if (ref) {
            console.log('📊 Tracking funnel view with ref:', ref);
            trackServiceEvent({
              service_id: serviceId,
              event_type: 'view', // Use allowed event type
              user_id: null, // Public access
              metadata: {
                ref,
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                utm_term: utmTerm,
                utm_content: utmContent,
                view,
                funnel_context: true
              }
            });
          }
        }
      } catch (err) {
        console.error('❌ Service loading error:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load service');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadService();
    
    return () => {
      cancelled = true;
    };
  }, [serviceId, ref, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, view]);

  // SEO meta tags for sharing
  useEffect(() => {
    if (service) {
      document.title = `${service.title} - Circle Marketplace`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (metaDescription) {
        metaDescription.content = `Learn more about ${service.title}. ${service.description || 'Professional real estate services.'}`;
      }

      // Add Open Graph tags for social sharing
      const addMetaTag = (property: string, content: string) => {
        let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.content = content;
      };

      addMetaTag('og:title', service.title);
      addMetaTag('og:description', service.description || 'Professional real estate services');
      addMetaTag('og:type', 'website');
      addMetaTag('og:url', window.location.href);
      if (service.image_url) {
        addMetaTag('og:image', service.image_url);
      }
    }
  }, [service]);

  if (loading) {
    return <FunnelSkeleton />;
  }

  if (error || !service) {
    return <ErrorState message={error || 'Service not found or unavailable.'} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ServiceFunnelModal
        service={service}
        isOpen={true}
        onClose={() => window.location.href = '/'}
        isPublicView={true}
      />
    </div>
  );
}