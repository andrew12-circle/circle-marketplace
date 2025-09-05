import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  text: string;
  options: {
    value: string;
    label: string;
    trait: 'D' | 'I' | 'S' | 'C';
  }[];
}

const quickDiscQuestions: Question[] = [
  {
    id: 1,
    text: "When making decisions, I tend to:",
    options: [
      { value: "a", label: "Act quickly and decisively", trait: "D" },
      { value: "b", label: "Consider how it affects people", trait: "I" },
      { value: "c", label: "Take time to analyze all options", trait: "C" },
      { value: "d", label: "Seek input from others first", trait: "S" }
    ]
  },
  {
    id: 2,
    text: "In social situations, I:",
    options: [
      { value: "a", label: "Take charge and lead conversations", trait: "D" },
      { value: "b", label: "Enjoy meeting new people and networking", trait: "I" },
      { value: "c", label: "Prefer smaller, intimate gatherings", trait: "S" },
      { value: "d", label: "Like to observe before participating", trait: "C" }
    ]
  },
  {
    id: 3,
    text: "When working on projects, I prefer to:",
    options: [
      { value: "a", label: "Set ambitious goals and push for results", trait: "D" },
      { value: "b", label: "Brainstorm creative ideas with others", trait: "I" },
      { value: "c", label: "Create detailed plans and follow them", trait: "C" },
      { value: "d", label: "Work steadily and maintain quality", trait: "S" }
    ]
  },
  {
    id: 4,
    text: "Under pressure, I typically:",
    options: [
      { value: "a", label: "Become more focused and determined", trait: "D" },
      { value: "b", label: "Rally others to work together", trait: "I" },
      { value: "c", label: "Analyze the situation thoroughly", trait: "C" },
      { value: "d", label: "Stay calm and support the team", trait: "S" }
    ]
  },
  {
    id: 5,
    text: "My communication style is usually:",
    options: [
      { value: "a", label: "Direct and to the point", trait: "D" },
      { value: "b", label: "Enthusiastic and expressive", trait: "I" },
      { value: "c", label: "Detailed and precise", trait: "C" },
      { value: "d", label: "Patient and supportive", trait: "S" }
    ]
  }
];

