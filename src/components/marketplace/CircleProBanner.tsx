import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";

export const CircleProBanner = () => {
  return (
    <div className="my-6 sm:my-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 p-6 sm:p-8">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        
        <div className="relative text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="w-6 h-6 text-yellow-300" />
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold mb-2">
            Unlock Your Full Potential with Circle Pro
          </h3>
          
          <p className="text-sm sm:text-base text-white/90 mb-6 max-w-2xl mx-auto">
            Get exclusive member pricing, earn Circle Points™ on every campaign, and access 
            powerful marketing tools to grow your business.
          </p>
          
          <Button 
            asChild 
            variant="secondary" 
            className="bg-white text-purple-700 hover:bg-white/90 font-semibold px-6 py-2.5 h-auto"
          >
            <Link to="/pricing">
              Start Your Free Trial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};