import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAIConcierge } from "@/hooks/useAIConcierge";
import { useAdvisorScript } from "@/hooks/useAdvisorScript";
import { Send, X, Loader2, MessageCircle, ShoppingCart, Star, TrendingUp, Users, Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdvisorScriptModal } from "./AdvisorScriptModal";
import { WhyThisPopover } from "@/components/recs/WhyThisPopover";
import { ROIBadge } from "@/components/recs/ROIBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AskCircleAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AskCircleAIModal({ open, onOpenChange }: AskCircleAIModalProps) {
  const { conversation, isLoading, startConversation, sendMessage, savePlanToProfile } = useAIConcierge();
  const { user } = useAuth();
  const { isComplete, resetResponses } = useAdvisorScript();
  const [showAdvisorScript, setShowAdvisorScript] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [acceptedPlan, setAcceptedPlan] = useState<any>(null);

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleStartConversation = () => {
    if (!user) {
      toast.error("Please sign in to start your growth planning session");
      return;
    }
    setShowAdvisorScript(true);
  };

  const handleScriptComplete = async () => {
    setIsGeneratingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke('build-plan-from-signals');
      
      if (error) throw error;
      
      setPlanData(data);
      toast.success("Your personalized growth plan is ready!");
    } catch (error) {
      console.error('Error generating plan:', error);
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleAcceptPlan = async () => {
    if (!planData?.plan_id) return;
    
    try {
      const { error } = await supabase
        .from('goal_based_recommendations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', planData.plan_id);
      
      if (error) throw error;
      
      setAcceptedPlan(planData);
      toast.success("Plan saved! Would you like us to email you a summary?");
    } catch (error) {
      console.error('Error accepting plan:', error);
      toast.error("Failed to save plan. Please try again.");
    }
  };

  const handleSavePlan = async () => {
    try {
      await savePlanToProfile();
      toast.success("Plan saved to your profile!");
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error("Failed to save plan. Please try again.");
    }
  };

  const handleReset = () => {
    resetResponses();
    setPlanData(null);
    setAcceptedPlan(null);
    setShowAdvisorScript(false);
  };

  // Show loading while generating plan
  if (isGeneratingPlan) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary animate-pulse" />
              Building Your Plan
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <p className="font-medium">Analyzing your responses...</p>
              <p className="text-sm text-muted-foreground">
                This will just take a moment while I create your personalized growth plan.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show plan results
  if (planData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Your {planData.playbook?.title || "Growth Plan"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Confidence Score */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {planData.confidence_score}% Match
              </Badge>
              <span className="text-sm text-muted-foreground">Based on agents like you</span>
            </div>

            {/* Playbook Description */}
            {planData.playbook && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">{planData.playbook.title}</h3>
                  <p className="text-sm text-muted-foreground">{planData.playbook.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Recommended Services */}
            {planData.services && planData.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Recommended Services ({planData.services.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {planData.services.map((service: any) => (
                    <div key={service.service_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{service.title}</h4>
                          <WhyThisPopover 
                            peerUsage={service.reasons?.peer_usage}
                            expectedDelta={service.reasons?.expected_delta}
                            fitReason={service.reasons?.fit_reason}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{service.category}</p>
                        {planData.roi && (
                          <ROIBadge roi={planData.roi} variant="compact" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!acceptedPlan ? (
                <Button onClick={handleAcceptPlan} className="w-full" size="lg">
                  Accept This Plan
                </Button>
              ) : (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Star className="h-4 w-4" />
                    <span className="font-medium">Plan Accepted!</span>
                  </div>
                  <Button variant="outline" onClick={handleSavePlan} className="w-full">
                    Save & Email My Plan
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Start Over
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  View Marketplace
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Original welcome screen and conversation flow for backward compatibility
  if (!conversation.sessionId && !conversation.isComplete && !showAdvisorScript) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Circle AI Concierge
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Your Personal Growth Coach</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's map your path to growth — starting from where you are today. I'll ask you just 12 questions to build your personalized plan.
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">What we'll cover:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your current transaction volume and goals</li>
                <li>• Your biggest business challenges</li>
                <li>• Your budget and working style preferences</li>
                <li>• Personalized marketplace recommendations with ROI</li>
              </ul>
            </div>

            <Button 
              onClick={handleStartConversation}
              disabled={!user}
              className="w-full"
              size="lg"
            >
              Start My Growth Planning Session
            </Button>

            {!user && (
              <p className="text-sm text-muted-foreground text-center">
                Please sign in to start your personalized growth planning session
              </p>
            )}
          </div>
        </DialogContent>

        <AdvisorScriptModal
          open={showAdvisorScript}
          onOpenChange={setShowAdvisorScript}
          onComplete={handleScriptComplete}
        />
      </Dialog>
    );
  }

  // Fallback to original conversation flow for existing sessions
  if (conversation.isComplete && conversation.plan) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Your Personalized Growth Plan
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Confidence Score and Trust Signals */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  {conversation.plan.confidence_score || 75}% Match
                </Badge>
                <span className="text-muted-foreground">Based on agents like you</span>
              </div>
              
              {conversation.plan.marketplace_summary && (
                <p className="text-sm text-muted-foreground italic">
                  "{conversation.plan.marketplace_summary}"
                </p>
              )}
            </div>

            {/* Recommended Services */}
            {conversation.plan.recommended_services && conversation.plan.recommended_services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Recommended Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conversation.plan.recommended_services.map((service: any) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium">{service.title}</h4>
                        <p className="text-sm text-muted-foreground">{service.category}</p>
                        {service.roi_estimate && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            ROI: {service.roi_estimate}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">{service.pro_price || service.retail_price}</p>
                        <p className="text-xs text-muted-foreground">Circle Pro</p>
                      </div>
                    </div>
                  ))}
                  
                  {conversation.plan.trust_signals && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Peer Insights
                      </p>
                      {conversation.plan.trust_signals.map((signal: string, index: number) => (
                        <p key={index} className="text-sm text-muted-foreground mb-1">
                          • {signal}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{conversation.plan.goal_title || "Your Growth Plan"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {conversation.plan.summary}
                </p>
                
                {conversation.plan.phases && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Implementation Phases:</h4>
                    {conversation.plan.phases.map((phase: any, index: number) => (
                      <div key={index} className="border-l-2 border-primary pl-4">
                        <h5 className="font-medium">{phase.name}</h5>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                        {phase.weeks && (
                          <Badge variant="outline" className="mt-1">
                            {phase.weeks} weeks
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={savePlanToProfile} variant="outline" className="flex-1">
                Save Plan to Profile
              </Button>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  // Future: Navigate to marketplace with filtered results
                }} 
                className="flex-1"
              >
                View Recommended Services
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Here's your plan — want me to save this inside your profile so you can track progress?
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Return the advisor script modal when active
  return (
    <>
      <AdvisorScriptModal
        open={showAdvisorScript}
        onOpenChange={setShowAdvisorScript}
        onComplete={handleScriptComplete}
      />
      
      {/* Fallback conversation UI for existing sessions */}
      <Dialog open={open && !showAdvisorScript} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Circle AI Concierge
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {conversation.quickReplies.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">Quick replies:</p>
              <div className="flex flex-wrap gap-2">
                {conversation.quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(reply)}
                    disabled={isLoading}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}