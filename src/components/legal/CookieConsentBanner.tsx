import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  hasGivenConsent,
  respectsDoNotTrack,
  setConsentPreferences,
  acceptAllConsent,
  getDefaultConsent,
  getConsentPreferences,
  type CookieConsent
} from "@/lib/consent";

export const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>(() => 
    getConsentPreferences() || getDefaultConsent()
  );

  useEffect(() => {
    // Don't show banner if user has already given consent or has Do Not Track enabled
    if (hasGivenConsent() || respectsDoNotTrack()) {
      return;
    }

    // Show banner after a short delay to avoid disrupting initial page load
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptAll = () => {
    const consent = acceptAllConsent();
    setConsentPreferences(consent);
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const consent = getDefaultConsent();
    setConsentPreferences(consent);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    setConsentPreferences({
      ...preferences,
      timestamp: new Date().toISOString(),
    });
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handlePreferenceChange = (type: keyof CookieConsent, value: boolean) => {
    if (type === 'necessary') return; // Always required
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Cookie className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  We use cookies to enhance your experience
                </p>
                <p className="text-xs text-muted-foreground">
                  We use cookies and similar technologies to track usage, personalize content, and analyze performance. 
                  By continuing to browse, you consent to our use of cookies.{" "}
                  <Link 
                    to="/legal/cookies" 
                    className="text-primary hover:underline"
                    onClick={() => setShowBanner(false)}
                  >
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Preferences
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

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAcceptNecessary}
              >
                Accept Necessary Only
              </Button>
              
              <Button size="sm" onClick={handleAcceptAll}>
                Accept All
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowBanner(false)}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};