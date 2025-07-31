import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, Building, Store } from "lucide-react";

export const LegalFooter = () => {
  return (
    <footer className="bg-muted/30 border-t mt-16">
      {/* Business Partners Section */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Are You a Business Partner?</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Join our marketplace as a service provider or co-marketing partner. 
              List your services and connect with real estate professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild variant="default" className="min-w-[200px]">
                <Link 
                  to="/vendor-registration?type=service_provider"
                  onClick={() => {
                    console.log('Clicked List Your Services button');
                    window.scrollTo(0, 0);
                  }}
                >
                  <Store className="w-4 h-4 mr-2" />
                  List Your Services
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-w-[200px]">
                <Link 
                  to="/vendor-registration?type=co_marketing"
                  onClick={() => console.log('Clicked Co-Marketing Partner button')}
                >
                  <Building className="w-4 h-4 mr-2" />
                  Join as Co-Marketing Partner
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
            <h4 className="font-semibold mb-3 text-sm">Legal</h4>
            <div className="space-y-2">
              <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary">
                Terms of Service
              </Link>
              <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="block text-sm text-muted-foreground hover:text-primary">
                Cookie Policy
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-sm text-muted-foreground hover:text-primary text-left">
                    Compliance Info
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
            <h4 className="font-semibold mb-3 text-sm">Marketplace</h4>
            <div className="space-y-2">
              <Link to="/seller-agreement" className="block text-sm text-muted-foreground hover:text-primary">
                Seller Agreement
              </Link>
              <Link to="/buyer-protection" className="block text-sm text-muted-foreground hover:text-primary">
                Buyer Protection
              </Link>
              <Link to="/prohibited-items" className="block text-sm text-muted-foreground hover:text-primary">
                Prohibited Items
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">Support</h4>
            <div className="space-y-2">
              <Link to="/dispute-resolution" className="block text-sm text-muted-foreground hover:text-primary">
                Dispute Resolution
              </Link>
              <Link to="/refund-policy" className="block text-sm text-muted-foreground hover:text-primary">
                Refund Policy
              </Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary">
                Contact Support
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">Security</h4>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                SSL Secured
              </Badge>
              <Badge variant="outline" className="text-xs">
                PCI Compliant
              </Badge>
              <p className="text-xs text-muted-foreground">
                256-bit encryption
              </p>
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Marketplace Disclaimer */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Marketplace Disclaimer:</strong> CircleMarketplace.io is a venue for buyers and sellers. 
            We are not responsible for the content, quality, or legality of items listed, the ability of sellers 
            to sell items, or the ability of buyers to pay for items. We do not guarantee the accuracy or 
            completeness of any listing.
          </p>
        </div>
        
        {/* Compliance Statements */}
        <div className="mb-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>Age Restriction:</strong> You must be 18 years or older to use this marketplace.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Geographic Restrictions:</strong> Available only where permitted by law.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Tax Disclaimer:</strong> Buyers and sellers are responsible for determining and paying applicable taxes.
          </p>
        </div>
        
        {/* Additional Protection Clauses */}
        <div className="mb-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>Indemnification Notice:</strong> Users agree to indemnify and hold CircleMarketplace.io 
            harmless from any claims arising from their use of the platform.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>As-Is Disclaimer:</strong> This platform is provided "as is" without warranties of any kind, 
            either express or implied.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>User-Generated Content:</strong> Users are solely responsible for content they post. 
            We reserve the right to remove content that violates our policies.
          </p>
        </div>
        
        <Separator className="my-6" />
        

        {/* Copyright and Final Info */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2025 CircleMarketplace.io. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs text-muted-foreground">
              Payments secured by industry-leading providers
            </span>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="text-xs">
                Secure
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};