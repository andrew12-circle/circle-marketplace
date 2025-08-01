import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, ExternalLink } from "lucide-react";
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleManageSubscription}
      disabled={loading}
      className="gap-2"
    >
      <Settings className="w-4 h-4" />
      {loading ? "Loading..." : "Manage Subscription"}
      <ExternalLink className="w-3 h-3" />
    </Button>
  );
};