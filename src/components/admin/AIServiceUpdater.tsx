import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Sparkles, CheckCircle, AlertCircle, Loader2, FileText, Zap, Share, Lightbulb, HelpCircle, Shield, Clock, Check } from 'lucide-react';
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
  pricing_tiers?: any;
  is_verified?: boolean;
  price_duration?: string;
  copay_allowed?: boolean;
  respa_split_limit?: number;
  allowed_split_percentage?: number;
}

interface AIServiceUpdaterProps {
  services: Service[];
  onServiceUpdate: (serviceId: string) => void;
}

interface SectionStatus {
  details: 'pending' | 'generating' | 'completed' | 'error';
  disclaimer: 'pending' | 'generating' | 'completed' | 'error';
  funnel: 'pending' | 'generating' | 'completed' | 'error';
  research: 'pending' | 'generating' | 'completed' | 'error';
  faqs: 'pending' | 'generating' | 'completed' | 'error';
  verification: 'pending' | 'generating' | 'completed' | 'error';
}

interface UpdateProgress {
  serviceId: string;
  serviceName: string;
  status: 'pending' | 'updating' | 'completed' | 'error';
  sections: SectionStatus;
  error?: string;
  research_data?: any;
  updatedSections?: { [key: string]: { date: string; notes?: string } };
}

interface ServiceUpdateTracking {
  service_id: string;
  section_name: string;
  updated_at: string;
  notes?: string;
}

