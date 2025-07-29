import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, RefreshCw, Clock, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export const BuyerProtection = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Buyer Protection</h1>
          <p className="text-muted-foreground mt-2">Your purchases are protected</p>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary">Protected</Badge>
                </div>
                <h3 className="font-semibold">Purchase Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Every purchase is covered by our comprehensive protection policy
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary">30 Days</Badge>
                </div>
                <h3 className="font-semibold">Easy Returns</h3>
                <p className="text-sm text-muted-foreground">
                  Return most items within 30 days for a full refund
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <Badge variant="secondary">24/7</Badge>
                </div>
                <h3 className="font-semibold">Support</h3>
                <p className="text-sm text-muted-foreground">
                  Round-the-clock customer support for all issues
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <Badge variant="secondary">Secure</Badge>
                </div>
                <h3 className="font-semibold">Safe Payments</h3>
                <p className="text-sm text-muted-foreground">
                  All payments processed through secure, encrypted channels
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CircleMarketplace.io Buyer Protection Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>What's Covered</h2>
            <p>Our Buyer Protection covers:</p>
            <ul>
              <li><strong>Item Not Received:</strong> Full refund if your item doesn't arrive</li>
              <li><strong>Significantly Not as Described:</strong> Refund if item differs substantially from listing</li>
              <li><strong>Damaged in Transit:</strong> Protection for items damaged during shipping</li>
              <li><strong>Counterfeit Items:</strong> Full refund for authentic items sold as genuine</li>
            </ul>

            <h2>How to File a Claim</h2>
            <ol>
              <li><strong>Contact the Seller:</strong> Try to resolve the issue directly first</li>
              <li><strong>Wait 3 Business Days:</strong> Allow time for seller response</li>
              <li><strong>Open a Case:</strong> Submit a protection claim through your account</li>
              <li><strong>Provide Evidence:</strong> Upload photos, tracking info, or other documentation</li>
              <li><strong>Resolution:</strong> We'll review and resolve within 5-7 business days</li>
            </ol>

            <h2>Timeframes</h2>
            <ul>
              <li><strong>Item Not Received:</strong> 30 days after estimated delivery date</li>
              <li><strong>Item Not as Described:</strong> 30 days after delivery confirmation</li>
              <li><strong>Damaged Items:</strong> 7 days after delivery confirmation</li>
              <li><strong>Digital Products:</strong> 14 days after purchase</li>
            </ul>

            <h2>Return Process</h2>
            <p>For eligible returns:</p>
            <ul>
              <li>Contact seller within return window</li>
              <li>Receive return authorization and shipping label</li>
              <li>Package item securely in original packaging when possible</li>
              <li>Ship using provided label or approved method</li>
              <li>Refund processed within 3-5 business days after receipt</li>
            </ul>

            <h2>Refund Methods</h2>
            <p>Refunds are issued to:</p>
            <ul>
              <li><strong>Original Payment Method:</strong> Credit card, PayPal, etc.</li>
              <li><strong>Platform Credit:</strong> Instant credit for future purchases</li>
              <li><strong>Store Credit:</strong> For specific seller issues</li>
            </ul>

            <h2>Exclusions</h2>
            <p>Protection does not cover:</p>
            <ul>
              <li>Buyer's remorse or change of mind</li>
              <li>Items damaged due to misuse</li>
              <li>Custom or personalized items (unless defective)</li>
              <li>Digital downloads after successful delivery</li>
              <li>Services already performed</li>
            </ul>

            <h2>Prevention Tips</h2>
            <p>To avoid issues:</p>
            <ul>
              <li>Read item descriptions and seller policies carefully</li>
              <li>Check seller ratings and reviews</li>
              <li>Ask questions before purchasing</li>
              <li>Save all communication with sellers</li>
              <li>Track your shipments</li>
            </ul>

            <h2>Dispute Resolution</h2>
            <p>
              If you're not satisfied with our initial decision, you can appeal within 10 days.
              Appeals are reviewed by a senior team member and decided within 5 business days.
            </p>

            <h2>Contact Buyer Protection</h2>
            <p>
              For questions about buyer protection or to file a claim, contact us at
              buyer-protection@circlemarketplace.io or use the "Report an Issue" button
              in your order history.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};