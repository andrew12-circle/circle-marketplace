
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
// @ts-nocheck
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LegalFooter } from "@/components/LegalFooter";
import { RealtorView } from "@/components/command-center/RealtorView";
import { GoalAssessmentModal } from "@/components/marketplace/GoalAssessmentModal";
import { ArrowLeft, Shield, Target } from "lucide-react";
import { useState, useEffect } from "react";

const CommandCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGoalAssessmentOpen, setIsGoalAssessmentOpen] = useState(false);

  // Check for hash navigation to goals section
  useEffect(() => {
    if (window.location.hash === '#goals') {
      setIsGoalAssessmentOpen(true);
    }
  }, []);

  // Require authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to access the Command Center
            </p>
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button & Page Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Command Center</h1>
          <p className="text-muted-foreground">
            Deep performance analytics and agent tracking system
          </p>
        </div>

        {/* Goals Section */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Business Goals
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Set and track your business objectives to get personalized AI recommendations
                  </p>
                </div>
                <Button
                  onClick={() => setIsGoalAssessmentOpen(true)}
                  variant="outline"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Edit Goals
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Dashboard */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Self Performance Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Comprehensive view of your transaction history, performance metrics, and professional network
          </p>
        </div>
        <RealtorView />
      </div>

      <LegalFooter />
      
      {/* Goal Assessment Modal */}
      <GoalAssessmentModal
        open={isGoalAssessmentOpen}
        onOpenChange={setIsGoalAssessmentOpen}
        onComplete={() => {
          setIsGoalAssessmentOpen(false);
        }}
      />
    </div>
  );
};

export default CommandCenter;
