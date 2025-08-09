import { useState, useEffect } from "react";
import { ModularServiceFunnelModal } from "./funnel/ModularServiceFunnelModal";
import { supabase } from "@/integrations/supabase/client";

interface ServiceFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
}

export const ServiceFunnelModal = ({
  isOpen,
  onClose,
  service
}: ServiceFunnelModalProps) => {
  const [vendorData, setVendorData] = useState<any>(null);

  // Fetch vendor data
  useEffect(() => {
    const fetchVendorData = async () => {
      if (service.vendor_id) {
        const { data } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', service.vendor_id)
          .single();
        
        setVendorData(data);
      }
    };

    if (isOpen && service.vendor_id) {
      fetchVendorData();
    }
  }, [isOpen, service.vendor_id]);

  // Use the new modular funnel modal
  return (
    <ModularServiceFunnelModal
      isOpen={isOpen}
      onClose={onClose}
      service={service}
      vendor={vendorData}
    />
  );
};