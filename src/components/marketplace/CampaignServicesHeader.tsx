import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, UserPlus, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AskCircleAIModal } from "./AskCircleAIModal";
import { InviteVendorModal } from "./InviteVendorModal";
import { FindPerfectCampaignModal } from "./FindPerfectCampaignModal";
import { LocationModal } from "../LocationModal";
import { useLocation } from "@/hooks/useLocation";
import { useState } from "react";

export const CampaignServicesHeader = () => {
  const { toast } = useToast();
  const { location } = useLocation();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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
            {location && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Showing vendors for {location.city}, {location.state}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setIsLocationModalOpen(true)}
              variant={location ? "outline" : "default"}
              className="flex items-center gap-2 h-10 px-4"
            >
              <MapPin className="w-4 h-4" />
              {location ? `${location.city}, ${location.state}` : "Set Location"}
            </Button>
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
      
      <LocationModal 
        open={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
      />
    </>
  );
};