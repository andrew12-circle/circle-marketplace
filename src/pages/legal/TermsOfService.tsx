import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: January 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CircleMarketplace.io Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using CircleMarketplace.io, you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our platform.
            </p>

            <h2>2. User Responsibilities</h2>
            <p>Users are responsible for:</p>
            <ul>
              <li>Providing accurate and truthful information</li>
              <li>Maintaining the security of their account credentials</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Respecting the rights of other users</li>
            </ul>

            <h2>3. Prohibited Activities</h2>
            <p>The following activities are strictly prohibited:</p>
            <ul>
              <li>Listing illegal, counterfeit, or stolen items</li>
              <li>Engaging in fraudulent or deceptive practices</li>
              <li>Violating intellectual property rights</li>
              <li>Harassing or threatening other users</li>
              <li>Attempting to circumvent security measures</li>
            </ul>

            <h2>4. Intellectual Property Rights</h2>
            <p>
              All content on CircleMarketplace.io, including but not limited to text, graphics, logos, and software,
              is the property of CircleMarketplace.io or its licensors and is protected by copyright and other
              intellectual property laws.
            </p>

            <h2>5. Limitation of Liability</h2>
            <p>
              CircleMarketplace.io shall not be liable for any direct, indirect, incidental, special, or consequential
              damages resulting from the use or inability to use our platform.
            </p>

            <h2>6. Dispute Resolution</h2>
            <p>
              Any disputes arising from these terms shall be resolved through binding arbitration in accordance
              with the rules of the American Arbitration Association.
            </p>

            <h2>7. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Users will be notified of significant changes
              via email or platform notification.
            </p>

            <h2>8. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at legal@circlemarketplace.io
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};