import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";

export const LegalFooter = () => {
  return (
    <footer className="bg-muted/30 border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Company Information */}
        <div className="mb-8 text-center">
          <h3 className="font-bold text-lg mb-2">CircleMarketplace.io</h3>
          <p className="text-sm text-muted-foreground">A Division of Circle Consulting LLC</p>
          <p className="text-sm text-muted-foreground">501 Union St. Ste 545 #651315</p>
          <p className="text-sm text-muted-foreground">Nashville, TN 37219</p>
        </div>

        <Separator className="my-6" />

        {/* Primary RESPA Compliance Statement */}
        <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-bold text-sm mb-3 flex items-center">
            🔒 RESPA COMPLIANCE NOTICE
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            CircleMarketplace.io operates as an advertising and comparison platform for real estate settlement services. 
            We do not receive referral fees, kickbacks, or any compensation based on your selection or use of any service provider.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All fees paid to our platform are flat advertising fees unrelated to any transactions or referrals. 
            We do not provide anything of value in exchange for referrals of settlement service business.
          </p>
        </div>

        {/* Platform Disclaimer */}
        <div className="mb-8 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-bold text-sm mb-3">MARKETPLACE DISCLAIMER</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            CircleMarketplace.io is a venue for comparing service providers. We do not endorse, recommend, 
            or steer users to any particular provider. All listings are paid advertisements based on flat-fee arrangements.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Service providers pay standardized advertising fees for platform presence. Premium placements are based 
            solely on advertising tier purchased, not on quality, performance, or referral volume.
          </p>
        </div>

        {/* Legal Notices */}
        <div className="mb-8">
          <h4 className="font-bold text-sm mb-3">LEGAL NOTICE</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• We are not a lender, title company, or settlement service provider</li>
            <li>• All providers operate independently</li>
            <li>• No warranties or guarantees on listed services</li>
            <li>• Users must exercise independent judgment in selection</li>
            <li>• This platform does not facilitate co-marketing arrangements for business tools or lead generation systems</li>
          </ul>
        </div>

        {/* User Agreement */}
        <div className="mb-8">
          <h4 className="font-bold text-sm mb-3">USER AGREEMENT</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            By using CircleMarketplace.io, you acknowledge:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You are viewing paid advertisements, not recommendations</li>
            <li>• We receive no compensation based on your provider selection</li>
            <li>• All providers pay flat advertising fees</li>
            <li>• You must independently evaluate all providers</li>
            <li>• This platform makes no warranties about listed providers</li>
          </ul>
        </div>

        {/* Co-Marketing Compliance Notice */}
        <div className="mb-8 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
          <h4 className="font-bold text-sm mb-3">CO-MARKETING COMPLIANCE NOTICE</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            <strong>IMPORTANT:</strong> CircleMarketplace.io facilitates connections for RESPA-compliant joint advertising only. 
            We explicitly do not facilitate:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 mb-3">
            <li>• Co-payment arrangements for CRM systems</li>
            <li>• Lead generation tool sharing</li>
            <li>• Business operations platform splitting</li>
            <li>• Any arrangements tied to referral expectations</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All co-marketing must involve true public advertising with proportional benefit to all parties.
          </p>
        </div>

        <Separator className="my-6" />

        {/* Links Section */}
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
                  <button className="block text-sm text-muted-foreground hover:text-primary text-left">
                    RESPA Compliance
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Complete RESPA Compliance Information</DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed pt-4 space-y-4">
                      <div>
                        <h5 className="font-semibold text-foreground mb-2">Primary Compliance Statement</h5>
                        <p>CircleMarketplace.io operates as an advertising and comparison platform for real estate settlement services. We do not receive referral fees, kickbacks, or any compensation based on your selection or use of any service provider.</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground mb-2">Co-Marketing Compliance</h5>
                        <p>CircleMarketplace.io facilitates connections for RESPA-compliant joint advertising only. We do not facilitate co-payment arrangements for CRM systems, lead generation tools, or other business operations platforms. All co-marketing must involve true advertising with proportional benefit to all parties.</p>
                      </div>
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
                Advertising Guidelines
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
                Contact Us
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

        {/* Privacy & Communications */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Privacy & Communications:</strong> By using this platform, you consent to receive communications 
            from Circle Consulting LLC. You may opt out at any time. Standard message/data rates may apply.
          </p>
        </div>

        <Separator className="my-6" />

        {/* Copyright and Final Info */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm font-semibold text-muted-foreground">
              © 2025 Circle Consulting LLC. All Rights Reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              CircleMarketplace™ and all associated branding, interfaces, and platform logic are proprietary intellectual property of Circle Consulting LLC.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs text-muted-foreground">
              Secure & Compliant Platform
            </span>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="text-xs">
                RESPA Compliant
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