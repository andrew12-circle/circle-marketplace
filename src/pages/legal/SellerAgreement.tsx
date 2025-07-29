import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const SellerAgreement = () => {
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
          <h1 className="text-3xl font-bold">Seller Agreement</h1>
          <p className="text-muted-foreground mt-2">Last updated: January 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CircleMarketplace.io Seller Agreement</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>1. Seller Eligibility</h2>
            <p>To become a seller on CircleMarketplace.io, you must:</p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>Provide accurate business and personal information</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Have the legal right to sell the items you list</li>
            </ul>

            <h2>2. Listing Requirements</h2>
            <p>All listings must:</p>
            <ul>
              <li>Contain accurate and truthful descriptions</li>
              <li>Include clear, high-quality images</li>
              <li>Specify correct pricing and availability</li>
              <li>Comply with our prohibited items policy</li>
            </ul>

            <h2>3. Seller Fees</h2>
            <p>CircleMarketplace.io charges the following fees:</p>
            <ul>
              <li><strong>Listing Fee:</strong> Free for basic listings</li>
              <li><strong>Transaction Fee:</strong> 3.5% + $0.30 per successful sale</li>
              <li><strong>Payment Processing:</strong> 2.9% + $0.30 per transaction</li>
              <li><strong>Premium Features:</strong> Additional fees may apply for enhanced visibility</li>
            </ul>

            <h2>4. Order Fulfillment</h2>
            <p>Sellers are responsible for:</p>
            <ul>
              <li>Processing orders within 1-2 business days</li>
              <li>Providing accurate shipping information</li>
              <li>Packaging items securely and professionally</li>
              <li>Communicating with buyers about order status</li>
            </ul>

            <h2>5. Customer Service</h2>
            <p>Sellers must:</p>
            <ul>
              <li>Respond to buyer inquiries within 24 hours</li>
              <li>Handle returns and refunds according to stated policies</li>
              <li>Maintain professional communication</li>
              <li>Resolve disputes in good faith</li>
            </ul>

            <h2>6. Performance Standards</h2>
            <p>Sellers are expected to maintain:</p>
            <ul>
              <li>Order defect rate below 1%</li>
              <li>Late shipment rate below 4%</li>
              <li>Customer satisfaction rating above 95%</li>
              <li>Response time under 24 hours</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>Sellers warrant that:</p>
            <ul>
              <li>They own or have permission to sell all listed items</li>
              <li>Items do not infringe on third-party intellectual property rights</li>
              <li>Product descriptions and images are original or properly licensed</li>
            </ul>

            <h2>8. Account Suspension</h2>
            <p>Accounts may be suspended for:</p>
            <ul>
              <li>Violation of platform policies</li>
              <li>Poor performance metrics</li>
              <li>Customer complaints or disputes</li>
              <li>Suspicious or fraudulent activity</li>
            </ul>

            <h2>9. Payment Terms</h2>
            <p>Seller payouts are processed:</p>
            <ul>
              <li>Weekly for established sellers</li>
              <li>Bi-weekly for new sellers (first 90 days)</li>
              <li>After a 3-day clearing period</li>
              <li>Minus applicable fees and reserves</li>
            </ul>

            <h2>10. Termination</h2>
            <p>
              Either party may terminate this agreement with 30 days notice. Upon termination,
              sellers must fulfill existing orders and may not create new listings.
            </p>

            <h2>Contact Support</h2>
            <p>
              For seller support questions, contact us at seller-support@circlemarketplace.io
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};