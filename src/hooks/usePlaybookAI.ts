import { useState } from 'react';
import { useEnhancedAI } from '@/hooks/useEnhancedAI';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UsePlaybookAIProps {
  contentId?: string;
  templateId?: string;
}

export function usePlaybookAI({ contentId, templateId }: UsePlaybookAIProps = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { getRecommendation } = useEnhancedAI();
  const { toast } = useToast();
  const { user } = useAuth();

  const draftSection = async (sectionData: any, templatePrompt?: string) => {
    if (!user?.id) return null;
    
    try {
      setIsGenerating(true);
      
      // Get user context for personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const context = {
        preferences: {
          userType: 'real_estate_agent',
          templateId,
          sectionType: sectionData.type,
          userProfile: profile || {}
        }
      };

      const prompt = templatePrompt 
        ? `${templatePrompt}\n\nSection: ${sectionData.title}\nDescription: ${sectionData.description}\n\nCreate detailed, actionable content for this section.`
        : `Create detailed content for this playbook section:\nTitle: ${sectionData.title}\nDescription: ${sectionData.description}\nType: ${sectionData.type}\n\nMake it specific and actionable for real estate agents.`;

      const aiContent = await getRecommendation(prompt, context);

      if (aiContent && contentId) {
        // Save AI assistance record
        await supabase
          .from('playbook_ai_assistance')
          .insert({
            creator_id: user.id,
            content_id: contentId,
            section_index: sectionData.index || 0,
            assistance_type: 'draft',
            ai_suggestion: aiContent
          });
      }

      return aiContent;
    } catch (error) {
      console.error('Error drafting section:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to generate draft. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const improveContent = async (originalContent: string, sectionIndex: number, improvementType: 'improve' | 'expand' | 'shorten') => {
    if (!user?.id || !contentId) return null;

    try {
      setIsGenerating(true);

      const prompts = {
        improve: `Improve and refine this content while keeping the same length and structure:\n\n${originalContent}`,
        expand: `Expand this content with more details, examples, and actionable advice:\n\n${originalContent}`,
        shorten: `Make this content more concise while keeping all key points:\n\n${originalContent}`
      };

      const aiContent = await getRecommendation(prompts[improvementType]);

      if (aiContent) {
        await supabase
          .from('playbook_ai_assistance')
          .insert({
            creator_id: user.id,
            content_id: contentId,
            section_index: sectionIndex,
            assistance_type: improvementType,
            original_content: originalContent,
            ai_suggestion: aiContent
          });
      }

      return aiContent;
    } catch (error) {
      console.error('Error improving content:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to improve content. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCompletePlaybook = async (template: any, userInputs: any) => {
    if (!user?.id) return null;

    try {
      setIsGenerating(true);

      const prompt = `Create a complete real estate agent playbook based on this template and user information:

Template: ${template.template_name}
Description: ${template.template_description}
User Context: ${JSON.stringify(userInputs, null, 2)}

Generate comprehensive content for each section:
${template.sections.map((section: any, index: number) => 
  `${index + 1}. ${section.title}: ${section.description}`
).join('\n')}

Make it specific, actionable, and valuable for other real estate agents.`;

      const aiContent = await getRecommendation(prompt, {
        preferences: {
          userType: 'real_estate_agent',
          templateId: template.id
        }
      });

      if (aiContent && contentId) {
        await supabase
          .from('playbook_ai_assistance')
          .insert({
            creator_id: user.id,
            content_id: contentId,
            section_index: -1, // Indicates full playbook generation
            assistance_type: 'complete_playbook',
            ai_suggestion: aiContent
          });
      }

      return aiContent;
    } catch (error) {
      console.error('Error generating complete playbook:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to generate complete playbook. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    draftSection,
    improveContent,
    generateCompletePlaybook
  };
}