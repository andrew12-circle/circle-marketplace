import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const CustomerPortalButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleManageSubscription = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open in new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to access customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="w-full flex items-center cursor-pointer"
      onClick={handleManageSubscription}
    >
      <CreditCard className="mr-2 h-4 w-4" />
      <span>{loading ? "Loading..." : "Manage Subscription"}</span>
      <ExternalLink className="ml-auto h-3 w-3" />
    </div>
  );
};