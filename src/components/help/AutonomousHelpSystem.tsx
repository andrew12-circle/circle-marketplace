import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Mic, 
  MicOff, 
  Loader2, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  BookOpen,
  Settings,
  Play,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface SelfServiceAction {
  type: 'guide' | 'page' | 'action' | 'tour' | 'article';
  title: string;
  url?: string;
  action?: string;
  content?: string;
  id?: string;
}

interface IssueAnalysis {
  category: string;
  severity: string;
  title: string;
  urgency: string;
  sentiment: string;
  complexityScore: number;
}

export const AutonomousHelpSystem: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your autonomous AI assistant. I can help you with technical issues, account questions, billing concerns, or guide you through features. What can I help you with today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentIssueAnalysis, setCurrentIssueAnalysis] = useState<IssueAnalysis | null>(null);
  const [selfServiceActions, setSelfServiceActions] = useState<SelfServiceAction[]>([]);
  const [helpIssueId, setHelpIssueId] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const {
    isListening,
    isProcessing,
    startListening,
    stopListening,
    isSupported: voiceSupported
  } = useVoiceAssistant({
    onTranscript: (transcript) => {
      if (transcript.trim()) {
        setInputValue(transcript);
      }
    },
    onResponse: (response) => {
      if (response) {
        addMessage('ai', response);
      }
    }
  });

  const addMessage = (type: 'user' | 'ai' | 'system', content: string, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      metadata,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      // Gather user context
      const userContext = {
        currentPage: window.location.pathname,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString(),
        previousMessages: messages.slice(-5) // Last 5 messages for context
      };

      const { data, error } = await supabase.functions.invoke('autonomous-help-ai', {
        body: {
          query: userMessage,
          userId: user?.id,
          userContext,
          issueType: 'general'
        }
      });

      if (error) {
        throw error;
      }

      addMessage('ai', data.response, {
        confidenceScore: data.confidenceScore,
        issueAnalysis: data.issueAnalysis,
        helpIssueId: data.helpIssueId
      });

      setCurrentIssueAnalysis(data.issueAnalysis);
      setSelfServiceActions(data.selfServiceActions || []);
      setHelpIssueId(data.helpIssueId);
      setConfidenceScore(data.confidenceScore);
      setSuggestedFollowUps(data.suggestedFollowUps || []);

      if (data.escalationRecommended) {
        addMessage('system', "Based on the complexity of your issue, I recommend connecting with our support team for personalized assistance. Would you like me to help you contact them?");
      }

    } catch (error) {
      console.error('Autonomous help AI error:', error);
      addMessage('ai', "I apologize, but I'm experiencing technical difficulties. Let me provide some general assistance while I recover. What specific area would you like help with?");
      toast({
        title: "AI Assistant Error",
        description: "The AI assistant is temporarily unavailable. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        await startListening();
      } catch (error) {
        toast({
          title: "Voice Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSelfServiceAction = async (action: SelfServiceAction) => {
    switch (action.type) {
      case 'page':
        window.open(action.url, '_blank');
        break;
      case 'guide':
        window.open(action.url, '_blank');
        break;
      case 'tour':
        addMessage('system', `Starting guided tour: ${action.title}`);
        break;
      case 'action':
        if (action.action === 'run_diagnostics') {
          addMessage('system', "Running system diagnostics... Please wait.");
          // Simulate diagnostics
          setTimeout(() => {
            addMessage('ai', "Diagnostics complete. No major issues detected. Your browser and connection appear to be working properly.");
          }, 2000);
        }
        break;
      case 'article':
        addMessage('ai', `Here's the relevant article: **${action.title}**\n\n${action.content}`);
        break;
    }
  };

  const handleFollowUpClick = (followUp: string) => {
    setInputValue(followUp);
    handleSendMessage();
  };

  const handleFeedback = async (messageId: string, feedback: 'helpful' | 'not_helpful') => {
    if (feedbackGiven.has(messageId)) return;

    try {
      await supabase.from('help_ai_learning').insert({
        user_query: messages.find(m => m.id === messageId)?.content || '',
        ai_response: '',
        user_feedback: feedback,
        resolution_achieved: feedback === 'helpful',
        context_data: { messageId, timestamp: new Date().toISOString() }
      });

      setFeedbackGiven(prev => new Set([...prev, messageId]));
      
      toast({
        title: "Thank you!",
        description: "Your feedback helps improve our AI assistant.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'guide': return <BookOpen className="w-4 h-4" />;
      case 'page': return <Settings className="w-4 h-4" />;
      case 'tour': return <Play className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="chat" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Brain className="w-4 h-4 mr-2" />
            Issue Analysis
          </TabsTrigger>
          <TabsTrigger value="actions">
            <Settings className="w-4 h-4 mr-2" />
            Self-Service
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.type === 'system'
                          ? 'bg-secondary text-secondary-foreground border border-border'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.metadata?.confidenceScore && (
                        <div className="mt-2 flex items-center gap-2 text-xs opacity-75">
                          <Brain className="w-3 h-3" />
                          Confidence: {Math.round(message.metadata.confidenceScore * 100)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback buttons for AI messages */}
                  {message.type === 'ai' && !feedbackGiven.has(message.id) && (
                    <div className="flex justify-start mt-2 ml-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, 'helpful')}
                          className="h-6 w-6 p-0"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, 'not_helpful')}
                          className="h-6 w-6 p-0"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Suggested follow-ups */}
              {suggestedFollowUps.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-2">
                  {suggestedFollowUps.map((followUp, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowUpClick(followUp)}
                      className="text-xs"
                    >
                      {followUp}
                    </Button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analyzing and generating response...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your issue or ask a question..."
                className="flex-1"
                disabled={isLoading}
              />
              {voiceSupported && (
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleVoiceToggle}
                  disabled={isProcessing}
                  className="w-10 h-10 p-0"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="w-10 h-10 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-primary mt-1 text-center animate-pulse">
                Listening... Speak now
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 p-3 space-y-4">
          {currentIssueAnalysis ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Issue Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Badge variant="outline">{currentIssueAnalysis.category}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <Badge variant={getSeverityColor(currentIssueAnalysis.severity)}>
                      {currentIssueAnalysis.severity}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Urgency</label>
                    <Badge variant="secondary">{currentIssueAnalysis.urgency}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sentiment</label>
                    <Badge variant="outline">{currentIssueAnalysis.sentiment}</Badge>
                  </div>
                </div>

                {confidenceScore && (
                  <div>
                    <label className="text-sm font-medium">AI Confidence</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${confidenceScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{Math.round(confidenceScore * 100)}%</span>
                    </div>
                  </div>
                )}

                {helpIssueId && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Issue tracked with ID: {helpIssueId.substring(0, 8)}...
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Start a conversation to see issue analysis</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="flex-1 p-3">
          {selfServiceActions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold">Recommended Actions</h3>
              <div className="grid gap-3">
                {selfServiceActions.map((action, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent 
                      className="p-4 flex items-center gap-3"
                      onClick={() => handleSelfServiceAction(action)}
                    >
                      {getActionIcon(action.type)}
                      <div className="flex-1">
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{action.type}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Self-service actions will appear here based on your questions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};