const standardDiscQuestions: Question[] = [
  {
    id: 1,
    text: "When making important decisions, I typically:",
    options: [
      { value: "a", label: "Act quickly based on my instincts", trait: "D" },
      { value: "b", label: "Discuss options with others to get their input", trait: "I" },
      { value: "c", label: "Research thoroughly before deciding", trait: "C" },
      { value: "d", label: "Consider the impact on team harmony", trait: "S" }
    ]
  },
  {
    id: 2,
    text: "At work meetings, I usually:",
    options: [
      { value: "a", label: "Take control and drive the agenda", trait: "D" },
      { value: "b", label: "Share ideas enthusiastically", trait: "I" },
      { value: "c", label: "Listen carefully before contributing", trait: "S" },
      { value: "d", label: "Ask detailed questions for clarity", trait: "C" }
    ]
  },
  {
    id: 3,
    text: "When facing a challenging problem:",
    options: [
      { value: "a", label: "I tackle it head-on immediately", trait: "D" },
      { value: "b", label: "I brainstorm creative solutions with others", trait: "I" },
      { value: "c", label: "I break it down into manageable steps", trait: "C" },
      { value: "d", label: "I seek consensus on the best approach", trait: "S" }
    ]
  },
  {
    id: 4,
    text: "My ideal work environment would be:",
    options: [
      { value: "a", label: "Fast-paced with clear authority", trait: "D" },
      { value: "b", label: "Dynamic with lots of interaction", trait: "I" },
      { value: "c", label: "Stable with established procedures", trait: "S" },
      { value: "d", label: "Structured with attention to detail", trait: "C" }
    ]
  },
  {
    id: 5,
    text: "When giving feedback to colleagues:",
    options: [
      { value: "a", label: "I'm direct about what needs to change", trait: "D" },
      { value: "b", label: "I focus on encouraging their strengths", trait: "I" },
      { value: "c", label: "I provide detailed, constructive analysis", trait: "C" },
      { value: "d", label: "I'm gentle and supportive in my approach", trait: "S" }
    ]
  },
  {
    id: 6,
    text: "In conflict situations, I tend to:",
    options: [
      { value: "a", label: "Address the issue directly and firmly", trait: "D" },
      { value: "b", label: "Try to lighten the mood and find common ground", trait: "I" },
      { value: "c", label: "Analyze all sides objectively", trait: "C" },
      { value: "d", label: "Seek to mediate and maintain relationships", trait: "S" }
    ]
  },
  {
    id: 7,
    text: "My approach to deadlines is:",
    options: [
      { value: "a", label: "Push hard to finish early", trait: "D" },
      { value: "b", label: "Work in bursts of energy with others", trait: "I" },
      { value: "c", label: "Plan carefully to meet them precisely", trait: "C" },
      { value: "d", label: "Work steadily to avoid last-minute stress", trait: "S" }
    ]
  },
  {
    id: 8,
    text: "When presenting ideas, I:",
    options: [
      { value: "a", label: "Focus on bottom-line results", trait: "D" },
      { value: "b", label: "Use stories and enthusiasm to engage", trait: "I" },
      { value: "c", label: "Present detailed data and evidence", trait: "C" },
      { value: "d", label: "Ensure everyone understands and agrees", trait: "S" }
    ]
  },
  {
    id: 9,
    text: "My leadership style is typically:",
    options: [
      { value: "a", label: "Commanding and results-oriented", trait: "D" },
      { value: "b", label: "Inspirational and people-focused", trait: "I" },
      { value: "c", label: "Methodical and quality-driven", trait: "C" },
      { value: "d", label: "Collaborative and team-building", trait: "S" }
    ]
  },
  {
    id: 10,
    text: "When learning new skills, I prefer to:",
    options: [
      { value: "a", label: "Jump in and learn by doing", trait: "D" },
      { value: "b", label: "Learn through interaction and discussion", trait: "I" },
      { value: "c", label: "Study thoroughly before attempting", trait: "C" },
      { value: "d", label: "Practice in a supportive environment", trait: "S" }
    ]
  },
  {
    id: 11,
    text: "In team projects, I usually:",
    options: [
      { value: "a", label: "Take charge and delegate tasks", trait: "D" },
      { value: "b", label: "Generate ideas and motivate others", trait: "I" },
      { value: "c", label: "Focus on quality and accuracy", trait: "C" },
      { value: "d", label: "Support teammates and ensure cooperation", trait: "S" }
    ]
  },
  {
    id: 12,
    text: "My communication preference is:",
    options: [
      { value: "a", label: "Brief, direct, and decisive", trait: "D" },
      { value: "b", label: "Animated, personal, and engaging", trait: "I" },
      { value: "c", label: "Precise, factual, and thorough", trait: "C" },
      { value: "d", label: "Warm, patient, and understanding", trait: "S" }
    ]
  },
  {
    id: 13,
    text: "When handling criticism, I:",
    options: [
      { value: "a", label: "Challenge it if I disagree", trait: "D" },
      { value: "b", label: "Try to understand the relationship impact", trait: "I" },
      { value: "c", label: "Analyze it objectively for validity", trait: "C" },
      { value: "d", label: "Accept it graciously and avoid conflict", trait: "S" }
    ]
  },
  {
    id: 14,
    text: "My work pace tends to be:",
    options: [
      { value: "a", label: "Fast and urgent", trait: "D" },
      { value: "b", label: "Varied based on my energy and interest", trait: "I" },
      { value: "c", label: "Careful and methodical", trait: "C" },
      { value: "d", label: "Steady and consistent", trait: "S" }
    ]
  },
  {
    id: 15,
    text: "When motivating others, I:",
    options: [
      { value: "a", label: "Set challenging goals and expect results", trait: "D" },
      { value: "b", label: "Inspire with vision and enthusiasm", trait: "I" },
      { value: "c", label: "Provide clear guidelines and expectations", trait: "C" },
      { value: "d", label: "Offer support and encouragement", trait: "S" }
    ]
  },
  {
    id: 16,
    text: "In social networking situations:",
    options: [
      { value: "a", label: "I focus on meeting influential people", trait: "D" },
      { value: "b", label: "I enjoy meeting lots of new people", trait: "I" },
      { value: "c", label: "I prefer meaningful, one-on-one conversations", trait: "S" },
      { value: "d", label: "I listen more than I speak", trait: "C" }
    ]
  },
  {
    id: 17,
    text: "My approach to risk-taking is:",
    options: [
      { value: "a", label: "Bold - I take calculated risks for big rewards", trait: "D" },
      { value: "b", label: "Optimistic - I trust things will work out", trait: "I" },
      { value: "c", label: "Careful - I research risks thoroughly first", trait: "C" },
      { value: "d", label: "Conservative - I prefer safe, proven approaches", trait: "S" }
    ]
  },
  {
    id: 18,
    text: "When managing my time, I:",
    options: [
      { value: "a", label: "Focus on high-impact activities", trait: "D" },
      { value: "b", label: "Balance tasks with relationship-building", trait: "I" },
      { value: "c", label: "Follow detailed schedules and plans", trait: "C" },
      { value: "d", label: "Maintain consistent, sustainable routines", trait: "S" }
    ]
  },
  {
    id: 19,
    text: "In negotiations, I typically:",
    options: [
      { value: "a", label: "Push for what I want directly", trait: "D" },
      { value: "b", label: "Build rapport first, then discuss terms", trait: "I" },
      { value: "c", label: "Prepare thoroughly with data and facts", trait: "C" },
      { value: "d", label: "Seek win-win solutions for all parties", trait: "S" }
    ]
  },
  {
    id: 20,
    text: "My greatest strength in teams is:",
    options: [
      { value: "a", label: "Driving results and overcoming obstacles", trait: "D" },
      { value: "b", label: "Energizing others and building connections", trait: "I" },
      { value: "c", label: "Ensuring accuracy and maintaining standards", trait: "C" },
      { value: "d", label: "Creating stability and supporting teammates", trait: "S" }
    ]
  }
];

