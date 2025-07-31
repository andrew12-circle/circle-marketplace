import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, MapPin } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { LocationModal } from '@/components/LocationModal';

export const LocationSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { location } = useLocation();

  const handleSetLocation = () => {
    setOpen(false);
    setIsLocationModalOpen(true);
  };

  const getLocationDisplay = () => {
    if (location?.city && location?.state) {
      return `${location.city}, ${location.state}`;
    }
    return 'Set Location';
  };

  const getLocationIcon = () => {
    if (location?.city && location?.state) {
      return '📍';
    }
    return '🌍';
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{getLocationIcon()}</span>
            <span className="hidden sm:inline text-sm max-w-20 truncate">
              {location?.city || 'Location'}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="end">
          <div className="space-y-1">
            <button
              onClick={handleSetLocation}
              className="w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
            >
              <MapPin className="h-4 w-4" />
              <span className="font-medium">
                {location?.city && location?.state ? 'Change Location' : 'Set Location'}
              </span>
            </button>
          </div>
          {location?.city && location?.state && (
            <div className="border-t mt-2 pt-2 px-2">
              <div className="text-xs text-muted-foreground">
                Current: {getLocationDisplay()}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      <LocationModal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
};