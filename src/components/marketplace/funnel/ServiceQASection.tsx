import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServiceQASectionProps {
  service: any;
  vendor: any;
}

export const ServiceQASection = ({ service, vendor }: ServiceQASectionProps) => {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Mock Q&A data - this would come from the database
  const qaItems = [
    {
      id: 1,
      question: "What is your typical turnaround time for this service?",
      answer: "Our standard turnaround time is 2-4 weeks depending on project complexity. We provide detailed timelines during the initial consultation.",
      agent_name: "Jennifer Martinez",
      is_featured: true,
      created_at: "2024-01-10",
      helpful_count: 12
    },
    {
      id: 2,
      question: "Do you offer any guarantees on your work?",
      answer: "Yes, we provide a 30-day satisfaction guarantee and will work with you to make any necessary adjustments at no additional cost.",
      agent_name: "Robert Kim",
      is_featured: true,
      created_at: "2024-01-08",
      helpful_count: 8
    },
    {
      id: 3,
      question: "Can this service be customized for specific market conditions?",
      answer: "Absolutely! We tailor our approach based on your local market conditions, target demographics, and specific business goals.",
      agent_name: "Amanda Foster",
      is_featured: false,
      created_at: "2024-01-05",
      helpful_count: 5
    }
  ];

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;

    setIsSubmitting(true);
    try {
      // For now, we'll simulate the API call since vendor_qa table may not exist yet
      // TODO: Uncomment when vendor_qa table is available
      /*
      const { error } = await supabase
        .from('vendor_qa')
        .insert({
          vendor_id: vendor.id,
          question: newQuestion.trim()
        });

      if (error) throw error;
      */

      toast({
        title: "Question submitted",
        description: "Your question has been sent to the vendor and will be answered soon.",
      });

      setNewQuestion("");
      setShowQuestionForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Questions & Answers
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionForm(!showQuestionForm)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ask Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Question Form */}
            {showQuestionForm && (
              <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                <h4 className="font-medium mb-3">Ask a Question</h4>
                <Textarea
                  placeholder="What would you like to know about this service?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitQuestion}
                    disabled={!newQuestion.trim() || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Question"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowQuestionForm(false);
                      setNewQuestion("");
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Q&A List */}
            <div className="space-y-6">
              {qaItems.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-medium text-primary">Q</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{item.question}</h4>
                        {item.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Asked by {item.agent_name} on {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {item.answer && (
                    <div className="flex items-start gap-3 ml-11">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm font-medium text-accent">A</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground leading-relaxed mb-2">
                          {item.answer}
                        </p>
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                            <ThumbsUp className="h-3 w-3" />
                            <span className="text-xs">{item.helpful_count}</span>
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Answered by {vendor.business_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {item.id !== qaItems[qaItems.length - 1].id && (
                    <hr className="border-border" />
                  )}
                </div>
              ))}
            </div>

            {qaItems.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-2">No questions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to ask a question about this service.
                </p>
                <Button onClick={() => setShowQuestionForm(true)}>
                  Ask the First Question
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};