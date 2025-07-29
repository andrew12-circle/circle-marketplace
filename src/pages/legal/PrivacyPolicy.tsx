import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: January 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CircleMarketplace.io Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number, payment information</li>
              <li><strong>Account Information:</strong> Username, password, profile details</li>
              <li><strong>Transaction Data:</strong> Purchase history, seller ratings, communication records</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, usage analytics</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>Your information is used to:</p>
            <ul>
              <li>Provide and maintain our marketplace services</li>
              <li>Process transactions and payments</li>
              <li>Communicate about orders, updates, and support</li>
              <li>Improve our platform and user experience</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Cookie Usage</h2>
            <p>We use cookies and similar technologies for:</p>
            <ul>
              <li>Essential site functionality</li>
              <li>User authentication and security</li>
              <li>Analytics and performance monitoring</li>
              <li>Personalized content and recommendations</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Other Users:</strong> Public profile information, ratings, and reviews</li>
              <li><strong>Service Providers:</strong> Payment processors, shipping companies, customer support</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and comply
              with legal obligations. Account information is typically retained for 7 years after account closure.
            </p>

            <h2>6. Your Rights (GDPR/CCPA Compliance)</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your personal information</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>

            <h2>7. Security Measures</h2>
            <p>
              We implement industry-standard security measures including encryption, secure servers,
              and regular security audits to protect your personal information.
            </p>

            <h2>8. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Our platform is not intended for users under 18 years of age. We do not knowingly collect
              personal information from children under 18.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us at privacy@circlemarketplace.io
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};