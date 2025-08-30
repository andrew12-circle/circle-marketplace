// @ts-nocheck
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export const PaymentCanceled = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-8">
              <XCircle className="w-16 h-16 text-orange-600 mx-auto mb-6" />
              
              <h1 className="text-3xl font-bold text-orange-800 mb-4">
                Payment Canceled
              </h1>
              
              <p className="text-lg text-orange-700 mb-6">
                Your payment was canceled and no charges were made. Your items are still in your cart.
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-6 border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">Need Help?</h3>
                <p className="text-sm text-orange-700">
                  If you encountered any issues during checkout or have questions about our services, 
                  please contact our support team.
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link to="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Marketplace
                  </Link>
                </Button>
                
                <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};