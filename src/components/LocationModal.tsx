import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const LocationModal = ({ open, onClose }: LocationModalProps) => {
  const { getCurrentLocation, updateLocationManually, loading } = useLocation();
  const [manualEntry, setManualEntry] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const handleAutoDetect = async () => {
    await getCurrentLocation();
    onClose();
  };

  const handleManualSubmit = async () => {
    if (city && state) {
      await updateLocationManually(city, state, zipCode);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Your Location
          </DialogTitle>
          <DialogDescription>
            We'll use your location to show vendors that serve your area and comply with state regulations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!manualEntry ? (
            <div className="space-y-4">
              <Button 
                onClick={handleAutoDetect} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Detecting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Auto-Detect My Location
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-muted-foreground">or</span>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setManualEntry(true)}
                className="w-full"
              >
                Enter Location Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select State</option>
                  {US_STATES.map(stateCode => (
                    <option key={stateCode} value={stateCode}>
                      {stateCode}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code (Optional)</Label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter your zip code"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setManualEntry(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleManualSubmit}
                  disabled={!city || !state}
                  className="flex-1"
                >
                  Save Location
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};