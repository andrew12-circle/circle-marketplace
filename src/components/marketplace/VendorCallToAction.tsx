import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Store, ArrowRight } from "lucide-react";

export const VendorCallToAction = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Become a Circle Network Vendor
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Join our network of trusted service providers and grow your business with our community of real estate professionals.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/vendor-registration">
              <UserPlus className="w-5 h-5" />
              Apply to Become a Vendor
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link to="/vendor-dashboard">
              <Store className="w-5 h-5 mr-2" />
              Vendor Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="text-sm text-gray-500">
          Quick approval process • No setup fees • Start earning immediately
        </div>
      </div>
    </div>
  );
};