export const AIServiceUpdater = ({ services, onServiceUpdate }: AIServiceUpdaterProps) => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [serviceProgress, setServiceProgress] = useState<Record<string, UpdateProgress>>({});
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [updateTracking, setUpdateTracking] = useState<Record<string, ServiceUpdateTracking[]>>({});
  const [customPrompts, setCustomPrompts] = useState({
    details: '',
    disclaimer: '',
    funnel: '',
    faqs: ''
  });
  const [activeTab, setActiveTab] = useState('select');
  const [errorCount, setErrorCount] = useState(0);
  const [hasStuckState, setHasStuckState] = useState(false);
  const [runInBackground, setRunInBackground] = useState(false);
  const [overwriteAIUpdated, setOverwriteAIUpdated] = useState(false);

  // Auto-recovery system
  const { triggerRecovery, isRecovering, canAutoRecover } = useAutoRecovery({
    enabled: true,
    errorThreshold: 1,
    autoTriggerDelay: 2000
  });

  // Load update tracking data
  useEffect(() => {
    loadUpdateTracking();
  }, []);

  const loadUpdateTracking = async () => {
    try {
      const { data, error } = await supabase
        .from('service_update_tracking')
        .select('service_id, section_name, updated_at, notes')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading update tracking:', error);
        return;
      }

      // Group by service_id
      const trackingByService: Record<string, ServiceUpdateTracking[]> = {};
      data?.forEach(track => {
        if (!trackingByService[track.service_id]) {
          trackingByService[track.service_id] = [];
        }
        trackingByService[track.service_id].push(track);
      });

      setUpdateTracking(trackingByService);
    } catch (error) {
      console.error('Error loading update tracking:', error);
    }
  };

  const recordSectionUpdate = async (serviceId: string, sectionName: string, notes?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('service_update_tracking')
        .insert({
          service_id: serviceId,
          section_name: sectionName,
          updated_by: user.user.id,
          notes: notes || `AI generated ${sectionName} section`
        });

      if (error) {
        console.error('Error recording section update:', error);
      } else {
        // Reload tracking data
        await loadUpdateTracking();
      }
    } catch (error) {
      console.error('Error recording section update:', error);
    }
  };

  const getSectionUpdateInfo = (serviceId: string, sectionName: string) => {
    const serviceTracking = updateTracking[serviceId] || [];
    const sectionUpdate = serviceTracking.find(t => t.section_name === sectionName);
    return sectionUpdate;
  };

  const formatUpdateDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSectionBadgeInfo = (service: Service, sectionName: string) => {
    const aiUpdate = getSectionUpdateInfo(service.id, sectionName);
    let hasContent = false;
    
    switch (sectionName) {
      case 'details':
        hasContent = !!service.description;
        break;
      case 'disclaimer':
        hasContent = !!service.disclaimer_content;
        break;
      case 'funnel':
        hasContent = !!service.funnel_content;
        break;
      case 'research':
      case 'faqs':
        hasContent = !!aiUpdate; // These only exist if AI updated
        break;
    }

    if (aiUpdate) {
      return {
        status: 'ai_updated',
        text: `AI Updated`,
        variant: 'default' as const,
        tooltip: `AI updated on ${formatUpdateDate(aiUpdate.updated_at)}`
      };
    } else if (hasContent) {
      return {
        status: 'has_content',
        text: `Has Content`,
        variant: 'secondary' as const,
        tooltip: 'Content added manually'
      };
    } else {
      return {
        status: 'missing',
        text: `Missing`,
        variant: 'outline' as const,
        tooltip: 'No content available'
      };
    }
  };

  const getCompletionSummary = (service: Service) => {
    const sections = ['details', 'disclaimer', 'funnel', 'research', 'faqs'];
    const completed = sections.filter(section => {
      const badgeInfo = getSectionBadgeInfo(service, section);
      return badgeInfo.status === 'ai_updated' || badgeInfo.status === 'has_content';
    });
    
    return {
      completed: completed.length,
      total: sections.length,
      percentage: Math.round((completed.length / sections.length) * 100)
    };
  };

  // Monitor for stuck states during AI generation
  const monitorStuckState = () => {
    if (isRunning) {
      const stuckServices = Object.values(serviceProgress).filter(p => {
        const hasStuckSection = Object.values(p.sections).some(status => status === 'generating');
        return p.status === 'updating' && hasStuckSection;
      });

      if (stuckServices.length > 0) {
        console.log('🚨 Detected stuck AI service generation:', stuckServices);
        setHasStuckState(true);
        setErrorCount(prev => prev + 1);
        
        // Force stop the process and show error
        setIsRunning(false);
        stuckServices.forEach(service => {
          updateProgress(service.serviceId, { 
            status: 'error', 
            error: 'Process timed out - please try again' 
          });
        });
        
        toast({
          title: "Process timed out",
          description: "The AI updater got stuck. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
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
  }, [isRunning, serviceProgress, canAutoRecover, errorCount]);

  const initializeProgress = (serviceIds: string[]): Record<string, UpdateProgress> => {
    const progressMap: Record<string, UpdateProgress> = {};
    
    serviceIds.forEach(id => {
      const service = services.find(s => s.id === id);
      progressMap[id] = {
        serviceId: id,
        serviceName: service?.title || 'Unknown Service',
        status: 'pending',
        sections: {
          details: 'pending',
          disclaimer: 'pending',
          funnel: 'pending',
          research: 'pending',
          faqs: 'pending',
          verification: 'pending'
        }
      };
    });
    
    return progressMap;
  };

  const updateProgress = (serviceId: string, updates: Partial<UpdateProgress>) => {
    setServiceProgress(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], ...updates }
    }));
  };

  const updateSectionProgress = (serviceId: string, section: keyof SectionStatus, status: SectionStatus[keyof SectionStatus]) => {
    setServiceProgress(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        sections: { ...prev[serviceId].sections, [section]: status }
      }
    }));
  };

  const generateServiceDetails = async (service: Service, progress: UpdateProgress): Promise<any> => {
    console.log(`Generating details for ${service.title}...`);
    updateSectionProgress(service.id, 'details', 'generating');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-service-generator', {
        body: {
          type: 'details',
          service: {
            ...service,
            existing_research: progress.research_data
          },
          customPrompt: customPrompts.details
        }
      });

      if (error) throw error;
      
      updateSectionProgress(service.id, 'details', 'completed');
      await recordSectionUpdate(service.id, 'details', 'AI generated service details including pricing and RESPA assessment');
      return data;
    } catch (error) {
      console.error('Error generating details:', error);
      updateSectionProgress(service.id, 'details', 'error');
      throw error;
    }
  };

  const generateDisclaimer = async (service: Service, progress: UpdateProgress): Promise<any> => {
    console.log(`Generating disclaimer for ${service.title}...`);
    updateSectionProgress(service.id, 'disclaimer', 'generating');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-service-generator', {
        body: {
          type: 'disclaimer',
          service: {
            ...service,
            existing_research: progress.research_data
          },
          customPrompt: customPrompts.disclaimer
        }
      });

      if (error) throw error;
      
      updateSectionProgress(service.id, 'disclaimer', 'completed');
      await recordSectionUpdate(service.id, 'disclaimer', 'AI generated disclaimer content');
      return data;
    } catch (error) {
      console.error('Error generating disclaimer:', error);
      updateSectionProgress(service.id, 'disclaimer', 'error');
      throw error;
    }
  };

  const generateFunnel = async (service: Service, progress: UpdateProgress): Promise<any> => {
    console.log(`Generating funnel for ${service.title}...`);
    updateSectionProgress(service.id, 'funnel', 'generating');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-service-generator', {
        body: {
          type: 'funnel',
          service: {
            ...service,
            existing_research: progress.research_data
          },
          customPrompt: customPrompts.funnel
        }
      });

      if (error) throw error;
      
      updateSectionProgress(service.id, 'funnel', 'completed');
      await recordSectionUpdate(service.id, 'funnel', 'AI generated sales funnel and pricing tiers');
      return data;
    } catch (error) {
      console.error('Error generating funnel:', error);
      updateSectionProgress(service.id, 'funnel', 'error');
      throw error;
    }
  };

  const generateResearch = async (service: Service): Promise<any> => {
    console.log(`Generating research for ${service.title}...`);
    updateSectionProgress(service.id, 'research', 'generating');
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('bulk-generate-service-research', {
        body: {
          serviceId: service.id,
          serviceName: service.title,
          serviceCategory: service.category,
          websiteUrl: service.website_url,
          customPrompt: customPrompts.details
        },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`
        }
      });

      if (error) {
        console.warn('Research generation failed, continuing without research context:', error);
        updateSectionProgress(service.id, 'research', 'error');
        return null;
      }
      
      updateSectionProgress(service.id, 'research', 'completed');
      await recordSectionUpdate(service.id, 'research', 'AI generated market research and analysis');
      return data;
    } catch (error) {
      console.warn('Research generation failed, continuing without research context:', error);
      updateSectionProgress(service.id, 'research', 'error');
      return null;
    }
  };

  const generateServiceFAQs = async (service: Service, progress: UpdateProgress): Promise<any> => {
    console.log(`Generating FAQs for ${service.title}...`);
    updateSectionProgress(service.id, 'faqs', 'generating');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-service-faqs', {
        body: {
          service: {
            ...service,
            existing_research: progress.research_data
          },
          customPrompt: customPrompts.faqs
        }
      });

      if (error) throw error;
      
      updateSectionProgress(service.id, 'faqs', 'completed');
      await recordSectionUpdate(service.id, 'faqs', 'AI generated frequently asked questions');
      return data;
    } catch (error) {
      console.error('Error generating FAQs:', error);
      updateSectionProgress(service.id, 'faqs', 'error');
      throw error;
    }
  };

  const logAIUpdateNote = async (serviceId: string, serviceName: string): Promise<void> => {
    try {
      const updateSummary = Object.entries(serviceProgress[serviceId]?.sections || {})
        .filter(([_, status]) => status === 'completed')
        .map(([section, _]) => section)
        .join(', ');
      
      const noteText = `🤖 AI Auto-Update Complete\n\nSections updated: ${updateSummary}\nCompleted: ${new Date().toLocaleString()}\n\n⚠️ Please review all AI-generated content for accuracy and compliance before publishing.`;
      
      const { error } = await supabase
        .from('admin_notes')
        .insert({
          service_id: serviceId,
          note_text: noteText,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        console.error('Error logging AI update note:', error);
      } else {
        console.log(`✅ Logged AI update note for ${serviceName}`);
      }
    } catch (error) {
      console.error('Error logging AI update note:', error);
    }
  };

  const checkIfAIUpdated = async (serviceId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admin_notes')
        .select('id')
        .eq('service_id', serviceId)
        .like('note_text', '%AI Auto-Update Complete%')
        .limit(1);

      if (error) {
        console.error('Error checking AI update status:', error);
        return false;
      }

      return data.length > 0;
    } catch (error) {
      console.error('Error checking AI update status:', error);
      return false;
    }
  };

  const verifyServiceCompletion = async (service: Service): Promise<boolean> => {
    console.log(`Verifying completion for ${service.title}...`);
    updateSectionProgress(service.id, 'verification', 'generating');
    
    try {
      // Check if all required fields are present
      const { data: updatedService, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', service.id)
        .single();

      if (error) throw error;

      console.log('Service data for verification:', {
        id: updatedService.id,
        title: updatedService.title,
        description: updatedService.description ? 'present' : 'missing',
        estimated_roi: updatedService.estimated_roi ? 'present' : 'missing',
        duration: updatedService.duration ? 'present' : 'missing',
        tags: updatedService.tags ? `present (${updatedService.tags.length} items)` : 'missing',
        retail_price: updatedService.retail_price ? 'present' : 'missing',
        price_duration: updatedService.price_duration ? 'present' : 'missing',
        disclaimer_id: updatedService.disclaimer_id ? 'present' : 'missing',
        funnel_content: updatedService.funnel_content ? 'present' : 'missing',
        pricing_tiers: updatedService.pricing_tiers ? 'present' : 'missing'
      });

      const hasAllFields = !!(
        updatedService.description &&
        updatedService.estimated_roi &&
        updatedService.duration &&
        updatedService.tags &&
        updatedService.tags.length > 0 &&
        updatedService.retail_price &&
        updatedService.price_duration &&
        updatedService.disclaimer_id &&
        updatedService.funnel_content &&
        updatedService.pricing_tiers
      );

      console.log(`All required fields present: ${hasAllFields}`);

      if (hasAllFields) {
        // Auto-verify the service
        const { error: updateError } = await supabase
          .from('services')
          .update({ is_verified: true })
          .eq('id', service.id);
          
        if (updateError) {
          console.error('Error updating verification status:', updateError);
          throw updateError;
        }
        
        console.log(`✅ Service ${service.title} verified successfully`);
        updateSectionProgress(service.id, 'verification', 'completed');
        await recordSectionUpdate(service.id, 'verification', 'Service auto-verified - all required fields complete');
        return true;
      } else {
        console.log(`❌ Service ${service.title} missing required fields for verification`);
        updateSectionProgress(service.id, 'verification', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error verifying service:', error);
      updateSectionProgress(service.id, 'verification', 'error');
      return false;
    }
  };

  const storeResearchInKnowledge = async (serviceId: string, researchData: any): Promise<void> => {
    if (!researchData) return;
    
    try {
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
      console.log(`✅ Stored research knowledge for service ${serviceId}`);
    } catch (error) {
      console.error('Error storing research in knowledge:', error);
      throw error;
    }
  };

  const updateServiceInDatabase = async (service: Service, detailsData: any, disclaimerData: any, funnelData: any, faqsData: any): Promise<void> => {
    console.log(`Updating database for ${service.title}...`);
    
    try {
      const updateData: any = {};
      
      if (detailsData) {
        if (detailsData.description) updateData.description = detailsData.description;
        if (detailsData.estimated_roi) updateData.estimated_roi = detailsData.estimated_roi;
        if (detailsData.duration) updateData.duration = detailsData.duration;
        if (detailsData.tags) updateData.tags = detailsData.tags;
        if (detailsData.retail_price) updateData.retail_price = detailsData.retail_price;
        if (detailsData.price_duration) updateData.price_duration = detailsData.price_duration;
        
        // Handle RESPA assessment data
        if (detailsData.respaAssessment) {
          const respa = detailsData.respaAssessment;
          if (respa.copay_allowed !== undefined) updateData.copay_allowed = respa.copay_allowed;
          if (respa.respa_split_limit !== undefined) updateData.respa_split_limit = respa.respa_split_limit;
          if (respa.allowed_split_percentage !== undefined) updateData.allowed_split_percentage = respa.allowed_split_percentage;
        }
      }
      
      if (disclaimerData?.disclaimer_content) {
        updateData.disclaimer_content = disclaimerData.disclaimer_content;
      }
      
      if (funnelData?.funnel_content) {
        updateData.funnel_content = funnelData.funnel_content;
      }
      
      if (funnelData?.pricing_tiers) {
        updateData.pricing_tiers = funnelData.pricing_tiers;
      }

      // Store FAQs in service_faqs table
      if (faqsData?.faqs) {
        // First, delete existing FAQs for this service
        await supabase
          .from('service_faqs')
          .delete()
          .eq('service_id', service.id);

        // Insert new FAQs
        const faqInserts = faqsData.faqs.map((faq: any) => ({
          service_id: service.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category || 'general',
          display_order: faq.order || 1
        }));

        const { error: faqError } = await supabase
          .from('service_faqs')
          .insert(faqInserts);

        if (faqError) {
          console.error('Error inserting FAQs:', faqError);
        } else {
          console.log(`✅ Inserted ${faqInserts.length} FAQs for ${service.title}`);
        }
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('services')
          .update(updateData)
          .eq('id', service.id);

        if (error) throw error;
        console.log(`✅ Updated database for ${service.title}`);
      }
    } catch (error) {
      console.error('Error updating service in database:', error);
      throw error;
    }
  };

  const processService = async (service: Service): Promise<void> => {
    console.log(`🔄 Processing service: ${service.title}`);
    
    let detailsData = null;
    let disclaimerData = null;
    let funnelData = null;
    let faqsData = null;
    let progress = serviceProgress[service.id];

    try {
      // Generate research first
      const researchData = await generateResearch(service);
      progress = { ...progress, research_data: researchData };
      updateProgress(service.id, progress);

      // Generate details (includes pricing extraction and RESPA assessment)
      detailsData = await generateServiceDetails(service, progress);
      
      // Generate disclaimer  
      disclaimerData = await generateDisclaimer(service, progress);
      
      // Generate funnel
      funnelData = await generateFunnel(service, progress);
      
      // Generate FAQs
      faqsData = await generateServiceFAQs(service, progress);
      
      // Update database with all generated content
      await updateServiceInDatabase(service, detailsData, disclaimerData, funnelData, faqsData);
      
      // Store research data
      if (researchData) {
        await storeResearchInKnowledge(service.id, researchData);
      }
      
      // Log AI update note for every successful update
      await logAIUpdateNote(service.id, service.title);
      
      // Verify completion and auto-verify if all fields are present
      await verifyServiceCompletion(service);
      
      console.log(`✅ Completed processing: ${service.title}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${service.title}:`, error);
      throw error;
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
    
    let servicesToUpdate = services.filter(s => selectedServices.includes(s.id));
    
    // Filter out already AI-updated services if overwrite is disabled
    if (!overwriteAIUpdated) {
      const filteredServices = [];
      for (const service of servicesToUpdate) {
        const isAIUpdated = await checkIfAIUpdated(service.id);
        if (!isAIUpdated) {
          filteredServices.push(service);
        } else {
          console.log(`⏭️ Skipping ${service.title} - already AI updated`);
        }
      }
      servicesToUpdate = filteredServices;
      
      if (filteredServices.length !== servicesToUpdate.length) {
        const skippedCount = servicesToUpdate.length - filteredServices.length;
        toast({
          title: `Skipping ${skippedCount} services`,
          description: `${skippedCount} services already AI-updated. Enable "Overwrite AI-updated services" to update them again.`,
          duration: 5000,
        });
      }
    }
    
    if (servicesToUpdate.length === 0) {
      toast({
        title: 'No services to update',
        description: 'All selected services have already been AI-updated. Enable overwrite mode to update them again.',
        variant: 'default'
      });
      setIsRunning(false);
      return;
    }
    
    setServiceProgress(initializeProgress(servicesToUpdate.map(s => s.id)));

    if (runInBackground) {
      toast({
        title: "Running in background",
        description: "AI updater is processing services in the background. You can navigate away and check back later.",
        duration: 5000,
      });
    }

    const processInBackground = async () => {
      let completedCount = 0;
      let errorCount = 0;

      try {
        // Process services sequentially to avoid rate limits
        for (const service of servicesToUpdate) {
          console.log(`🔄 Starting service ${service.title} (${completedCount + 1}/${servicesToUpdate.length})`);
          updateProgress(service.id, { status: 'updating' });
          
          try {
            await processService(service);
            updateProgress(service.id, { status: 'completed' });
            completedCount++;
            onServiceUpdate(service.id);
            
            console.log(`✅ Completed service ${service.title} (${completedCount}/${servicesToUpdate.length})`);
            
            if (!runInBackground) {
              toast({
                title: "Service updated",
                description: `Successfully updated ${service.title} (${completedCount}/${servicesToUpdate.length})`,
              });
            }
          } catch (error) {
            console.error(`❌ Error processing service ${service.title}:`, error);
            updateProgress(service.id, { 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            errorCount++;
            setErrorCount(prev => prev + 1);
            
            // Continue to next service even on error
            console.log(`⏭️ Continuing to next service despite error in ${service.title}`);
          }
          
          // Small delay between services - but check if still running
          if (isRunning) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.log('🛑 Processing stopped by user');
            break;
          }
        }

        if (runInBackground) {
          toast({
            title: 'Background processing complete',
            description: `Processed ${servicesToUpdate.length} services. ${completedCount} completed, ${errorCount} errors.`,
            duration: 7000,
          });
        } else {
          toast({
            title: 'AI Update Complete',
            description: `Processed ${servicesToUpdate.length} services. ${completedCount} completed, ${errorCount} errors.`,
          });
        }
      } catch (error) {
        console.error('AI updater failed:', error);
        setErrorCount(prev => prev + 1);
      } finally {
        setIsRunning(false);
      }
    };

    if (runInBackground) {
      // Start processing without awaiting it
      processInBackground();
    } else {
      await processInBackground();
    }
  };

  const handleRecoveryComplete = () => {
    setErrorCount(0);
    setHasStuckState(false);
    setIsRunning(false);
    setServiceProgress({});
    
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

  const getSectionIcon = (status: 'pending' | 'generating' | 'completed' | 'error') => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'generating': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getSectionName = (section: string) => {
    switch (section) {
      case 'details': return 'Service Details';
      case 'disclaimer': return 'Disclaimer';
      case 'funnel': return 'Sales Funnel';
      case 'research': return 'Research';
      case 'faqs': return 'FAQs';
      case 'verification': return 'Verification';
      default: return section;
    }
  };

  const getSectionDescription = (section: string) => {
    switch (section) {
      case 'details': return 'Pricing, ROI, duration, tags, RESPA assessment';
      case 'disclaimer': return 'Legal disclaimers and compliance';
      case 'funnel': return 'Sales content and pricing tiers';
      case 'research': return 'Market research and competitive analysis';
      case 'faqs': return '7 baseline frequently asked questions';
      case 'verification': return 'Auto-verify if all fields complete';
      default: return 'Processing...';
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
          Comprehensive AI service enhancement: pricing extraction, RESPA assessment, FAQ generation, and auto-verification.
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
                        <div className="flex items-center justify-between mt-2 mb-2">
                          <div className="flex flex-wrap gap-1">
                            {!service.is_verified && (
                              <Badge variant="outline" className="text-xs">Unverified</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const summary = getCompletionSummary(service);
                              return `${summary.completed}/${summary.total} sections complete (${summary.percentage}%)`;
                            })()}
                          </div>
                        </div>
                        <TooltipProvider>
                          <div className="flex flex-wrap gap-1">
                            {['details', 'disclaimer', 'funnel', 'research', 'faqs'].map(sectionName => {
                              const badgeInfo = getSectionBadgeInfo(service, sectionName);
                              return (
                                <Tooltip key={sectionName}>
                                  <TooltipTrigger asChild>
                                    <Badge variant={badgeInfo.variant} className="text-xs cursor-help">
                                      {badgeInfo.status === 'ai_updated' && '🤖 '}
                                      {badgeInfo.status === 'has_content' && '✓ '}
                                      {badgeInfo.status === 'missing' && '⚠️ '}
                                      {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{badgeInfo.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </TooltipProvider>
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
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Details Prompt:</label>
                <Textarea
                  placeholder="Customize service details generation prompt..."
                  value={customPrompts.details}
                  onChange={(e) => setCustomPrompts(prev => ({ ...prev, details: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Disclaimer Prompt:</label>
                <Textarea
                  placeholder="Customize disclaimer generation prompt..."
                  value={customPrompts.disclaimer}
                  onChange={(e) => setCustomPrompts(prev => ({ ...prev, disclaimer: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Funnel Prompt:</label>
                <Textarea
                  placeholder="Customize funnel generation prompt..."
                  value={customPrompts.funnel}
                  onChange={(e) => setCustomPrompts(prev => ({ ...prev, funnel: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">FAQs Prompt:</label>
                <Textarea
                  placeholder="Customize FAQ generation prompt..."
                  value={customPrompts.faqs || ''}
                  onChange={(e) => setCustomPrompts(prev => ({ ...prev, faqs: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {Object.values(serviceProgress).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No services being processed. Select services and start the AI updater.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.values(serviceProgress).map((progress) => (
                  <Card key={progress.serviceId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{progress.serviceName}</h4>
                        <Badge variant={
                          progress.status === 'completed' ? 'default' :
                          progress.status === 'error' ? 'destructive' :
                          progress.status === 'updating' ? 'secondary' : 'outline'
                        }>
                          {progress.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                         {['details', 'disclaimer', 'funnel', 'research', 'faqs', 'verification'].map((section) => {
                           const updateInfo = getSectionUpdateInfo(progress.serviceId, section);
                           return (
                             <div key={section} className="space-y-1">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   {getSectionIcon(progress.sections[section as keyof SectionStatus])}
                                   <span className="text-sm font-medium">{getSectionName(section)}</span>
                                 </div>
                                 {updateInfo && (
                                   <div className="flex items-center gap-1 text-xs text-green-600">
                                     <Check className="h-3 w-3" />
                                     <span>{formatUpdateDate(updateInfo.updated_at)}</span>
                                   </div>
                                 )}
                               </div>
                               <p className="text-xs text-muted-foreground ml-6">
                                 {getSectionDescription(section)}
                               </p>
                             </div>
                           );
                         })}
                      </div>
                      
                      {progress.error && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {progress.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-6">
          <div className="flex flex-col gap-3 items-center">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="background-mode"
                checked={runInBackground}
                onChange={(e) => setRunInBackground(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="background-mode" className="text-sm font-medium">
                Run in background (allows navigation)
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="overwrite-ai-updated"
                checked={overwriteAIUpdated}
                onChange={(e) => setOverwriteAIUpdated(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="overwrite-ai-updated" className="text-sm font-medium">
                Overwrite AI-updated services
              </label>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={runAIUpdater}
              disabled={isRunning || selectedServices.length === 0 || isRecovering}
              size="lg"
              className="min-w-48"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {runInBackground ? 'Running in background...' : 'Processing Services...'}
                </>
              ) : isRecovering ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Recovering System...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Generate All Sections ({selectedServices.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIServiceUpdater;