import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Sparkles, CheckCircle, AlertCircle, Loader2, FileText, Zap, Share, Lightbulb, HelpCircle, Shield, Clock, Check, Activity } from 'lucide-react';
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
  pricing_mode?: string;
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
  sectionTimestamps?: { [key: string]: number };
  currentSection?: string;
  lastActivity?: number;
}

interface ServiceUpdateTracking {
  service_id: string;
  section_name: string;
  updated_at: string;
  notes?: string;
}

export const AIServiceUpdater = ({ services, onServiceUpdate }: AIServiceUpdaterProps) => {
  console.log('🏗️ AIServiceUpdater rendering with', services.length, 'services');
  
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
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
  const [stuckCheckCount, setStuckCheckCount] = useState(0);

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

  // Enhanced stuck state monitoring with time-based detection
  const monitorStuckState = () => {
    console.log('🔍 Monitoring stuck state - isRunning:', isRunningRef.current);
    
    if (!isRunningRef.current) return;

    const now = Date.now();
    const stuckServices = Object.values(serviceProgress).filter(p => {
      if (p.status !== 'updating') return false;
      
      // Check each section for stuck state
      const stuckSections = Object.entries(p.sections).filter(([section, status]) => {
        if (status !== 'generating') return false;
        
        const sectionStartTime = p.sectionTimestamps?.[section] || now;
        const timeElapsed = now - sectionStartTime;
        
        // Different timeouts for different sections
        const timeoutLimits = {
          research: 8 * 60 * 1000, // 8 minutes for research
          details: 5 * 60 * 1000,  // 5 minutes for details
          disclaimer: 5 * 60 * 1000, // 5 minutes for disclaimer
          funnel: 3 * 60 * 1000,    // 3 minutes for funnel (reduced - often gets stuck)
          faqs: 5 * 60 * 1000,      // 5 minutes for FAQs
          verification: 2 * 60 * 1000 // 2 minutes for verification
        };
        
        const limit = timeoutLimits[section as keyof typeof timeoutLimits] || 5 * 60 * 1000;
        return timeElapsed > limit;
      });
      
      return stuckSections.length > 0;
    });

    console.log('🔍 Found stuck services:', stuckServices.length);

    if (stuckServices.length > 0) {
      setStuckCheckCount(prev => prev + 1);
      
      // Only trigger recovery after 2 consecutive stuck checks
      if (stuckCheckCount >= 1) {
        console.log('⚠️ Confirmed stuck state - triggering recovery');
        setHasStuckState(true);
        setErrorCount(prev => prev + 1);
        
        toast({
          title: "Services appear stuck",
          description: "Auto-recovery will refresh the system if the issue persists.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        console.log('⏳ First stuck detection - monitoring for next check');
        toast({
          title: "Long-running process detected",
          description: "Monitoring for potential issues. Process will continue...",
          duration: 3000,
        });
      }
    } else {
      setStuckCheckCount(0); // Reset if no stuck services
    }
  };

  // Sync ref with state
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Set up monitoring interval when AI generation starts
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      console.log('⏰ Starting stuck state monitoring every 3 minutes');
      // Check every 3 minutes for stuck states - less aggressive
      interval = setInterval(monitorStuckState, 180000); // 3 minutes
    } else {
      console.log('⏰ Stopped stuck state monitoring');
    }
    
    return () => {
      if (interval) {
        console.log('🧹 Cleaning up stuck state monitoring');
        clearInterval(interval);
      }
    };
  }, [isRunning]); // Removed serviceProgress dependency to prevent infinite loops

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
    setServiceProgress(prev => {
      if (!prev[serviceId]) {
        console.warn(`⚠️ Progress not initialized for service ${serviceId}, initializing...`);
        const service = services.find(s => s.id === serviceId);
        const initialProgress = {
          serviceId,
          serviceName: service?.title || 'Unknown Service',
          status: 'pending' as const,
          sections: {
            details: 'pending' as const,
            disclaimer: 'pending' as const,
            funnel: 'pending' as const,
            research: 'pending' as const,
            faqs: 'pending' as const,
            verification: 'pending' as const
          }
        };
        return {
          ...prev,
          [serviceId]: { 
            ...initialProgress, 
            ...updates,
            lastActivity: Date.now()
          }
        };
      }
      
      return {
        ...prev,
        [serviceId]: { 
          ...prev[serviceId], 
          ...updates,
          lastActivity: Date.now()
        }
      };
    });
  };

  const updateSectionProgress = (serviceId: string, section: keyof SectionStatus, status: SectionStatus[keyof SectionStatus]) => {
    setServiceProgress(prev => {
      if (!prev[serviceId]) {
        console.warn(`⚠️ Progress not initialized for service ${serviceId}, initializing...`);
        const service = services.find(s => s.id === serviceId);
        const initialProgress = {
          serviceId,
          serviceName: service?.title || 'Unknown Service',
          status: 'pending' as const,
          sections: {
            details: 'pending' as const,
            disclaimer: 'pending' as const,
            funnel: 'pending' as const,
            research: 'pending' as const,
            faqs: 'pending' as const,
            verification: 'pending' as const
          }
        };
        prev[serviceId] = initialProgress;
      }
      
      const currentProgress = prev[serviceId];
      const now = Date.now();
      
      return {
        ...prev,
        [serviceId]: {
          ...currentProgress,
          sections: { ...currentProgress.sections, [section]: status },
          currentSection: status === 'generating' ? section : currentProgress.currentSection,
          sectionTimestamps: {
            ...currentProgress.sectionTimestamps,
            [section]: status === 'generating' ? now : currentProgress.sectionTimestamps?.[section]
          },
          lastActivity: now
        }
      };
    });
  };

  const generateServiceDetails = async (service: Service, progress: UpdateProgress): Promise<any> => {
    console.log(`📝 Generating details for ${service.title}...`);
    updateSectionProgress(service.id, 'details', 'generating');
    
    try {
      console.log(`📡 Calling ai-service-generator for details: ${service.title}`);
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

      if (error) {
        console.error(`❌ Details generation failed for ${service.title}:`, error);
        throw error;
      }
      
      console.log(`✅ Details completed for ${service.title}`);
      updateSectionProgress(service.id, 'details', 'completed');
      await recordSectionUpdate(service.id, 'details', 'AI generated service details including pricing and RESPA assessment');
      return data;
    } catch (error) {
      console.error(`❌ Details generation error for ${service.title}:`, error);
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
    console.log(`🎨 Generating funnel for ${service.title}...`);
    updateSectionProgress(service.id, 'funnel', 'generating');
    
    try {
      // Add timeout protection for funnel generation (2 minutes)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Funnel generation timeout after 2 minutes')), 120000)
      );
      
      const funnelPromise = supabase.functions.invoke('ai-service-generator', {
        body: {
          type: 'funnel',
          service: {
            ...service,
            existing_research: progress.research_data
          },
          customPrompt: customPrompts.funnel
        }
      });

      const { data, error } = await Promise.race([funnelPromise, timeoutPromise]) as any;

      if (error) {
        console.error(`❌ Funnel generation API error for ${service.title}:`, error);
        throw error;
      }
      
      // Validate funnel data structure
      if (!data || typeof data !== 'object') {
        console.error(`❌ Invalid funnel data returned for ${service.title}:`, data);
        throw new Error('Invalid funnel data structure returned from AI');
      }
      
      console.log(`✅ Funnel generation completed for ${service.title}`);
      updateSectionProgress(service.id, 'funnel', 'completed');
      await recordSectionUpdate(service.id, 'funnel', 'AI generated sales funnel and pricing tiers');
      return data;
    } catch (error) {
      console.error(`❌ Funnel generation error for ${service.title}:`, error);
      updateSectionProgress(service.id, 'funnel', 'error');
      
      // Don't throw error - let process continue with other sections
      if (error.message?.includes('timeout')) {
        console.log(`⚠️ Funnel generation timed out for ${service.title}, continuing with other sections...`);
        return null;
      }
      
      throw error;
    }
  };

  const generateResearch = async (service: Service): Promise<any> => {
    console.log(`🔬 Generating research for ${service.title}...`);
    updateSectionProgress(service.id, 'research', 'generating');
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.access_token) {
        console.warn('⚠️ No session token available for research generation');
        updateSectionProgress(service.id, 'research', 'error');
        return null;
      }

      console.log(`📡 Calling research function for ${service.title}...`);
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
        console.warn(`⚠️ Research generation failed for ${service.title}:`, error);
        updateSectionProgress(service.id, 'research', 'error');
        return null;
      }
      
      console.log(`✅ Research completed for ${service.title}`);
      updateSectionProgress(service.id, 'research', 'completed');
      await recordSectionUpdate(service.id, 'research', 'AI generated market research and analysis');
      return data;
    } catch (error) {
      console.warn(`⚠️ Research generation exception for ${service.title}:`, error);
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
      console.log(`🔍 Checking AI update status for service: ${serviceId}`);
      
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

      const isUpdated = data.length > 0;
      console.log(`📊 Service ${serviceId} AI update status: ${isUpdated ? 'already updated' : 'needs update'}`);
      return isUpdated;
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
        disclaimer_id: (updatedService.disclaimer_id || updatedService.disclaimer_content) ? 'present' : 'missing',
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
        (updatedService.disclaimer_id || updatedService.disclaimer_content) &&
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
      const { updateService: secureUpdate } = await import('@/lib/secure-service-updates');
      
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
      
      // Handle funnel content and pricing tiers with validation
      if (funnelData?.funnel_content) {
        let funnelContent = { ...funnelData.funnel_content };
        
        // Merge FAQ sections from FAQs if funnel doesn't have them
        if (!funnelContent.faqSections && faqsData?.faqs) {
          console.log('📝 Merging FAQ data into funnel content...');
          const defaultTitles = [
            "Why Should I Care?",
            "What's My ROI Potential?", 
            "How Soon Will I See Results?",
            "What's Included?",
            "Proof It Works"
          ];
          
          funnelContent.faqSections = faqsData.faqs.slice(0, 5).map((faq: any, index: number) => ({
            id: `question-${index + 1}`,
            title: defaultTitles[index] || faq.question,
            content: faq.answer
          }));
        }
        
        updateData.funnel_content = funnelContent;
      }
      
      // Handle pricing tiers with validation
      if (funnelData?.pricing_tiers) {
        let pricingTiers = [...funnelData.pricing_tiers];
        
        // Normalize and validate pricing tiers
        pricingTiers = pricingTiers
          .slice(0, 4) // Cap at 4 tiers
          .map((tier: any, index: number) => ({
            ...tier,
            id: tier.id || `tier-${index}`,
            position: index, // Ensure contiguous positions
            duration: ['mo', 'yr', 'one-time'].includes(tier.duration) ? tier.duration : 'mo',
            features: Array.isArray(tier.features) ? tier.features : []
          }));
        
        console.log(`✅ Normalized ${pricingTiers.length} pricing tiers for ${service.title}`);
        updateData.pricing_tiers = pricingTiers;

        // Auto-detect pricing mode if service is set to 'auto' or doesn't have one
        if (!service.pricing_mode || service.pricing_mode === 'auto') {
          // Simple detection logic inline
          const hasValidPricing = pricingTiers.some((tier: any) => 
            tier.price && parseFloat(tier.price) > 0 && !tier.requestPricing
          );
          const detectedMode = hasValidPricing ? 'fixed' : 'custom_quote';
          updateData.pricing_mode = detectedMode;
          console.log(`🎯 Auto-detected pricing mode for ${service.title}: ${detectedMode}`);
        }
      }

      // Use secure updater for main service data
      const success = await secureUpdate(service.id, updateData, {
        validateAdmin: false, // Already validated in the main process
        showProgress: false,
        retryAttempts: 2 // Reduce retries for AI operations to avoid long delays
      });

      if (!success) {
        throw new Error('Failed to update service in database');
      }

      // Store FAQs in service_faqs table (separate operation)
      if (faqsData?.faqs) {
        try {
          // First, delete existing FAQs for this service
          await supabase
            .from('service_faqs')
            .delete()
            .eq('service_id', service.id);

          // Insert new FAQs
          const faqInserts = faqsData.faqs.slice(0, 10).map((faq: any, index: number) => ({
            service_id: service.id,
            question: faq.question,
            answer: faq.answer,
            sort_order: index
          }));

          const { error: faqError } = await supabase
            .from('service_faqs')
            .insert(faqInserts);

          if (faqError) {
            console.error('⚠️ FAQ insert error (non-critical):', faqError);
            // Don't throw - FAQs are supplementary
          } else {
            console.log(`✅ Inserted ${faqInserts.length} FAQs for ${service.title}`);
          }
        } catch (faqError) {
          console.error('⚠️ FAQ processing error (non-critical):', faqError);
          // Don't throw - FAQs are supplementary
        }
      }

      console.log(`✅ Successfully updated database for ${service.title}`);
    } catch (error) {
      console.error(`❌ Database update failed for ${service.title}:`, error);
      throw error;
    }
  };

  const processService = async (service: Service): Promise<void> => {
    console.log(`🔄 Processing service: ${service.title} (ID: ${service.id})`);
    
    let detailsData = null;
    let disclaimerData = null;
    let funnelData = null;
    let faqsData = null;
    let progress = serviceProgress[service.id];

    if (!progress) {
      console.warn(`⚠️ Progress not found for service ${service.id}, initializing on-the-fly...`);
      const initialProgress = {
        serviceId: service.id,
        serviceName: service.title,
        status: 'updating' as const,
        sections: {
          details: 'pending' as const,
          disclaimer: 'pending' as const,
          funnel: 'pending' as const,
          research: 'pending' as const,
          faqs: 'pending' as const,
          verification: 'pending' as const
        }
      };
      updateProgress(service.id, initialProgress);
      progress = { ...initialProgress };
    }

    try {
      // Generate research first
      const researchData = await generateResearch(service);
      progress = { ...progress, research_data: researchData };
      updateProgress(service.id, progress);

      // Generate details (includes pricing extraction and RESPA assessment)
      detailsData = await generateServiceDetails(service, progress);
      
      // Generate disclaimer  
      disclaimerData = await generateDisclaimer(service, progress);
      
      // Generate funnel (with error tolerance)
      try {
        funnelData = await generateFunnel(service, progress);
      } catch (funnelError) {
        console.warn(`⚠️ Funnel generation failed for ${service.title}, continuing with other sections:`, funnelError);
        updateSectionProgress(service.id, 'funnel', 'error');
      }
      
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
    console.log('🚀 runAIUpdater called with selectedServices:', selectedServices);
    
    if (selectedServices.length === 0) {
      console.log('❌ No services selected');
      toast({
        title: 'No Services Selected',
        description: 'Please select at least one service to update.',
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ Starting AI updater with', selectedServices.length, 'services');
    setIsRunning(true);
    setActiveTab('progress');
    setHasStuckState(false);
    setErrorCount(0);
    
    let servicesToUpdate = services.filter(s => selectedServices.includes(s.id));
    console.log('📋 Services to update:', servicesToUpdate.map(s => s.title));
    
    // Filter out already AI-updated services if overwrite is disabled
    if (!overwriteAIUpdated) {
      const originalCount = servicesToUpdate.length;
      const filteredServices = [];
      
      console.log('🔍 Checking AI update status for', originalCount, 'services...');
      
      for (const service of servicesToUpdate) {
        try {
          const isAIUpdated = await checkIfAIUpdated(service.id);
          if (!isAIUpdated) {
            filteredServices.push(service);
            console.log(`✅ ${service.title} - will be updated`);
          } else {
            console.log(`⏭️ ${service.title} - already AI updated, skipping`);
          }
        } catch (error) {
          console.error(`Error checking AI status for ${service.title}:`, error);
          // Include service in update if check fails
          filteredServices.push(service);
        }
      }
      
      servicesToUpdate = filteredServices;
      const skippedCount = originalCount - filteredServices.length;
      
      if (skippedCount > 0) {
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
    
    console.log('🎯 Setting progress for', servicesToUpdate.length, 'services');
    const initialProgress = initializeProgress(servicesToUpdate.map(s => s.id));
    console.log('📈 Initial progress:', Object.keys(initialProgress));
    setServiceProgress(initialProgress);
    
    // Wait for a microtick to ensure progress state is synchronized
    await new Promise(resolve => setTimeout(resolve, 0));
    console.log('✅ Progress state synchronized');

    // Define processInBackground function first for foreground fallback
    const processInBackground = async () => {
      console.log('🔄 processInBackground started with', servicesToUpdate.length, 'services');
      console.log('📋 Services to process:', servicesToUpdate.map(s => `${s.title} (${s.id})`));
      
      let completedCount = 0;
      let errorCount = 0;

      try {
        // Process services sequentially to avoid rate limits
        for (const service of servicesToUpdate) {
          // Check if still running using ref to avoid stale state
          if (!isRunningRef.current) {
            console.log('🛑 Processing stopped by user before starting', service.title);
            break;
          }

          console.log(`🔄 Starting service ${service.title} (${completedCount + 1}/${servicesToUpdate.length})`);
          updateProgress(service.id, { status: 'updating', currentSection: 'research' });
          
          try {
            await processService(service);
            updateProgress(service.id, { status: 'completed', currentSection: undefined });
            completedCount++;
            onServiceUpdate(service.id);
            
            console.log(`✅ Completed service ${service.title} (${completedCount}/${servicesToUpdate.length})`);
            
            // Refresh tracking data
            await loadUpdateTracking();
            
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
              error: error instanceof Error ? error.message : 'Unknown error',
              currentSection: undefined
            });
            errorCount++;
            setErrorCount(prev => prev + 1);
            
            console.log(`⏭️ Continuing to next service despite error in ${service.title}`);
          }
          
          // Small delay between services
          if (completedCount + errorCount < servicesToUpdate.length) {
            console.log(`⏳ Waiting 2 seconds before next service...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
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
      console.log('⚡ Running in background mode - using bulk processor');
      
      const batchId = `bulk_ai_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      try {
        // Call the bulk background processor
        const { data, error } = await supabase.functions.invoke('bulk-ai-service-updater', {
          body: {
            services: servicesToUpdate,
            customPrompts: customPrompts,
            overwriteAIUpdated: overwriteAIUpdated,
            batchId: batchId
          }
        });

        if (error) {
          throw error;
        }

        console.log(`✅ Background batch started: ${batchId}`);
        
        toast({
          title: "Background processing started",
          description: `Processing ${servicesToUpdate.length} services in background. Batch ID: ${batchId}. You can navigate away and check status later.`,
          duration: 8000,
        });

        // Set up polling for batch status
        const pollBatchStatus = async () => {
          try {
            const { data: statusData, error: statusError } = await supabase.functions.invoke('get-batch-status', {
              body: { batchId }
            });

            if (!statusError && statusData?.batchStatus) {
              const status = statusData.batchStatus;
              
              // Update progress display
              setServiceProgress(prev => {
                const updated = { ...prev };
                servicesToUpdate.forEach(service => {
                  updated[service.id] = {
                    ...updated[service.id],
                    serviceName: service.title,
                    status: status.status === 'completed' || status.status === 'completed_with_errors' ? 'completed' : 'updating',
                    sections: {
                      details: 'completed',
                      disclaimer: 'completed', 
                      funnel: 'completed',
                      research: 'completed',
                      faqs: 'completed',
                      verification: 'completed'
                    }
                  };
                });
                return updated;
              });

              if (status.status === 'completed') {
                toast({
                  title: "Background processing completed",
                  description: `Successfully processed ${status.completed_count} out of ${status.total_count} services.`,
                  duration: 5000,
                });
                setIsRunning(false);
                return; // Stop polling
              } else if (status.status === 'completed_with_errors') {
                toast({
                  title: "Background processing completed with errors",
                  description: `Processed ${status.completed_count} out of ${status.total_count} services. ${status.error_count} errors occurred.`,
                  variant: "destructive",
                  duration: 8000,
                });
                setIsRunning(false);
                return; // Stop polling
              }
              
              // Continue polling if still processing
              setTimeout(pollBatchStatus, 15000); // Check every 15 seconds
            } else {
              console.warn('Failed to get batch status:', statusError);
              setTimeout(pollBatchStatus, 30000); // Retry in 30 seconds on error
            }
          } catch (pollError) {
            console.error('Polling error:', pollError);
            setTimeout(pollBatchStatus, 30000); // Retry in 30 seconds on error
          }
        };

        // Start polling after a delay
        setTimeout(pollBatchStatus, 10000); // Start checking after 10 seconds

      } catch (error) {
        console.error('Background processing failed:', error);
        toast({
          title: "Background processing failed",
          description: `Failed to start background processing: ${error.message}`,
          variant: "destructive",
          duration: 8000,
        });
        setIsRunning(false);
      }
    } else {
      console.log('🎯 Running in foreground mode');
      try {
        await processInBackground();
      } catch (error) {
        console.error('Foreground processing failed:', error);
        setIsRunning(false);
        setErrorCount(prev => prev + 1);
      }
    }
  };

  const handleRecoveryComplete = () => {
    console.log('🎯 Recovery complete - performing soft reset');
    setErrorCount(0);
    setHasStuckState(false);
    setIsRunning(false);
    setStuckCheckCount(0);
    
    // Soft reset - don't clear selected services, just reset progress
    setServiceProgress({});
    
    toast({
      title: "System refreshed",
      description: "AI Service Updater is ready to continue!",
      duration: 2000,
    });
  };

  const toggleServiceSelection = (serviceId: string) => {
    const isCurrentlySelected = selectedServices.includes(serviceId);
    const serviceName = services.find(s => s.id === serviceId)?.title || 'Unknown';
    
    console.log(`🔄 Toggling service ${serviceName} (${serviceId}):`, 
                isCurrentlySelected ? 'deselecting' : 'selecting');
    
    setSelectedServices(prev => {
      const newSelection = prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
      
      console.log(`📋 Updated selection: ${newSelection.length} services selected`);
      return newSelection;
    });
  };

  const selectAllServices = () => {
    console.log('📋 Select All Services clicked - total services:', services.length);
    const allServiceIds = services.map(s => s.id);
    console.log('📋 Setting selected services to:', allServiceIds.length, 'services');
    setSelectedServices(allServiceIds);
    
    toast({
      title: "All services selected",
      description: `Selected ${allServiceIds.length} services for AI processing`,
      duration: 2000,
    });
  };

  const clearSelection = () => {
    console.log('🧹 Clear Selection clicked');
    setSelectedServices([]);
    
    toast({
      title: "Selection cleared",
      description: "No services selected",
      duration: 2000,
    });
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
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm truncate">{service.title}</h4>
                          {(() => {
                            const progress = serviceProgress[service.id];
                            if (progress?.status === 'updating') {
                              return (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Updating...
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {service.category}
                        </p>
                        
                        {/* Show current section being processed */}
                        {(() => {
                          const progress = serviceProgress[service.id];
                          if (progress?.status === 'updating' && progress.currentSection) {
                            return (
                              <div className="mt-2 p-1 bg-blue-50 border border-blue-200 rounded text-xs">
                                <div className="flex items-center gap-1 text-blue-800">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Processing: {getSectionName(progress.currentSection)}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
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
              <div className="space-y-4">
                {/* Overall Progress Summary */}
                {isRunning && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <h4 className="font-medium">AI Processing Active</h4>
                        </div>
                        <Badge variant="secondary">
                          {Object.values(serviceProgress).filter(p => p.status === 'completed').length} / {Object.values(serviceProgress).length} complete
                        </Badge>
                      </div>
                      
                      {/* Currently updating service indicator */}
                      {(() => {
                        const currentlyUpdating = Object.values(serviceProgress).find(p => p.status === 'updating');
                        if (currentlyUpdating) {
                          return (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Currently updating:</span>
                              <span className="font-medium">{currentlyUpdating.serviceName}</span>
                              {currentlyUpdating.currentSection && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getSectionName(currentlyUpdating.currentSection)}
                                  </Badge>
                                </>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Overall progress bar */}
                      <div className="mt-3">
                        <Progress 
                          value={(Object.values(serviceProgress).filter(p => p.status === 'completed').length / Object.values(serviceProgress).length) * 100}
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Service Progress Cards */}
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {Object.values(serviceProgress)
                    .sort((a, b) => {
                      // Sort active services first, then by status
                      if (a.status === 'updating' && b.status !== 'updating') return -1;
                      if (b.status === 'updating' && a.status !== 'updating') return 1;
                      if (a.status === 'completed' && b.status !== 'completed') return 1;
                      if (b.status === 'completed' && a.status !== 'completed') return -1;
                      return a.serviceName.localeCompare(b.serviceName);
                    })
                    .map((progress) => {
                      const completedSections = Object.values(progress.sections).filter(s => s === 'completed').length;
                      const totalSections = Object.keys(progress.sections).length;
                      const progressPercentage = (completedSections / totalSections) * 100;
                      
                      return (
                        <Card key={progress.serviceId} className={
                          progress.status === 'updating' ? 'border-primary/40 bg-primary/5' :
                          progress.status === 'completed' ? 'border-green-200 bg-green-50' :
                          progress.status === 'error' ? 'border-red-200 bg-red-50' : ''
                        }>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{progress.serviceName}</h4>
                                {progress.status === 'updating' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Updating...
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {completedSections}/{totalSections} sections
                                </span>
                                <Badge variant={
                                  progress.status === 'completed' ? 'default' :
                                  progress.status === 'error' ? 'destructive' :
                                  progress.status === 'updating' ? 'secondary' : 'outline'
                                }>
                                  {progress.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Per-service progress bar */}
                            <div className="mb-3">
                              <Progress value={progressPercentage} className="h-1.5" />
                            </div>
                            
                            {/* Current section indicator */}
                            {progress.status === 'updating' && progress.currentSection && (
                              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-center gap-2 text-sm">
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                  <span className="font-medium text-blue-800">
                                    Currently generating: {getSectionName(progress.currentSection)}
                                  </span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1 ml-6">
                                  {getSectionDescription(progress.currentSection)}
                                </p>
                              </div>
                            )}
                            
                            {/* Activity indicator */}
                            {progress.lastActivity && (
                              <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                                <Activity className="h-3 w-3" />
                                <span>Last activity: {new Date(progress.lastActivity).toLocaleTimeString()}</span>
                              </div>
                            )}
                            
                            {/* Section details */}
                            <div className="space-y-2">
                               {['research', 'details', 'disclaimer', 'funnel', 'faqs', 'verification'].map((section) => {
                                 const sectionStatus = progress.sections[section as keyof SectionStatus];
                                 const updateInfo = getSectionUpdateInfo(progress.serviceId, section);
                                 const isCurrentSection = progress.currentSection === section;
                                 
                                 return (
                                   <div key={section} className={`space-y-1 ${isCurrentSection ? 'bg-blue-50 p-2 rounded border border-blue-200' : ''}`}>
                                     <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-2">
                                         {getSectionIcon(sectionStatus)}
                                         <span className={`text-sm ${isCurrentSection ? 'font-medium text-blue-800' : 'font-medium'}`}>
                                           {getSectionName(section)}
                                         </span>
                                         {isCurrentSection && (
                                           <Badge variant="secondary" className="text-xs">
                                             Active
                                           </Badge>
                                         )}
                                       </div>
                                       {updateInfo && (
                                         <div className="flex items-center gap-1 text-xs text-green-600">
                                           <Check className="h-3 w-3" />
                                           <span>{formatUpdateDate(updateInfo.updated_at)}</span>
                                         </div>
                                       )}
                                     </div>
                                     <p className={`text-xs ml-6 ${isCurrentSection ? 'text-blue-600' : 'text-muted-foreground'}`}>
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
                      );
                    })}
                </div>
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