import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AskCircleAIModal } from "./AskCircleAIModal";
import { InviteVendorModal } from "./InviteVendorModal";
import { FindPerfectCampaignModal } from "./FindPerfectCampaignModal";
import { useState } from "react";

export const CampaignServicesHeader = () => {
  const { toast } = useToast();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const handleFindCampaign = () => {
    setIsCampaignModalOpen(true);
  };

  const handleAskCircleAI = () => {
    setIsAIModalOpen(true);
  };

  const handleInviteVendor = () => {
    setIsInviteModalOpen(true);
  };

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              All Campaigns & Services
            </h2>
          </div>
          
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

      <AskCircleAIModal 
        open={isAIModalOpen} 
        onOpenChange={setIsAIModalOpen} 
      />
      
      <InviteVendorModal 
        open={isInviteModalOpen} 
        onOpenChange={setIsInviteModalOpen} 
      />
      
      <FindPerfectCampaignModal 
        open={isCampaignModalOpen} 
        onOpenChange={setIsCampaignModalOpen} 
      />
      
    </>
  );
};