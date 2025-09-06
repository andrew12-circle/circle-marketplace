import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";
import { useAdvisorScript, Question } from "@/hooks/useAdvisorScript";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AdvisorScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const FAQ_ITEMS = [
  {
    question: "What happens next?",
    answer: "You'll get a personalized growth plan with specific tool recommendations and ROI estimates. No commitments required."
  },
  {
    question: "Do I pay anything right now?",
    answer: "Absolutely not. This consultation and plan are completely free. You only pay if you choose to purchase recommended services."
  },
  {
    question: "Can I talk to a person?",
    answer: "Yes! After your digital plan, you can book a call with one of our real estate growth advisors for personalized guidance."
  }
];

export const AdvisorScriptModal = ({ open, onOpenChange, onComplete }: AdvisorScriptModalProps) => {
  const {
    responses,
    getCurrentStep,
    getTotalSteps,
    isComplete,
    setResponse,
    getAllQuestions
  } = useAdvisorScript();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const allQuestions = getAllQuestions();
  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = (getCurrentStep() / getTotalSteps()) * 100;

  const handleAnswer = async (value: any) => {
    await setResponse(currentQuestion.id, value);
    
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Complete - generate plan
      onComplete();
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const currentValue = responses[question.id];

    switch (question.type) {
      case 'number':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Enter number"
              value={currentValue || ''}
              onChange={(e) => setResponse(question.id, parseInt(e.target.value) || 0)}
              className="text-center text-lg"
            />
            {currentValue && (
              <div className="flex justify-center">
                <Button onClick={() => handleAnswer(currentValue)}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <Button
                key={option}
                variant={currentValue === option ? "default" : "outline"}
                className="w-full justify-start text-left h-auto p-4"
                onClick={() => handleAnswer(option)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="capitalize">{option.replace(/_/g, ' ')}</span>
                  {currentValue === option && <CheckCircle2 className="h-4 w-4" />}
                </div>
              </Button>
            ))}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Type your answer"
              value={currentValue || ''}
              onChange={(e) => setResponse(question.id, e.target.value)}
            />
            {currentValue && (
              <div className="flex justify-center">
                <Button onClick={() => handleAnswer(currentValue)}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Growth Planning Session</DialogTitle>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" side="left">
                  <div className="space-y-3">
                    <div className="font-medium text-sm">Frequently Asked</div>
                    {FAQ_ITEMS.map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="font-medium text-xs">{item.question}</div>
                        <div className="text-xs text-muted-foreground">{item.answer}</div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestionIndex + 1} of {allQuestions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-lg font-medium">{currentQuestion.prompt}</Label>
                  </div>
                  
                  {renderQuestionInput(currentQuestion)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Save & Resume Later
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};