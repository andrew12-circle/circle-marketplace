import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CampaignServicesHeader = () => {
  const { toast } = useToast();

  const handleFindCampaign = () => {
    toast({
      title: "Find My Perfect Campaign",
      description: "Campaign matching feature coming soon!",
    });
  };

  const handleAskCircleAI = () => {
    toast({
      title: "Ask Circle AI",
      description: "AI assistant feature coming soon!",
    });
  };

  const handleInviteVendor = () => {
    toast({
      title: "Invite Your Vendor",
      description: "Vendor invitation feature coming soon!",
    });
  };

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          All Campaigns & Services
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleFindCampaign}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 h-10 px-4"
          >
            <Sparkles className="w-4 h-4" />
            Find My Perfect Campaign
          </Button>
          
          <Button
            onClick={handleAskCircleAI}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 h-10 px-4"
          >
            <MessageCircle className="w-4 h-4" />
            Ask Circle AI
          </Button>
          
          <Button
            onClick={handleInviteVendor}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 h-10 px-4"
          >
            <UserPlus className="w-4 h-4" />
            Invite Your Vendor
          </Button>
        </div>
      </div>
    </div>
  );
};