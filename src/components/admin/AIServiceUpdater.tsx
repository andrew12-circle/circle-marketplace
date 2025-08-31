import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutoRecoverySystem } from '@/components/marketplace/AutoRecoverySystem';
import { useAutoRecovery } from '@/hooks/useAutoRecovery';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  website_url?: string;
  retail_price?: string;
  pro_price?: string;
  estimated_roi?: number;
  duration?: string;
  tags?: string[];
  funnel_content?: any;
  disclaimer_content?: any;
}

interface AIServiceUpdaterProps {
  services: Service[];
  onServiceUpdate: (serviceId: string) => void;
}

interface UpdateProgress {
  serviceId: string;
  serviceName: string;
  status: 'pending' | 'updating' | 'completed' | 'error';
  sections: {
    details: 'pending' | 'updating' | 'completed' | 'error';
    disclaimer: 'pending' | 'updating' | 'completed' | 'error';
    funnel: 'pending' | 'updating' | 'completed' | 'error';
    research: 'pending' | 'updating' | 'completed' | 'error';
  };
  error?: string;
}

export const AIServiceUpdater = ({ services, onServiceUpdate }: AIServiceUpdaterProps) => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<UpdateProgress[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('select');
  const [errorCount, setErrorCount] = useState(0);
  const [hasStuckState, setHasStuckState] = useState(false);

  // Auto-recovery system
  const { triggerRecovery, isRecovering, canAutoRecover } = useAutoRecovery({
    enabled: true,
    errorThreshold: 1,
    autoTriggerDelay: 2000
  });

  // Monitor for stuck states during AI generation
  const monitorStuckState = () => {
    if (isRunning) {
      // Check if any service has been "updating" for more than 60 seconds
      const stuckServices = progress.filter(p => {
        const hasStuckSection = Object.values(p.sections).some(status => status === 'updating');
        return p.status === 'updating' && hasStuckSection;
      });

      if (stuckServices.length > 0) {
        console.log('🚨 Detected stuck AI service generation:', stuckServices);
        setHasStuckState(true);
        setErrorCount(prev => prev + 1);
        
        if (canAutoRecover && errorCount === 0) {
          toast({
            title: "Our apologies, we hit a snag",
            description: "Let me refresh the system for you...",
            duration: 3000,
          });
          
          setTimeout(() => {
            triggerRecovery();
            setIsRunning(false);
            setProgress([]);
          }, 2000);
        }
      }
    }
  };

  // Set up monitoring interval when AI generation starts
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(monitorStuckState, 60000); // Check every 60 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, progress, canAutoRecover, errorCount]);

  const initializeProgress = (serviceIds: string[]) => {
    return serviceIds.map(id => {
      const service = services.find(s => s.id === id);
      return {
        serviceId: id,
        serviceName: service?.title || 'Unknown Service',
        status: 'pending' as const,
        sections: {
          details: 'pending' as const,
          disclaimer: 'pending' as const,
          funnel: 'pending' as const,
          research: 'pending' as const,
        }
      };
    });
  };

  const updateProgress = (serviceId: string, updates: Partial<UpdateProgress>) => {
    setProgress(prev => prev.map(p => 
      p.serviceId === serviceId ? { ...p, ...updates } : p
    ));
  };

  const updateSectionProgress = (serviceId: string, section: keyof UpdateProgress['sections'], status: UpdateProgress['sections'][keyof UpdateProgress['sections']]) => {
    setProgress(prev => prev.map(p => 
      p.serviceId === serviceId 
        ? { ...p, sections: { ...p.sections, [section]: status } }
        : p
    ));
  };

  const generateServiceDetails = async (service: Service) => {
    try {
      // Get existing research data to enhance generation
      const { data: existingResearch } = await supabase
        .from('service_ai_knowledge')
        .select('content')
        .eq('service_id', service.id)
        .eq('knowledge_type', 'research')
        .eq('is_active', true)
        .single();

      const { data, error } = await supabase.functions.invoke('ai-service-generator', {
        body: {
          type: 'details',
          service: {
            title: service.title,
            category: service.category,
            website_url: service.website_url,
            existing_research: existingResearch?.content
          },
          customPrompt
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating service details:', error);
      setErrorCount(prev => prev + 1);
      throw error;
    }
  };

  const generateDisclaimer = async (service: Service) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-service-generator', {
        body: {
          type: 'disclaimer',
          service: {
            title: service.title,
            category: service.category,
            website_url: service.website_url
          },
          customPrompt
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating disclaimer:', error);
      setErrorCount(prev => prev + 1);
      throw error;
    }
  };

  const generateFunnel = async (service: Service) => {
    try {
      // Get existing research data to enhance generation
      const { data: existingResearch } = await supabase
        .from('service_ai_knowledge')
        .select('content')
        .eq('service_id', service.id)
        .eq('knowledge_type', 'research')
        .eq('is_active', true)
        .single();

      const { data, error } = await supabase.functions.invoke('ai-service-generator', {
        body: {
          type: 'funnel',
          service: {
            title: service.title,
            description: service.description,
            category: service.category,
            website_url: service.website_url,
            retail_price: service.retail_price,
            pro_price: service.pro_price,
            estimated_roi: service.estimated_roi,
            duration: service.duration,
            existing_research: existingResearch?.content
          },
          customPrompt
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating funnel:', error);
      setErrorCount(prev => prev + 1);
      throw error;
    }
  };

  const generateResearch = async (service: Service) => {
    try {
      const { data, error } = await supabase.functions.invoke('bulk-generate-service-research', {
        body: {
          serviceId: service.id,
          serviceName: service.title,
          serviceCategory: service.category,
          websiteUrl: service.website_url,
          customPrompt
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating research:', error);
      setErrorCount(prev => prev + 1);
      throw error;
    }
  };

  const updateServiceInDatabase = async (serviceId: string, updates: any) => {
    const { error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId);

    if (error) throw error;
  };

  const storeResearchInKnowledge = async (serviceId: string, researchData: any) => {
    // First, deactivate existing research entries
    await supabase
      .from('service_ai_knowledge')
      .update({ is_active: false })
      .eq('service_id', serviceId)
      .eq('knowledge_type', 'research');

    // Create new research entry
    const { error } = await supabase
      .from('service_ai_knowledge')
      .insert({
        service_id: serviceId,
        title: `AI Generated Research`,
        knowledge_type: 'research',
        content: typeof researchData === 'string' ? researchData : JSON.stringify(researchData),
        tags: ['ai-generated', 'research'],
        priority: 8,
        is_active: true
      });

    if (error) throw error;
  };

  const processService = async (service: Service) => {
    updateProgress(service.id, { status: 'updating' });

    try {
      // Generate AI Research first (this provides context for other sections)
      updateSectionProgress(service.id, 'research', 'updating');
      const researchData = await generateResearch(service);
      await storeResearchInKnowledge(service.id, researchData);
      updateSectionProgress(service.id, 'research', 'completed');

      // Generate Service Details (now with research context)
      updateSectionProgress(service.id, 'details', 'updating');
      const detailsData = await generateServiceDetails(service);
      await updateServiceInDatabase(service.id, {
        description: detailsData.description,
        estimated_roi: detailsData.estimated_roi,
        duration: detailsData.duration,
        tags: detailsData.tags
      });
      updateSectionProgress(service.id, 'details', 'completed');

      // Generate Disclaimer
      updateSectionProgress(service.id, 'disclaimer', 'updating');
      const disclaimerData = await generateDisclaimer(service);
      const disclaimerContent = disclaimerData?.disclaimer_content ?? disclaimerData;
      await updateServiceInDatabase(service.id, { disclaimer_content: disclaimerContent });
      updateSectionProgress(service.id, 'disclaimer', 'completed');

      // Generate Funnel (with research context)
      updateSectionProgress(service.id, 'funnel', 'updating');
      const funnelData = await generateFunnel(service);
      await updateServiceInDatabase(service.id, { 
        funnel_content: funnelData.funnel_content,
        pricing_tiers: funnelData.pricing_tiers
      });
      updateSectionProgress(service.id, 'funnel', 'completed');

      updateProgress(service.id, { status: 'completed' });
      onServiceUpdate(service.id);

    } catch (error) {
      console.error(`Error processing service ${service.title}:`, error);
      updateProgress(service.id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      setErrorCount(prev => prev + 1);
    }
  };

  const runAIUpdater = async () => {
    if (selectedServices.length === 0) {
      toast({
        title: 'No Services Selected',
        description: 'Please select at least one service to update.',
        variant: 'destructive'
      });
      return;
    }

    setIsRunning(true);
    setActiveTab('progress');
    setHasStuckState(false);
    setErrorCount(0);
    
    const servicesToUpdate = services.filter(s => selectedServices.includes(s.id));
    setProgress(initializeProgress(selectedServices));

    try {
      // Process services sequentially to avoid rate limits
      for (const service of servicesToUpdate) {
        await processService(service);
        // Small delay between services
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast({
        title: 'AI Update Complete',
        description: `Processed ${servicesToUpdate.length} services. Check results and verify content.`,
      });
    } catch (error) {
      console.error('AI updater failed:', error);
      setErrorCount(prev => prev + 1);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRecoveryComplete = () => {
    setErrorCount(0);
    setHasStuckState(false);
    setIsRunning(false);
    setProgress([]);
    
    toast({
      title: "System refreshed",
      description: "AI Service Updater is ready to go!",
      duration: 2000,
    });
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectAllServices = () => {
    setSelectedServices(services.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedServices([]);
  };

  const getSectionIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'updating': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Service Updater
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically generate and update all service sections using AI. Review and verify results after completion.
        </p>
      </CardHeader>
      <CardContent>
        {(errorCount > 0 || hasStuckState) && (
          <div className="mb-6">
            <AutoRecoverySystem
              isError={errorCount > 0 || hasStuckState}
              errorCount={errorCount}
              onRecoveryComplete={handleRecoveryComplete}
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select">Select Services</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllServices}>
                  Select All ({services.length})
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
              <Badge variant="secondary">
                {selectedServices.length} selected
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {services.map((service) => (
                <Card 
                  key={service.id}
                  className={`cursor-pointer transition-colors ${
                    selectedServices.includes(service.id) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleServiceSelection(service.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">{service.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {service.category}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {!service.funnel_content && (
                            <Badge variant="outline" className="text-xs">No Funnel</Badge>
                          )}
                          {!service.disclaimer_content && (
                            <Badge variant="outline" className="text-xs">No Disclaimer</Badge>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <div className={`w-4 h-4 rounded border-2 ${
                          selectedServices.includes(service.id)
                            ? 'bg-primary border-primary'
                            : 'border-gray-300'
                        }`}>
                          {selectedServices.includes(service.id) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Instructions (Optional)</label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add any specific instructions for the AI generator (e.g., 'Focus on luxury market', 'Emphasize ROI benefits', etc.)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These instructions will be applied to all sections being generated.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">What will be generated:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• AI Research - Comprehensive service analysis (stored in knowledge base)</li>
                <li>• Service Details - Description, ROI, duration, tags</li>
                <li>• Disclaimer Content - Legal and compliance information</li>
                <li>• Funnel Content - Complete sales funnel with pricing tiers</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {progress.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {progress.map((item) => (
                  <Card key={item.serviceId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{item.serviceName}</h4>
                        <Badge 
                          variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'error' ? 'destructive' :
                            item.status === 'updating' ? 'secondary' : 'outline'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                          {getSectionIcon(item.sections.research)}
                          <span className="text-sm">Research</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSectionIcon(item.sections.details)}
                          <span className="text-sm">Details</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSectionIcon(item.sections.disclaimer)}
                          <span className="text-sm">Disclaimer</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSectionIcon(item.sections.funnel)}
                          <span className="text-sm">Funnel</span>
                        </div>
                      </div>
                      
                      {item.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                          Error: {item.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {progress.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No updates in progress. Go to "Select Services" to start.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedServices.length > 0 && (
              <span>{selectedServices.length} services selected for AI generation</span>
            )}
          </div>
          <Button 
            onClick={runAIUpdater}
            disabled={isRunning || selectedServices.length === 0 || isRecovering}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : isRecovering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing System...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate All Sections
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
