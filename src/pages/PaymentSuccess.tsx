
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, ArrowRight } from "lucide-react";
import { useFunnelEvents } from "@/hooks/useFunnelEvents";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { trackCheckoutCompleted, trackSubscriptionActive } = useFunnelEvents();
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!tracked) {
      trackCheckoutCompleted();
      // Also track subscription as active since payment was successful
      trackSubscriptionActive();
      setTracked(true);
    }
  }, [trackCheckoutCompleted, trackSubscriptionActive, tracked]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Circle Pro!
              </CardTitle>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Crown className="w-4 h-4 mr-1" />
                30-Day Free Trial Active
              </Badge>
            </CardHeader>

            <CardContent className="text-center">
              <p className="text-lg text-gray-600 mb-6">
                Your subscription has been successfully set up! You now have access to all Circle Pro features during your 30-day free trial.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
                <ul className="text-left text-blue-800 space-y-2">
                  <li className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                    Explore the marketplace for vendor partnerships
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                    Set up your first co-pay request
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                    Access your Command Center dashboard
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                    Browse agent playbooks in the Academy
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate("/marketplace")}
                >
                  Explore Marketplace
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                Your trial will automatically convert to a paid subscription after 30 days. 
                You can cancel anytime from your account settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
