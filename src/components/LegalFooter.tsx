
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info, Building, Store, Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  getConsentPreferences, 
  setConsentPreferences, 
  getDefaultConsent,
  type CookieConsent 
} from "@/lib/consent";

export const LegalFooter = () => {
  const { t } = useTranslation();
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
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
    setShowCookiePreferences(false);
  };

  return (
    <footer className="bg-muted/30 border-t mt-16">
      {/* Business Partners Section */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.businessPartnersTitle')}</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {t('footer.businessPartnersDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild variant="default" className="min-w-[200px]">
                <Link 
                  to="/vendor-registration?type=service_provider"
                  onClick={() => {
                    window.scrollTo(0, 0);
                  }}
                >
                  <Store className="w-4 h-4 mr-2" />
                  {t('footer.listYourServices')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-w-[200px]">
                <Link 
                  to="/vendor-registration?type=co_marketing"
                  onClick={() => {
                    window.scrollTo(0, 0);
                  }}
                >
                  <Building className="w-4 h-4 mr-2" />
                  {t('footer.joinCoMarketing')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Links Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('footer.legal')}</h4>
            <div className="space-y-2">
              <Link to="/legal/terms" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.termsOfService')}
              </Link>
              <Link to="/legal/privacy" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.privacyPolicy')}
              </Link>
              <Link to="/legal/cookies" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.cookiePolicy')}
              </Link>
              <Dialog open={showCookiePreferences} onOpenChange={setShowCookiePreferences}>
                <DialogTrigger asChild>
                  <button className="text-sm text-muted-foreground hover:text-primary text-left">
                    {t('footer.cookiePreferences')}
                  </button>
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
                      onClick={() => setShowCookiePreferences(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSavePreferences}>
                      Save Preferences
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-sm text-muted-foreground hover:text-primary text-left">
                    {t('footer.complianceInfo')}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>RESPA Compliance Statement</DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed pt-4">
                      CircleMarketplace.io facilitates connections for RESPA-compliant joint advertising only. 
                      We do not facilitate co-payment arrangements for CRM systems, lead generation tools, or 
                      other business operations platforms. All co-marketing must involve true advertising with 
                      proportional benefit to all parties.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('footer.marketplace')}</h4>
            <div className="space-y-2">
              <Link to="/legal/seller-agreement" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.sellerAgreement')}
              </Link>
              <Link to="/legal/buyer-protection" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.buyerProtection')}
              </Link>
              <Link to="/legal/prohibited-items" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.prohibitedItems')}
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('footer.support')}</h4>
            <div className="space-y-2">
              <Link to="/ministry" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.circleMinistry')}
              </Link>
              <Link to="/affiliate" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.affiliateProgram')}
              </Link>
              <Link to="/dispute-resolution" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.disputeResolution')}
              </Link>
              <Link to="/refund-policy" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.refundPolicy')}
              </Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary">
                {t('footer.contactSupport')}
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('footer.security')}</h4>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                {t('footer.sslSecured')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {t('footer.pciCompliant')}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {t('footer.encryption')}
              </p>
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Marketplace Disclaimer */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>{t('footer.marketplaceDisclaimer')}</strong> {t('footer.disclaimerText')}
          </p>
        </div>
        
        {/* Compliance Statements */}
        <div className="mb-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>{t('footer.ageRestriction')}</strong> {t('footer.ageRestrictionText')}
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>{t('footer.geoRestrictions')}</strong> {t('footer.geoRestrictionsText')}
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>{t('footer.taxDisclaimer')}</strong> {t('footer.taxDisclaimerText')}
          </p>
        </div>
        
        {/* Additional Protection Clauses */}
        <div className="mb-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>{t('footer.indemnificationNotice')}</strong> {t('footer.indemnificationText')}
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>{t('footer.asIsDisclaimer')}</strong> {t('footer.asIsText')}
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>{t('footer.userGeneratedContent')}</strong> {t('footer.userGeneratedContentText')}
          </p>
        </div>
        
        <Separator className="my-6" />
        

        {/* Copyright and Final Info */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            {t('footer.copyright')}
          </p>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs text-muted-foreground">
              {t('footer.paymentsSecured')}
            </span>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="text-xs">
                {t('footer.secure')}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {t('footer.verified')}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
