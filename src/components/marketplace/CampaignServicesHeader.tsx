import { Button } from "@/components/ui/button";
import { MessageCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AskCircleAIModal } from "./AskCircleAIModal";
import { InviteVendorModal } from "./InviteVendorModal";
import { useState } from "react";
export const CampaignServicesHeader = () => {
  const {
    toast
  } = useToast();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [expandToken, setExpandToken] = useState<number>();
  const handleAskCircleAI = () => {
    setExpandToken(Date.now());
    setIsAIModalOpen(true);
  };
  const handleInviteVendor = () => {
    setIsInviteModalOpen(true);
  };
  return <>
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            
            <Button onClick={handleAskCircleAI} variant="default" className="flex items-center gap-2 h-10 px-4">
              <MessageCircle className="w-4 h-4" />
              Ask Circle AI
            </Button>
            
            <Button onClick={handleInviteVendor} variant="secondary" className="flex items-center gap-2 h-10 px-4">
              <UserPlus className="w-4 h-4" />
              Invite Your Vendor
            </Button>
          </div>
        </div>
      </div>

      <AskCircleAIModal 
        open={isAIModalOpen} 
        onOpenChange={setIsAIModalOpen} 
        expandToken={expandToken}
      />
      
      <InviteVendorModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} />
      
      
    </>;
};