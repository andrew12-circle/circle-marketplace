
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LegalFooter } from "@/components/LegalFooter";
import { RealtorView } from "@/components/command-center/RealtorView";
import { ArrowLeft, Shield } from "lucide-react";

const CommandCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    </div>
  );
};

export default CommandCenter;
