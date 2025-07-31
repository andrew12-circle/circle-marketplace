import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { LocationModal } from '@/components/LocationModal';

export const LocationSwitcher = () => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { location } = useLocation();

  const handleOpenModal = () => {
    setIsLocationModalOpen(true);
  };

  const getLocationIcon = () => {
    if (location?.city && location?.state) {
      return '📍';
    }
    return '';
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleOpenModal}
        className="flex items-center gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground"
      >
        <MapPin className="h-4 w-4" />
        <span className="text-sm">{getLocationIcon()}</span>
        <span className="hidden sm:inline text-sm max-w-20 truncate">
          {location?.city || 'Set Location'}
        </span>
      </Button>
      
      <LocationModal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
};