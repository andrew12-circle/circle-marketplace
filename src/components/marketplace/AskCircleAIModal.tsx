import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAIConcierge } from "@/hooks/useAIConcierge";
import { Send, X, Loader2, MessageCircle, ShoppingCart, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AskCircleAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AskCircleAIModal({ open, onOpenChange }: AskCircleAIModalProps) {
  const { conversation, isLoading, startConversation, sendMessage, savePlanToProfile } = useAIConcierge();
  const { user } = useAuth();

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleStartConversation = () => {
    if (!user) {
      return;
    }
    startConversation();
  };

  if (!conversation.sessionId && !conversation.isComplete) {
    // Welcome screen
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
                I'll ask you a few questions about your business, then create a personalized growth plan with specific marketplace recommendations.
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">What we'll cover:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your current transaction volume</li>
                <li>• Your goals for this year</li>
                <li>• Your biggest business challenges</li>
                <li>• Personalized marketplace recommendations</li>
              </ul>
            </div>

            <Button 
              onClick={handleStartConversation}
              disabled={!user || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start My Growth Planning Session"
              )}
            </Button>

            {!user && (
              <p className="text-sm text-muted-foreground text-center">
                Please sign in to start your personalized growth planning session
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (conversation.isComplete && conversation.plan) {
    // Show plan results
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
            {/* Confidence Score */}
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {conversation.plan.confidence_score || 75}% Match
              </Badge>
              <span className="text-muted-foreground">Based on agents like you</span>
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
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{service.title}</h4>
                        <p className="text-sm text-muted-foreground">{service.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{service.pro_price || service.retail_price}</p>
                      </div>
                    </div>
                  ))}
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
              <Button onClick={() => onOpenChange(false)} className="flex-1">
                Explore Marketplace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Conversation in progress
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}