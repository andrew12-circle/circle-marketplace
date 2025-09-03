import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  getConsentPreferences, 
  setConsentPreferences, 
  clearConsentPreferences,
  getDefaultConsent,
  type CookieConsent 
} from "@/lib/consent";

export const CookiePolicy = () => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>(() => 
    getConsentPreferences() || getDefaultConsent()
  );

  const handlePreferenceChange = (type: keyof CookieConsent, value: boolean) => {
    if (type === 'necessary') return; // Always required
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSavePreferences = () => {
    setConsentPreferences({
      ...preferences,
      timestamp: new Date().toISOString(),
    });
    setShowPreferences(false);
  };

  const handleClearPreferences = () => {
    clearConsentPreferences();
    setPreferences(getDefaultConsent());
    setShowPreferences(false);
  };

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
              <li><strong>Cookie Consent Tool:</strong> Use our cookie preference center below</li>
              <li><strong>Opt-out Links:</strong> Visit third-party websites to opt out directly</li>
            </ul>

            <div className="my-6">
              <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Cookie Preferences
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Cookie Preferences</DialogTitle>
                    <DialogDescription>
                      Choose which cookies you want to accept. Some cookies are necessary for the site to function properly.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      {/* Necessary Cookies */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <Label className="text-sm font-medium">Necessary Cookies</Label>
                          <p className="text-xs text-muted-foreground">
                            Required for authentication, security, and basic site functionality. Cannot be disabled.
                          </p>
                        </div>
                        <Switch 
                          checked={preferences.necessary} 
                          disabled={true}
                        />
                      </div>

                      {/* Analytics Cookies */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <Label className="text-sm font-medium">Analytics Cookies</Label>
                          <p className="text-xs text-muted-foreground">
                            Help us understand how visitors use our website to improve performance and user experience.
                          </p>
                        </div>
                        <Switch 
                          checked={preferences.analytics}
                          onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                        />
                      </div>

                      {/* Functional Cookies */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <Label className="text-sm font-medium">Functional Cookies</Label>
                          <p className="text-xs text-muted-foreground">
                            Enable personalized features and remember your preferences for a better experience.
                          </p>
                        </div>
                        <Switch 
                          checked={preferences.functional}
                          onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                        />
                      </div>

                      {/* Marketing Cookies */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <Label className="text-sm font-medium">Marketing Cookies</Label>
                          <p className="text-xs text-muted-foreground">
                            Used to deliver relevant advertisements and track affiliate referrals.
                          </p>
                        </div>
                        <Switch 
                          checked={preferences.marketing}
                          onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleClearPreferences}
                    >
                      Clear All Preferences
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPreferences(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSavePreferences}>
                      Save Preferences
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

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