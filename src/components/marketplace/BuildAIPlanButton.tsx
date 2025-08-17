import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGoalPlan } from "@/hooks/useGoalPlan";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Clock, Target } from "lucide-react";
import { WebGroundedToggle } from "./WebGroundedToggle";
import { PlanSourcesDisplay } from "./PlanSourcesDisplay";

interface Props {
  goalTitle?: string;
  description?: string;
  timeframeWeeks?: number;
  budgetMin?: number;
  budgetMax?: number;
  onPlanReady?: (plan: any) => void;
}

export const BuildAIPlanButton: React.FC<Props> = ({
  goalTitle,
  description,
  timeframeWeeks,
  budgetMin,
  budgetMax,
  onPlanReady,
}) => {
  const [webGrounded, setWebGrounded] = useState(false);
  const [lastGeneratedPlan, setLastGeneratedPlan] = useState<any>(null);
  const [lastSources, setLastSources] = useState<any[]>([]);
  const { isBuilding, buildPlan } = useGoalPlan();
  const { toast } = useToast();

  const handleBuild = async () => {
    try {
      const result = await buildPlan({
        goalTitle,
        goalDescription: description,
        timeframeWeeks,
        budgetMin,
        budgetMax,
        webGrounded,
      });

      if (result) {
        setLastGeneratedPlan(result);
        setLastSources(result.sources || []);
        
        if (onPlanReady) {
          onPlanReady(result);
        }
        
        toast({
          title: webGrounded ? "Market-Intelligence Plan Generated" : "AI Plan Generated",
          description: webGrounded 
            ? `Personalized plan created using current market data from ${result.sources?.length || 0} sources`
            : "Personalized plan created using AI analysis of your profile",
        });
      }
    } catch (error) {
      console.error("Failed to build plan:", error);
      toast({
        title: "Plan Generation Failed", 
        description: "Please try again in a moment.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <WebGroundedToggle 
        enabled={webGrounded}
        onToggle={setWebGrounded}
      />
      
      <Button 
        onClick={handleBuild}
        disabled={isBuilding}
        className="w-full"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isBuilding ? "Building Your Plan..." : "Build AI Plan"}
      </Button>

      {/* Show the generated plan if available */}
      {lastGeneratedPlan && (
        <div className="space-y-4">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {lastGeneratedPlan.goal_title || "Your AI-Generated Plan"}
              </CardTitle>
              <CardDescription>
                {lastGeneratedPlan.summary || "Personalized business growth strategy"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {lastGeneratedPlan.timeframe_weeks || 12}
                    </div>
                    <div className="text-sm text-muted-foreground">Weeks</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {lastGeneratedPlan.confidence ? Math.round(lastGeneratedPlan.confidence * 100) : 75}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                </div>

                {/* Phases preview */}
                {lastGeneratedPlan.phases && lastGeneratedPlan.phases.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Plan Phases ({lastGeneratedPlan.phases.length})
                    </h4>
                    <div className="space-y-2">
                      {lastGeneratedPlan.phases.slice(0, 2).map((phase: any, index: number) => (
                        <div key={index} className="border-l-4 border-primary pl-3 py-1">
                          <div className="font-medium text-sm">{phase.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {phase.weeks} weeks • {phase.steps?.length || 0} steps
                          </div>
                        </div>
                      ))}
                      {lastGeneratedPlan.phases.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          +{lastGeneratedPlan.phases.length - 2} more phases...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Show sources if web-grounded mode was used */}
          <PlanSourcesDisplay sources={lastSources} />
        </div>
      )}
    </div>
  );
};

export default BuildAIPlanButton;