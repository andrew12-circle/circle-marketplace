import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ManageSubscriptionModal } from "./ManageSubscriptionModal";

export const CustomerPortalButton = forwardRef<HTMLDivElement>((props, ref) => {
  const [loading, setLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleManageSubscription = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    setShowManageModal(true);
  };

  const handleManageModalSuccess = async () => {
    // Refresh subscription status after changes
    try {
      await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
    }
  };

  return (
    <>
      <div 
        ref={ref}
        className="flex items-center cursor-pointer"
        onClick={handleManageSubscription}
        {...props}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        <span>Manage Subscription</span>
      </div>

      <ManageSubscriptionModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        onSuccess={handleManageModalSuccess}
      />
    </>
  );
});