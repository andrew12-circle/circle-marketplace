import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, RefreshCw, X } from 'lucide-react';
import { useGoalPlan } from '@/hooks/useGoalPlan';
import { useToast } from '@/hooks/use-toast';

interface ConversationalRefinementProps {
  currentPlan: any;
  onPlanUpdated: (newPlan: any) => void;
}

const STYLE_TOGGLES = [
  { id: 'no_cold_calls', label: 'No Cold Calls', category: 'outreach' },
  { id: 'prefer_mailers', label: 'Prefer Direct Mail', category: 'marketing' },
  { id: 'prefer_ppc', label: 'Prefer Digital Ads', category: 'marketing' },
  { id: 'prefer_content', label: 'Content Marketing', category: 'marketing' },
  { id: 'prefer_events', label: 'Events & Open Houses', category: 'networking' },
  { id: 'prefer_referrals', label: 'Referral Focus', category: 'networking' },
  { id: 'no_social_media', label: 'No Social Media', category: 'marketing' },
  { id: 'prefer_one_on_one', label: 'One-on-One Focus', category: 'communication' }
];

export function ConversationalRefinement({ 
  currentPlan, 
  onPlanUpdated 
}: ConversationalRefinementProps) {
  const [selectedToggles, setSelectedToggles] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const { buildPlan, isBuilding } = useGoalPlan();
  const { toast } = useToast();

  const handleToggleChange = (toggleId: string) => {
    setSelectedToggles(prev => 
      prev.includes(toggleId) 
        ? prev.filter(id => id !== toggleId)
        : [...prev, toggleId]
    );
  };

  const handleRefineWithToggles = async () => {
    if (selectedToggles.length === 0 && !customMessage.trim()) {
      toast({
        title: "No Changes Selected",
        description: "Please select style preferences or add a custom message.",
        variant: "destructive"
      });
      return;
    }

    const styleConstraints = selectedToggles.map(id => 
      STYLE_TOGGLES.find(t => t.id === id)?.label
    ).filter(Boolean);

    const refinementMessage = [
      customMessage.trim(),
      styleConstraints.length > 0 && `Please adjust this plan to avoid: ${styleConstraints.join(', ')}`
    ].filter(Boolean).join('. ');

    try {
      const refinedPlan = await buildPlan({
        goalTitle: currentPlan?.goal_title,
        goalDescription: `${currentPlan?.goal_description}. REFINEMENT REQUEST: ${refinementMessage}`,
        timeframeWeeks: currentPlan?.timeframe_weeks,
        budgetMin: currentPlan?.current_performance?.budget_min,
        budgetMax: currentPlan?.current_performance?.budget_max
      });

      if (refinedPlan) {
        onPlanUpdated(refinedPlan);
        setSelectedToggles([]);
        setCustomMessage('');
        toast({
          title: "Plan Refined",
          description: "Your plan has been updated based on your preferences."
        });
      }
    } catch (error) {
      console.error('Refinement error:', error);
      toast({
        title: "Refinement Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Refine Your Plan</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Not your style? Select what you'd prefer to avoid or add custom instructions:
        </p>

        {/* Style Toggles */}
        <div className="space-y-3 mb-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Outreach & Communication</h4>
            <div className="flex flex-wrap gap-2">
              {STYLE_TOGGLES.filter(t => ['outreach', 'communication'].includes(t.category)).map(toggle => (
                <Badge
                  key={toggle.id}
                  variant={selectedToggles.includes(toggle.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedToggles.includes(toggle.id) 
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleToggleChange(toggle.id)}
                >
                  {selectedToggles.includes(toggle.id) && <X className="h-3 w-3 mr-1" />}
                  {toggle.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Marketing & Networking</h4>
            <div className="flex flex-wrap gap-2">
              {STYLE_TOGGLES.filter(t => ['marketing', 'networking'].includes(t.category)).map(toggle => (
                <Badge
                  key={toggle.id}
                  variant={selectedToggles.includes(toggle.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedToggles.includes(toggle.id) 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/80' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleToggleChange(toggle.id)}
                >
                  {toggle.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Message */}
        <div className="mb-4">
          <textarea
            placeholder="Or describe what you'd prefer... (e.g., 'Focus more on referrals', 'I need help with follow-up', 'Budget is tighter than expected')"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
          />
        </div>

        {/* Action Button */}
        <Button
          onClick={handleRefineWithToggles}
          disabled={isBuilding || (selectedToggles.length === 0 && !customMessage.trim())}
          className="w-full"
          variant="default"
        >
          {isBuilding ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refining Plan...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refine My Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}