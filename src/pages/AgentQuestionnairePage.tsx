import { useNavigate } from "react-router-dom";
import AgentQuestionnaire from "@/components/AgentQuestionnaire";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AgentQuestionnairePage() {
  const navigate = useNavigate();

  const handleComplete = (data: any) => {
    console.log('Questionnaire completed:', data);
    // Navigate to results or dashboard
    navigate('/', { 
      state: { 
        message: 'Questionnaire completed! Your personalized recommendations are being generated.' 
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>

        <AgentQuestionnaire onComplete={handleComplete} />
      </div>
    </div>
  );
}