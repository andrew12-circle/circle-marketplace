import { useNavigate } from "react-router-dom";
import AgentQuestionnaire from "@/components/AgentQuestionnaire";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AgentQuestionnairePage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleComplete = async (data: any) => {
    console.log('Questionnaire completed:', data);
    // Refresh profile to update the UI state immediately
    await refreshProfile();
    // Navigate to results or dashboard
    navigate('/', { 
      state: { 
        message: 'Questionnaire completed! Your personalized recommendations are being generated.' 
      }
    });
  };

  const handleGoBack = () => {
    console.log('Back button clicked, history length:', window.history.length);
    try {
      navigate('/');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-4"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <AgentQuestionnaire onComplete={handleComplete} />
      </div>
    </div>
  );
}