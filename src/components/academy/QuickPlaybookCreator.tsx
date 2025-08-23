import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePlaybookAI } from '@/hooks/usePlaybookAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle,
  Play,
  Wand2,
  Save,
  Clock
} from 'lucide-react';

interface QuickTemplate {
  id: string;
  template_name: string;
  template_description: string;
  sections: any[];
  estimated_completion_time: string;
  is_quick_template: boolean;
  ai_draft_prompt: string;
  auto_prefill_fields: string[];
}

interface AutoSaveData {
  [key: string]: any;
}

export const QuickPlaybookCreator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbookData, setPlaybookData] = useState<AutoSaveData>({});
  const [contentId, setContentId] = useState<string>('');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const { isGenerating, draftSection, improveContent, generateCompletePlaybook } = usePlaybookAI({
    contentId,
    templateId: selectedTemplate?.id
  });

  useEffect(() => {
    fetchQuickTemplates();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (contentId && Object.keys(playbookData).length > 0) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        autoSave();
      }, 2000); // Auto-save 2 seconds after last change
      
      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [playbookData, contentId]);

  const fetchQuickTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_playbook_templates')
        .select('*')
        .eq('is_quick_template', true)
        .order('estimated_completion_time');

      if (error) throw error;
      setQuickTemplates(data || []);
    } catch (error) {
      console.error('Error fetching quick templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async () => {
    if (!contentId) return;
    
    try {
      const { error } = await supabase
        .from('playbook_creation_progress')
        .update({
          draft_data: playbookData,
          last_auto_save: new Date().toISOString()
        })
        .eq('content_id', contentId);

      if (!error) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const startQuickPlaybook = async (template: QuickTemplate) => {
    try {
      // Create content record
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          title: `${template.template_name} - ${user?.email}`,
          description: template.template_description,
          content_type: 'playbook',
          creator_id: user?.id,
          category: 'agent_playbooks',
          is_agent_playbook: true,
          playbook_price: 99.00,
          revenue_share_percentage: 70.00,
          is_published: false
        })
        .select()
        .single();

      if (contentError) throw contentError;

      // Create progress record
      const { error: progressError } = await supabase
        .from('playbook_creation_progress')
        .insert({
          creator_id: user?.id,
          template_id: template.id,
          content_id: contentData.id,
          current_section: 0,
          status: 'draft',
          auto_save_enabled: true
        });

      if (progressError) throw progressError;

      setSelectedTemplate(template);
      setContentId(contentData.id);
      setCurrentStep(0);
      
      toast({
        title: 'Quick Playbook Started!',
        description: `Ready to create your ${template.template_name} in ${template.estimated_completion_time}.`,
        duration: 3000
      });

      // Auto-prefill with user data if available
      await prefillUserData(template);
    } catch (error) {
      console.error('Error starting quick playbook:', error);
      toast({
        title: 'Error',
        description: 'Failed to start playbook creation',
        variant: 'destructive'
      });
    }
  };

  const prefillUserData = async (template: QuickTemplate) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profile && template.auto_prefill_fields.length > 0) {
        const prefillData: AutoSaveData = {};
        
        // Map common fields
        if (template.auto_prefill_fields.includes('market')) {
          prefillData.market = profile.city || profile.state || '';
        }
        if (template.auto_prefill_fields.includes('years_experience')) {
          prefillData.years_experience = profile.years_experience || '';
        }
        
        setPlaybookData(prefillData);
      }
    } catch (error) {
      console.error('Error prefilling data:', error);
    }
  };

  const handleAIDraft = async () => {
    if (!selectedTemplate) return;
    
    const currentSection = selectedTemplate.sections[currentStep];
    const aiContent = await draftSection(
      { ...currentSection, index: currentStep },
      selectedTemplate.ai_draft_prompt
    );
    
    if (aiContent) {
      const updatedData = {
        ...playbookData,
        [`section_${currentStep}_content`]: aiContent
      };
      setPlaybookData(updatedData);
      
      toast({
        title: 'AI Draft Ready!',
        description: 'Review and edit the generated content.',
        duration: 2000
      });
    }
  };

  const handleCompletePlaybook = async () => {
    if (!selectedTemplate) return;

    const aiContent = await generateCompletePlaybook(selectedTemplate, playbookData);
    
    if (aiContent) {
      // Parse AI content and populate all sections
      try {
        const sections = aiContent.split(/section \d+:/i);
        const updatedData = { ...playbookData };
        
        sections.forEach((content, index) => {
          if (index > 0 && content.trim()) { // Skip first empty element
            updatedData[`section_${index - 1}_content`] = content.trim();
          }
        });
        
        setPlaybookData(updatedData);
        
        toast({
          title: 'Complete Playbook Generated!',
          description: 'AI has generated content for all sections. Review and refine as needed.',
          duration: 3000
        });
      } catch (error) {
        console.error('Error parsing AI content:', error);
      }
    }
  };

  const publishPlaybook = async () => {
    if (!contentId || !selectedTemplate) return;

    try {
      // Update content record
      const { error: contentError } = await supabase
        .from('content')
        .update({
          description: playbookData.summary || selectedTemplate.template_description,
          metadata: {
            playbook_data: playbookData,
            template_used: selectedTemplate.template_name,
            creation_method: 'quick_creator',
            time_to_complete: new Date().toISOString()
          },
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (contentError) throw contentError;

      // Update progress
      const { error: progressError } = await supabase
        .from('playbook_creation_progress')
        .update({ status: 'published' })
        .eq('content_id', contentId);

      if (progressError) throw progressError;

      toast({
        title: 'Playbook Published! 🎉',
        description: 'Your quick playbook is now live. You\'ll earn 70% on each $99 sale!',
        duration: 5000
      });

      // Reset state
      setSelectedTemplate(null);
      setContentId('');
      setCurrentStep(0);
      setPlaybookData({});
    } catch (error) {
      console.error('Error publishing playbook:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish playbook',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Loading quick templates...</div>
      </div>
    );
  }

  // Template selection view
  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Quick Playbook Creator</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Create and publish playbooks in 30-90 minutes with AI assistance
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold">30-90 Minutes</div>
              <div className="text-sm text-muted-foreground">From start to published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold">AI Assistance</div>
              <div className="text-sm text-muted-foreground">Smart drafting & suggestions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Save className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">Auto-Save</div>
              <div className="text-sm text-muted-foreground">Never lose your progress</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Choose Your Quick Template</h2>
          <div className="grid gap-4">
            {quickTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/30">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <Zap className="w-3 h-3 mr-1" />
                          Quick
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{template.template_description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <span>{template.sections.length} sections</span>
                      <span className="mx-2">•</span>
                      <span>{template.estimated_completion_time}</span>
                    </div>
                    <Button onClick={() => startQuickPlaybook(template)} size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Start Creating
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Quick creation interface
  const currentSection = selectedTemplate.sections[currentStep];
  const totalSections = selectedTemplate.sections.length;
  const progressPercentage = ((currentStep + 1) / totalSections) * 100;
  const sectionContent = playbookData[`section_${currentStep}_content`] || '';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            {selectedTemplate.template_name}
          </h1>
          <p className="text-muted-foreground">
            Section {currentStep + 1} of {totalSections} • {selectedTemplate.estimated_completion_time}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Save className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <Badge variant="outline" className="bg-primary/5">
            {Math.round(progressPercentage)}% Complete
          </Badge>
        </div>
      </div>

      <Progress value={progressPercentage} className="w-full" />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {currentSection?.title}
                  </CardTitle>
                  <p className="text-muted-foreground">{currentSection?.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAIDraft}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    AI Draft
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="section-content">Content</Label>
                <Textarea
                  id="section-content"
                  placeholder={`Write your ${currentSection?.title.toLowerCase()} here, or use AI Draft to get started...`}
                  value={sectionContent}
                  onChange={(e) => setPlaybookData({
                    ...playbookData,
                    [`section_${currentStep}_content`]: e.target.value
                  })}
                  rows={12}
                  className="min-h-[300px]"
                />
              </div>

              {sectionContent && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => improveContent(sectionContent, currentStep, 'improve')}
                    disabled={isGenerating}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Improve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => improveContent(sectionContent, currentStep, 'expand')}
                    disabled={isGenerating}
                  >
                    Expand
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => improveContent(sectionContent, currentStep, 'shorten')}
                    disabled={isGenerating}
                  >
                    Shorten
                  </Button>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                
                {currentStep < totalSections - 1 ? (
                  <Button onClick={() => setCurrentStep(currentStep + 1)}>
                    Next Section
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={publishPlaybook}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publish Playbook
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCompletePlaybook}
                disabled={isGenerating}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Complete All Sections
              </Button>
              <p className="text-xs text-muted-foreground">
                Generate AI content for all remaining sections at once
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Section Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedTemplate.sections.map((section, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-sm p-2 rounded cursor-pointer transition-colors ${
                    index === currentStep 
                      ? 'bg-primary/10 text-primary' 
                      : playbookData[`section_${index}_content`] 
                        ? 'bg-green-50 text-green-700' 
                        : 'text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    playbookData[`section_${index}_content`] 
                      ? 'bg-green-500' 
                      : index === currentStep 
                        ? 'bg-primary' 
                        : 'bg-muted-foreground/30'
                  }`} />
                  {section.title}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};