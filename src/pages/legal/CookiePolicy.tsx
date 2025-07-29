import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const CookiePolicy = () => {
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
          <h1 className="text-3xl font-bold">Cookie Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: January 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CircleMarketplace.io Cookie Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>What Are Cookies</h2>
            <p>
              Cookies are small text files that are stored on your device when you visit our website.
              They help us provide you with a better experience and allow certain features to work properly.
            </p>

            <h2>Types of Cookies We Use</h2>
            
            <h3>Essential Cookies</h3>
            <p>These cookies are necessary for the website to function properly:</p>
            <ul>
              <li><strong>Authentication:</strong> Keep you logged in during your session</li>
              <li><strong>Security:</strong> Protect against fraud and maintain site security</li>
              <li><strong>Shopping Cart:</strong> Remember items in your cart</li>
            </ul>

            <h3>Analytics Cookies</h3>
            <p>These help us understand how visitors use our website:</p>
            <ul>
              <li><strong>Usage Statistics:</strong> Track page views and user interactions</li>
              <li><strong>Performance Monitoring:</strong> Identify technical issues</li>
              <li><strong>Conversion Tracking:</strong> Measure the effectiveness of our services</li>
            </ul>

            <h3>Functional Cookies</h3>
            <p>These enhance your experience on our website:</p>
            <ul>
              <li><strong>Preferences:</strong> Remember your language and display settings</li>
              <li><strong>Location:</strong> Provide location-based services</li>
              <li><strong>Personalization:</strong> Customize content based on your interests</li>
            </ul>

            <h3>Marketing Cookies</h3>
            <p>These are used to deliver relevant advertisements:</p>
            <ul>
              <li><strong>Targeted Advertising:</strong> Show ads relevant to your interests</li>
              <li><strong>Social Media:</strong> Enable sharing on social platforms</li>
              <li><strong>Retargeting:</strong> Show relevant ads on other websites</li>
            </ul>

            <h2>Third-Party Cookies</h2>
            <p>We may allow third-party services to set cookies on our website:</p>
            <ul>
              <li><strong>Payment Processors:</strong> Stripe, PayPal for secure transactions</li>
              <li><strong>Analytics Services:</strong> Google Analytics for website performance</li>
              <li><strong>Customer Support:</strong> Live chat and support tools</li>
              <li><strong>Social Media:</strong> Facebook, Twitter, LinkedIn widgets</li>
            </ul>

            <h2>Managing Your Cookie Preferences</h2>
            <p>You can control cookies in several ways:</p>
            <ul>
              <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
              <li><strong>Cookie Consent Tool:</strong> Use our cookie preference center</li>
              <li><strong>Opt-out Links:</strong> Visit third-party websites to opt out directly</li>
            </ul>

            <h2>Cookie Retention</h2>
            <p>Different cookies have different lifespans:</p>
            <ul>
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain for a set period (usually 30 days to 2 years)</li>
              <li><strong>Essential Cookies:</strong> Kept for the duration of your session or login period</li>
            </ul>

            <h2>Impact of Disabling Cookies</h2>
            <p>
              If you disable cookies, some features of our website may not work properly:
            </p>
            <ul>
              <li>You may need to log in repeatedly</li>
              <li>Your shopping cart may not retain items</li>
              <li>Personalized features may not be available</li>
              <li>Some pages may load more slowly</li>
            </ul>

            <h2>Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. We will notify you of any significant
              changes by posting the new policy on this page with an updated "Last updated" date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at privacy@circlemarketplace.io
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};