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
  const handleAskCircleAI = () => {
    setIsAIModalOpen(true);
  };
  const handleInviteVendor = () => {
    setIsInviteModalOpen(true);
  };
  return <>
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Curated Solutions for Agents
            </h2>
            <p className="mt-1 text-muted-foreground max-w-[65ch]">See 150+ realtor solutions side-by-side, and save up to 80% on the tools you already use — with one-click co-pay (automatic vendor co-marketing).</p>
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

      <AskCircleAIModal open={isAIModalOpen} onOpenChange={setIsAIModalOpen} />
      
      <InviteVendorModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} />
      
      
    </>;
};