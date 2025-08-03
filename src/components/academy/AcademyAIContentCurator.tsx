import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, X, BookOpen, Video, Headphones, Book, TrendingUp, Target, Brain, PlayCircle, Clock, Star, Users, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface CuratedContent {
  id: string;
  title: string;
  type: 'video' | 'podcast' | 'book' | 'course';
  creator: string;
  duration?: string;
  rating?: number;
  description: string;
  relevanceScore: number;
  reason: string;
  category: string;
  thumbnail?: string;
  isProContent?: boolean;
}

interface LearningPath {
  pathName: string;
  description: string;
  estimatedTimeToGoal: string;
  totalContent: number;
  content: CuratedContent[];
  keySkillsToFocus: string[];
  milestones: string[];
}

interface AcademyAIContentCuratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContentSelect?: (content: CuratedContent) => void;
}

export const AcademyAIContentCurator = ({ open, onOpenChange, onContentSelect }: AcademyAIContentCuratorProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const { toast } = useToast();
  
  // Goal setting state
  const [currentDeals, setCurrentDeals] = useState("");
  const [targetDeals, setTargetDeals] = useState("");
  const [timeframe, setTimeframe] = useState("12");
  const [specificChallenges, setSpecificChallenges] = useState("");
  const [primaryFocus, setPrimaryFocus] = useState("");

  const suggestionChips = [
    "Lead generation strategies",
    "Closing techniques", 
    "Social media marketing",
    "Client communication",
    "Luxury market tactics",
    "First-time buyer strategies"
  ];

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'podcast': return <Headphones className="w-4 h-4" />;
      case 'book': return <Book className="w-4 h-4" />;
      case 'course': return <BookOpen className="w-4 h-4" />;
      default: return <PlayCircle className="w-4 h-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-700';
      case 'podcast': return 'bg-purple-100 text-purple-700';
      case 'book': return 'bg-blue-100 text-blue-700';
      case 'course': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleGenerateLearningPath = async () => {
    if (!currentDeals || !targetDeals) {
      toast({
        title: "Please enter your deal numbers",
        description: "We need your current and target deal volume to curate content",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to get personalized content recommendations",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('academy-ai-curator', {
        body: {
          userId: user.id,
          performanceData: {
            currentDeals: parseInt(currentDeals),
            targetDeals: parseInt(targetDeals),
            timeframe: parseInt(timeframe),
            specificChallenges,
            primaryFocus
          },
          context: {
            currentPage: "academy_curator",
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Error getting learning path:', error);
        throw error;
      }

      if (data?.learningPath) {
        setLearningPath(data.learningPath);
        toast({
          title: "Learning Path Generated!",
          description: `Found ${data.learningPath.totalContent} pieces of content to help you reach your goal`,
        });
      } else {
        throw new Error('No learning path received');
      }
    } catch (error) {
      console.error('Failed to generate learning path:', error);
      toast({
        title: "AI Service Error",
        description: "Unable to generate learning path. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chipText: string) => {
    setPrimaryFocus(chipText);
  };

  const handleReset = () => {
    setLearningPath(null);
    setCurrentDeals("");
    setTargetDeals("");
    setTimeframe("12");
    setSpecificChallenges("");
    setPrimaryFocus("");
  };

  const handleContentClick = (content: CuratedContent) => {
    onContentSelect?.(content);
    toast({
      title: "Content Selected",
      description: `Opening: ${content.title}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold">AI Content Curator</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Get personalized learning paths based on your goals and current performance.
          </p>
        </DialogHeader>

        {!learningPath ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI-Powered Learning Curation</h3>
              </div>
              <p className="text-sm text-blue-700">
                Tell us where you are and where you want to be. Our AI will analyze all academy content and create a personalized learning path to bridge that gap.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Current Performance</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentDeals">Deals closed in last 12 months *</Label>
                    <Input
                      id="currentDeals"
                      type="number"
                      placeholder="5"
                      value={currentDeals}
                      onChange={(e) => setCurrentDeals(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="specificChallenges">Current Challenges (Optional)</Label>
                    <Textarea
                      id="specificChallenges"
                      placeholder="e.g., Struggling with lead generation, need better closing techniques..."
                      value={specificChallenges}
                      onChange={(e) => setSpecificChallenges(e.target.value)}
                      className="mt-1 h-20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Future Goals</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="targetDeals">Target deals per year *</Label>
                    <Input
                      id="targetDeals"
                      type="number"
                      placeholder="25"
                      value={targetDeals}
                      onChange={(e) => setTargetDeals(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeframe">Timeframe to achieve goal</Label>
                    <select
                      id="timeframe"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="6">6 months</option>
                      <option value="12">12 months</option>
                      <option value="18">18 months</option>
                      <option value="24">24 months</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Primary Focus Area (Optional)</Label>
              <Input
                placeholder="What specific skill do you want to improve most?"
                value={primaryFocus}
                onChange={(e) => setPrimaryFocus(e.target.value)}
              />
              
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestionChips.map((chip) => (
                  <Button
                    key={chip}
                    variant="outline"
                    size="sm"
                    onClick={() => handleChipClick(chip)}
                    className="text-xs"
                  >
                    {chip}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleGenerateLearningPath}
              disabled={loading || !currentDeals || !targetDeals}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
            >
              {loading ? "Analyzing Content Library..." : "Generate My Learning Path"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Learning Path Header */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{learningPath.pathName}</h3>
                  <p className="text-sm text-gray-600 mb-3">{learningPath.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{learningPath.estimatedTimeToGoal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{learningPath.totalContent} pieces</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{targetDeals} deals/year</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">From {currentDeals} deals</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              {/* Key Skills */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Key Skills to Focus On:</h4>
                <div className="flex flex-wrap gap-2">
                  {learningPath.keySkillsToFocus.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-white">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Your Learning Milestones:</h4>
                <div className="space-y-1">
                  {learningPath.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      {milestone}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Curated Content */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Personalized Content</h3>
              <div className="grid gap-4">
                {learningPath.content.map((content, index) => (
                  <Card key={content.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleContentClick(content)}>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getContentIcon(content.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getContentTypeColor(content.type)}>
                              {content.type}
                            </Badge>
                            {content.isProContent && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Pro
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">#{index + 1} in path</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {content.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{content.rating}</span>
                              </div>
                            )}
                            {content.duration && (
                              <span>{content.duration}</span>
                            )}
                          </div>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{content.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">By {content.creator}</p>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{content.description}</p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Why this helps you:</span>
                          </div>
                          <p className="text-sm text-blue-700">{content.reason}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Create New Path
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start Learning
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};