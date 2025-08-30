import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  DollarSign, 
  Users, 
  Trophy,
  CheckCircle,
  ArrowRight,
  FileText,
  Video,
  Star,
  Target
} from 'lucide-react';

interface PlaybookTemplate {
  id: string;
  template_name: string;
  template_description: string;
  sections: any; // JSON array from database
  estimated_completion_time: string;
  difficulty_level: string;
}

interface PlaybookProgress {
  id: string;
  template_id: string;
  content_id: string;
  current_section: number;
  completed_sections: any; // JSON array from database
  draft_data: any;
  status: string;
}

export const PlaybookCreator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PlaybookTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PlaybookTemplate | null>(null);
  const [progress, setProgress] = useState<PlaybookProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbookData, setPlaybookData] = useState<any>({});

  useEffect(() => {
    fetchTemplates();
    if (user) {
      checkExistingProgress();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_playbook_templates')
        .select('*')
        .order('template_name');

      if (error) throw error;
      
      setTemplates((data || []).map(template => {
        // Handle the case where template might be an error object or null
        if (!template || typeof template !== 'object' || 'message' in template) {
          return null;
        }
        
        const templateAny = template as any;
        if (!templateAny) return null; // Additional null check
        
        return {
          ...templateAny,
          sections: Array.isArray(templateAny.sections) ? templateAny.sections : []
        } as PlaybookTemplate;
      }).filter((template): template is PlaybookTemplate => template !== null));
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('playbook_creation_progress')
        .select('*, agent_playbook_templates(*)')
        .eq('creator_id', user?.id as any)
        .eq('status', 'draft' as any)
        .maybeSingle();

      if (!error && data && typeof data === 'object' && !('message' in data)) {
        const dataAny = data as any;
        const mappedProgress = {
          ...(dataAny),
          completed_sections: Array.isArray(dataAny.completed_sections) ? dataAny.completed_sections : []
        };
        const mappedTemplate = {
          ...(dataAny.agent_playbook_templates),
          sections: Array.isArray(dataAny.agent_playbook_templates?.sections) ? dataAny.agent_playbook_templates.sections : []
        };
        setProgress(mappedProgress as any);
        setSelectedTemplate(mappedTemplate as any);
        setCurrentStep(dataAny.current_section || 0);
        setPlaybookData(dataAny.draft_data || {});
      }
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  };

  const startPlaybook = async (template: PlaybookTemplate) => {
    try {
      // Create content record first
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          title: `${template.template_name} Playbook - ${user?.email}`,
          description: template.template_description,
          content_type: 'playbook',
          creator_id: user?.id,
          category: 'agent_playbooks',
          is_agent_playbook: true,
          playbook_price: 99.00,
          revenue_share_percentage: 70.00,
          is_published: false
        } as any)
        .select()
        .single();

      if (contentError) throw contentError;

      // Create progress record
      const { data: progressData, error: progressError } = await supabase
        .from('playbook_creation_progress')
        .insert({
          creator_id: user?.id,
          template_id: template.id,
          content_id: (contentData as any)?.id,
          current_section: 0,
          status: 'draft'
        } as any)
        .select()
        .single();

      if (progressError) throw progressError;

      const mappedProgress = {
        ...(progressData as any),
        completed_sections: Array.isArray((progressData as any).completed_sections) ? (progressData as any).completed_sections : []
      };

      setSelectedTemplate(template);
      setProgress(mappedProgress);
      setCurrentStep(0);
      
      toast({
        title: 'Playbook Started!',
        description: `Started creating your ${template.template_name} playbook.`
      });
    } catch (error) {
      console.error('Error starting playbook:', error);
      toast({
        title: 'Error',
        description: 'Failed to start playbook creation',
        variant: 'destructive'
      });
    }
  };

  const saveSection = async (sectionIndex: number, sectionData: any) => {
    if (!progress) return;

    try {
      const updatedDraftData = {
        ...playbookData,
        [`section_${sectionIndex}`]: sectionData
      };

      const completedSections = progress.completed_sections || [];
      if (!completedSections.includes(sectionIndex)) {
        completedSections.push(sectionIndex);
      }

      const { error } = await supabase
        .from('playbook_creation_progress')
        .update({
          current_section: sectionIndex,
          completed_sections: completedSections,
          draft_data: updatedDraftData,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', progress.id as any);

      if (error) throw error;

      setPlaybookData(updatedDraftData);
      setProgress(prev => prev ? {
        ...prev,
        completed_sections: completedSections,
        draft_data: updatedDraftData
      } : null);

      toast({
        title: 'Section Saved',
        description: 'Your progress has been saved.'
      });
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'Error',
        description: 'Failed to save section',
        variant: 'destructive'
      });
    }
  };

  const completePlaybook = async () => {
    if (!progress || !selectedTemplate) return;

    try {
      // Update content record with final data
      const { error: contentError } = await supabase
        .from('content')
        .update({
          description: playbookData.summary || selectedTemplate.template_description,
          metadata: {
            playbook_data: playbookData,
            template_used: selectedTemplate.template_name,
            sections_completed: progress.completed_sections?.length || 0
          },
          is_published: true,
          published_at: new Date().toISOString()
        } as any)
        .eq('id', progress.content_id as any);

      if (contentError) throw contentError;

      // Update progress status
      const { error: progressError } = await supabase
        .from('playbook_creation_progress')
        .update({
          status: 'published',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', progress.id as any);

      if (progressError) throw progressError;

      toast({
        title: 'Playbook Published!',
        description: 'Your playbook is now live in the Academy. You\'ll earn 70% on each $99 sale!',
      });

      // Reset state
      setProgress(null);
      setSelectedTemplate(null);
      setCurrentStep(0);
      setPlaybookData({});
    } catch (error) {
      console.error('Error completing playbook:', error);
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
        <div className="text-muted-foreground">Loading playbook templates...</div>
      </div>
    );
  }

  // Show template selection if no playbook in progress
  if (!selectedTemplate || !progress) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create Your Agent Playbook</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Share your success strategies and earn 70% on each $99 sale
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">$69.30 per sale</div>
              <div className="text-sm text-muted-foreground">You keep 70%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold">Help Other Agents</div>
              <div className="text-sm text-muted-foreground">Share your knowledge</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="font-semibold">Build Authority</div>
              <div className="text-sm text-muted-foreground">Establish expertise</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Choose Your Playbook Template</h2>
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{template.template_name}</CardTitle>
                      <p className="text-muted-foreground">{template.template_description}</p>
                    </div>
                    <Badge variant="secondary">{template.difficulty_level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <span>{template.sections.length} sections</span>
                      <span className="mx-2">•</span>
                      <span>{template.estimated_completion_time}</span>
                    </div>
                    <Button onClick={() => startPlaybook(template)}>
                      Start Creating <ArrowRight className="w-4 h-4 ml-2" />
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

  // Show playbook creation interface
  const currentSection = selectedTemplate.sections[currentStep];
  const totalSections = selectedTemplate.sections.length;
  const progressPercentage = ((progress.completed_sections?.length || 0) / totalSections) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{selectedTemplate.template_name}</h1>
          <p className="text-muted-foreground">Section {currentStep + 1} of {totalSections}</p>
        </div>
        <Badge variant="outline">
          {Math.round(progressPercentage)}% Complete
        </Badge>
      </div>

      <Progress value={progressPercentage} className="w-full" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentSection?.type === 'story' && <FileText className="w-5 h-5" />}
            {currentSection?.type === 'video' && <Video className="w-5 h-5" />}
            {currentSection?.type === 'data' && <Target className="w-5 h-5" />}
            {currentSection?.type === 'tools' && <Star className="w-5 h-5" />}
            {currentSection?.title}
          </CardTitle>
          <p className="text-muted-foreground">{currentSection?.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionForm
            section={currentSection}
            sectionIndex={currentStep}
            existingData={playbookData[`section_${currentStep}`] || {}}
            onSave={(data) => saveSection(currentStep, data)}
          />
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            {currentStep < totalSections - 1 ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next Section
              </Button>
            ) : (
              <Button 
                onClick={completePlaybook}
                disabled={progressPercentage < 100}
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
  );
};

// Section form component for different section types
const SectionForm = ({ section, sectionIndex, existingData, onSave }: {
  section: any;
  sectionIndex: number;
  existingData: any;
  onSave: (data: any) => void;
}) => {
  const [formData, setFormData] = useState(existingData);

  const handleSave = () => {
    onSave(formData);
  };

  const renderFields = () => {
    switch (section.type) {
      case 'story':
        return (
          <div className="space-y-4">
            <div>
              <Label>Your Background & Credentials</Label>
              <Textarea
                placeholder="Share your experience, years in business, certifications..."
                value={formData.background || ''}
                onChange={(e) => setFormData({...formData, background: e.target.value})}
              />
            </div>
            <div>
              <Label>Your Market & Location</Label>
              <Input
                placeholder="What market do you serve?"
                value={formData.market || ''}
                onChange={(e) => setFormData({...formData, market: e.target.value})}
              />
            </div>
            <div>
              <Label>Annual Transaction Volume</Label>
              <Input
                type="number"
                placeholder="How many transactions per year?"
                value={formData.volume || ''}
                onChange={(e) => setFormData({...formData, volume: e.target.value})}
              />
            </div>
          </div>
        );
      
      case 'tools':
        return (
          <div className="space-y-4">
            <div>
              <Label>Primary CRM System</Label>
              <Input
                placeholder="What CRM do you use and why?"
                value={formData.crm || ''}
                onChange={(e) => setFormData({...formData, crm: e.target.value})}
              />
            </div>
            <div>
              <Label>Essential Tools & Apps</Label>
              <Textarea
                placeholder="List your must-have tools, apps, and services..."
                value={formData.tools || ''}
                onChange={(e) => setFormData({...formData, tools: e.target.value})}
              />
            </div>
            <div>
              <Label>Tool Investment (Monthly)</Label>
              <Input
                type="number"
                placeholder="How much do you invest in tools per month?"
                value={formData.investment || ''}
                onChange={(e) => setFormData({...formData, investment: e.target.value})}
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                placeholder={`Share your insights for: ${section.title}`}
                value={formData.content || ''}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={6}
              />
            </div>
            <div>
              <Label>Key Takeaways</Label>
              <Textarea
                placeholder="What are the 3-5 most important points?"
                value={formData.takeaways || ''}
                onChange={(e) => setFormData({...formData, takeaways: e.target.value})}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderFields()}
      <Button onClick={handleSave} className="w-full">
        Save Section
      </Button>
    </div>
  );
};