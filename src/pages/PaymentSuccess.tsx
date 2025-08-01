import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Download } from "lucide-react";

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading state
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circle-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
              
              <h1 className="text-3xl font-bold text-green-800 mb-4">
                Payment Successful!
              </h1>
              
              <p className="text-lg text-green-700 mb-6">
                Thank you for your purchase. Your payment has been processed successfully.
              </p>
              
              {sessionId && (
                <div className="bg-white rounded-lg p-4 mb-6 border border-green-200">
                  <p className="text-sm text-muted-foreground mb-2">Order Reference:</p>
                  <p className="font-mono text-sm break-all">{sessionId}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    🚀 Skip the Sales Process!
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1 text-left">
                    <li>• No sales calls needed - your service is ready for setup</li>
                    <li>• Book directly with the implementation team</li>
                    <li>• Get started with onboarding immediately</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
                  <ul className="text-sm text-green-700 space-y-1 text-left">
                    <li>• Schedule your onboarding session below</li>
                    <li>• You'll receive a confirmation email shortly</li>
                    <li>• Check your Circle dashboard for updates</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Link to="/marketplace">
                      📅 Book Onboarding Session
                    </Link>
                  </Button>
                  
                  <div className="flex gap-4 justify-center">
                    <Button asChild variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      <Link to="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Marketplace
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};