export default function DiscTest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [testMode, setTestMode] = useState<'selection' | 'quick' | 'standard'>('selection');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<Record<'D' | 'I' | 'S' | 'C', number>>({ D: 0, I: 0, S: 0, C: 0 });
  const [discResultId, setDiscResultId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const discQuestions = testMode === 'quick' ? quickDiscQuestions : standardDiscQuestions;

  const progress = ((currentQuestion + 1) / discQuestions.length) * 100;

  const handleAnswer = async (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Save individual answer to database
    if (discResultId && !isSaving) {
      setIsSaving(true);
      try {
        const question = discQuestions.find(q => q.id === questionId);
        const selectedOption = question?.options.find(opt => opt.value === value);
        
        if (selectedOption) {
          const { error } = await supabase
            .from('disc_answers')
            .upsert({
              user_id: user?.id,
              disc_result_id: discResultId,
              question_index: questionId,
              trait: selectedOption.trait,
              value: selectedOption.trait === 'D' ? 4 : selectedOption.trait === 'I' ? 3 : selectedOption.trait === 'S' ? 2 : 1
            });
          
          if (error) {
            console.error('Error saving answer:', error);
          }
        }
      } catch (error) {
        console.error('Error saving answer:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < discQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const scores: Record<'D' | 'I' | 'S' | 'C', number> = { D: 0, I: 0, S: 0, C: 0 };
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = discQuestions.find(q => q.id === parseInt(questionId));
      const selectedOption = question?.options.find(opt => opt.value === answer);
      if (selectedOption) {
        scores[selectedOption.trait]++;
      }
    });

    setResults(scores);
    setIsComplete(true);
    saveResults(scores);
  };

  const initializeDiscResult = async () => {
    if (!user) return;

    try {
      // Create or get existing DISC result record
      const { data: existingResult } = await supabase
        .from('disc_results')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingResult) {
        setDiscResultId(existingResult.id);
      } else {
        const { data: newResult, error } = await supabase
          .from('disc_results')
          .insert({
            user_id: user.id,
            status: 'in_progress'
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating DISC result:', error);
        } else {
          setDiscResultId(newResult.id);
        }
      }
    } catch (error) {
      console.error('Error initializing DISC result:', error);
    }
  };

  const saveResults = async (scores: Record<'D' | 'I' | 'S' | 'C', number>) => {
    if (!user) return;

    try {
      // Determine primary type (highest score)
      const primaryType = Object.entries(scores).reduce((a, b) => 
        scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
      )[0];

      const { error } = await supabase.functions.invoke('disc-complete', {
        body: {
          discType: primaryType,
          discScores: scores,
          discStatus: 'completed'
        }
      });

      if (error) {
        console.error('Error saving DISC results:', error);
        toast({
          title: "Warning",
          description: "Results calculated but couldn't save to your profile. You can retake the test if needed.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "DISC Assessment Complete!",
          description: `Your primary type is ${primaryType}. Results have been saved to your profile.`
        });
      }
    } catch (error) {
      console.error('Error saving DISC results:', error);
    }
  };

  const startTest = (mode: 'quick' | 'standard') => {
    setTestMode(mode);
    initializeDiscResult();
  };

  const getPrimaryType = () => {
    return Object.entries(results).reduce((a, b) => 
      results[a[0] as keyof typeof results] > results[b[0] as keyof typeof results] ? a : b
    )[0];
  };

  const getTypeDescription = (type: string) => {
    const descriptions = {
      D: "Dominant - You are direct, results-oriented, and enjoy taking charge.",
      I: "Influential - You are outgoing, enthusiastic, and people-focused.",
      S: "Steady - You are patient, reliable, and team-oriented.",
      C: "Conscientious - You are analytical, detail-oriented, and quality-focused."
    };
    return descriptions[type as keyof typeof descriptions] || "";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please sign in to take the DISC assessment.</p>
            <Button onClick={() => navigate('/auth')} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testMode === 'selection') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">DISC Personality Assessment</CardTitle>
            <p className="text-muted-foreground">
              Choose your preferred assessment length
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20" onClick={() => startTest('quick')}>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-primary mb-2">Quick Assessment</div>
                  <div className="text-sm text-muted-foreground mb-4">5 Questions • 2 minutes</div>
                  <p className="text-sm mb-4">
                    Get a basic understanding of your DISC profile with our streamlined assessment.
                  </p>
                  <Button className="w-full">Start Quick Test</Button>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20" onClick={() => startTest('standard')}>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-primary mb-2">Standard Assessment</div>
                  <div className="text-sm text-muted-foreground mb-4">20 Questions • 8 minutes</div>
                  <p className="text-sm mb-4">
                    Get a comprehensive, in-depth analysis of your personality profile with detailed insights.
                  </p>
                  <Button className="w-full">Start Standard Test</Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <Button variant="ghost" onClick={() => navigate('/agent-questionnaire')}>
                Return to Questionnaire
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">DISC Assessment Complete!</CardTitle>
              <p className="text-muted-foreground">Your personality profile has been analyzed</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{getPrimaryType()}</div>
                <p className="text-lg">{getTypeDescription(getPrimaryType())}</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Your Scores:</h3>
                {Object.entries(results).map(([type, score]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium">{type}: {getTypeDescription(type).split(' - ')[0]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(score / discQuestions.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{score}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Assessment Type: <span className="font-medium">{testMode === 'quick' ? 'Quick' : 'Standard'}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Questions Answered: {Object.keys(answers).length} of {discQuestions.length}
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => navigate('/agent-questionnaire')} className="flex-1">
                  Return to Questionnaire
                </Button>
                <Button variant="outline" onClick={() => setTestMode('selection')}>
                  Take Different Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQ = discQuestions[currentQuestion];
  const hasAnswered = answers[currentQ.id] !== undefined;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setTestMode('selection')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Change Test Type
            </Button>
            <div className="text-center">
              <div className="text-sm font-medium">
                {testMode === 'quick' ? 'Quick Assessment' : 'Standard Assessment'}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentQuestion + 1} of {discQuestions.length} questions
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </div>
          </div>
          <Progress value={progress} className="h-3" />
          {isSaving && (
            <div className="text-xs text-muted-foreground text-center mt-2">
              Saving answer...
            </div>
          )}
        </div>

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">DISC Personality Assessment</CardTitle>
              <p className="text-lg font-medium">{currentQ.text}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={answers[currentQ.id] || ""}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
              >
                {currentQ.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={option.value} id={`${currentQ.id}-${option.value}`} />
                    <Label 
                      htmlFor={`${currentQ.id}-${option.value}`} 
                      className="flex-1 cursor-pointer text-sm leading-relaxed"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!hasAnswered}
                >
                  {currentQuestion === discQuestions.length - 1 ? 'Complete Assessment' : 'Next Question'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}