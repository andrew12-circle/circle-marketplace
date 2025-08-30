// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { X, Lightbulb, AlertTriangle, TrendingUp, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ProactiveTrigger {
  id: string;
  trigger_type: string;
  trigger_data: any;
  help_offered: boolean;
  help_accepted: boolean;
  created_at: string;
}

interface ProactiveHelpSuggestion {
  type: 'warning' | 'tip' | 'feature' | 'improvement';
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
}

export const ProactiveHelpMonitor: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [triggers, setTriggers] = useState<ProactiveTrigger[]>([]);
  const [suggestions, setSuggestions] = useState<ProactiveHelpSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const checkProactiveHelp = async () => {
      try {
        // Get recent triggers for the user
        const { data: triggersData, error } = await supabase
          .from('help_proactive_triggers')
          .select('*')
          .eq('user_id', user.id)
          .eq('help_offered', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching proactive triggers:', error);
          return;
        }

        setTriggers(triggersData || []);
        
        // Generate suggestions based on triggers
        const newSuggestions = generateSuggestions(triggersData || [], location.pathname);
        setSuggestions(newSuggestions);
        
        if (newSuggestions.length > 0) {
          setIsVisible(true);
        }

      } catch (error) {
        console.error('Error in proactive help check:', error);
      }
    };

    // Check immediately and then every 30 seconds
    checkProactiveHelp();
    const interval = setInterval(checkProactiveHelp, 30000);

    return () => clearInterval(interval);
  }, [user?.id, location.pathname]);

  const generateSuggestions = (triggers: ProactiveTrigger[], currentPath: string): ProactiveHelpSuggestion[] => {
    const suggestions: ProactiveHelpSuggestion[] = [];

    // Analyze triggers
    triggers.forEach(trigger => {
      switch (trigger.trigger_type) {
        case 'stuck_pattern':
          suggestions.push({
            type: 'warning',
            title: 'Multiple Issues Detected',
            description: `You've encountered ${trigger.trigger_data.frequency} issues recently. Let me help you resolve this pattern.`,
            action: 'open_help',
            actionLabel: 'Get Help',
            priority: 'high'
          });
          break;

        case 'error_pattern':
          suggestions.push({
            type: 'warning',
            title: 'Technical Issue Detected',
            description: 'I noticed you\'re experiencing technical difficulties. Would you like troubleshooting assistance?',
            action: 'troubleshoot',
            actionLabel: 'Troubleshoot',
            priority: 'high'
          });
          break;

        case 'confusion_indicator':
          suggestions.push({
            type: 'tip',
            title: 'Need Guidance?',
            description: 'It looks like you might need some guidance with this feature. I can provide a quick tutorial.',
            action: 'start_tour',
            actionLabel: 'Take Tour',
            priority: 'medium'
          });
          break;

        case 'feature_discovery':
          suggestions.push({
            type: 'feature',
            title: 'New Feature Available',
            description: 'There\'s a feature that might help with what you\'re trying to do. Want to learn about it?',
            action: 'show_feature',
            actionLabel: 'Learn More',
            priority: 'low'
          });
          break;
      }
    });

    // Add contextual suggestions based on current page
    if (currentPath === '/marketplace' && suggestions.length === 0) {
      suggestions.push({
        type: 'tip',
        title: 'Pro Tip: Search Filters',
        description: 'Use the advanced filters to find exactly what you need. Try filtering by location, price, or ratings.',
        action: 'highlight_filters',
        actionLabel: 'Show Me',
        priority: 'low'
      });
    }

    if (currentPath === '/academy' && suggestions.length === 0) {
      suggestions.push({
        type: 'improvement',
        title: 'Learning Path Suggestion',
        description: 'Based on your activity, I can recommend a personalized learning path to boost your business.',
        action: 'suggest_path',
        actionLabel: 'Get Recommendations',
        priority: 'medium'
      });
    }

    return suggestions.filter(s => !dismissedSuggestions.has(`${s.type}-${s.title}`));
  };

  const handleSuggestionAction = async (suggestion: ProactiveHelpSuggestion) => {
    try {
      switch (suggestion.action) {
        case 'open_help':
          // Open help widget
          window.dispatchEvent(new CustomEvent('openHelpWidget'));
          break;

        case 'troubleshoot':
          // Open help widget with troubleshooting context
          window.dispatchEvent(new CustomEvent('openHelpWidget', { 
            detail: { context: 'troubleshoot' } 
          }));
          break;

        case 'start_tour':
          // Start a contextual tour
          window.dispatchEvent(new CustomEvent('startContextualTour'));
          break;

        case 'show_feature':
          // Show feature highlights
          window.dispatchEvent(new CustomEvent('highlightFeatures'));
          break;

        case 'highlight_filters':
          // Highlight marketplace filters
          const filterElement = document.querySelector('[data-tour="marketplace-filters"]');
          if (filterElement) {
            filterElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            filterElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
            setTimeout(() => {
              filterElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            }, 3000);
          }
          break;

        case 'suggest_path':
          // Navigate to Academy with learning path context
          navigate('/academy?showRecommendations=true');
          break;
      }

      // Mark trigger as help offered
      if (triggers.length > 0) {
        await supabase
          .from('help_proactive_triggers')
          .update({ 
            help_offered: true, 
            help_accepted: true 
          })
          .eq('user_id', user?.id)
          .eq('help_offered', false);
      }

      toast({
        title: "Help Activated",
        description: "I'm here to help you succeed!",
      });

    } catch (error) {
      console.error('Error handling suggestion action:', error);
    }
  };

  const handleDismissSuggestion = (suggestion: ProactiveHelpSuggestion) => {
    const key = `${suggestion.type}-${suggestion.title}`;
    setDismissedSuggestions(prev => new Set([...prev, key]));
    
    // Remove from current suggestions
    setSuggestions(prev => prev.filter(s => `${s.type}-${s.title}` !== key));
    
    // Store dismissal in localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedHelpSuggestions') || '[]');
    localStorage.setItem('dismissedHelpSuggestions', JSON.stringify([...dismissed, key]));
  };

  const handleDismissAll = () => {
    setIsVisible(false);
    setSuggestions([]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'tip': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'feature': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'improvement': return <BookOpen className="w-4 h-4 text-purple-500" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2">
      {suggestions.map((suggestion, index) => (
        <Card key={`${suggestion.type}-${suggestion.title}`} className="shadow-lg border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(suggestion.type)}
                <div>
                  <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                  <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs mt-1">
                    {suggestion.priority} priority
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismissSuggestion(suggestion)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm mb-3">
              {suggestion.description}
            </CardDescription>
            {suggestion.action && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSuggestionAction(suggestion)}
                  className="flex-1"
                >
                  {suggestion.actionLabel}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {suggestions.length > 1 && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={handleDismissAll}>
            Dismiss All
          </Button>
        </div>
      )}
    </div>
  );
};