import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  retail_price?: string;
  pro_price?: string;
  requires_quote?: boolean;
}

interface ServiceFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

const ServiceFunnelModal = ({ isOpen, onClose, service }: ServiceFunnelModalProps) => {
  console.log("ServiceFunnelModal render", { isOpen, service: service?.id });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <span>Service Details</span>
        </DialogHeader>
        
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{service?.title}</h2>
          <p className="text-gray-600 mb-4">{service?.description}</p>
          
          {service?.image_url && (
            <img
              src={service.image_url}
              alt={service.title}
              className="w-full max-w-md h-48 object-cover rounded-lg mb-4"
            />
          )}

          <div className="space-y-2">
            {service?.retail_price && (
              <p>Retail Price: ${service.retail_price}</p>
            )}
            {service?.pro_price && (
              <p>Pro Price: ${service.pro_price}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFunnelModal;