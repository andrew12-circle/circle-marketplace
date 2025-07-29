import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  city: string | null;
  state: string | null;
  zip_code: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getLocationFromCoords = async (latitude: number, longitude: number) => {
    try {
      // Using a reverse geocoding service to get address from coordinates
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      return {
        city: data.city || data.locality || null,
        state: data.principalSubdivision || null,
        zip_code: data.postcode || null,
        coordinates: { latitude, longitude }
      };
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return {
        city: null,
        state: null,
        zip_code: null,
        coordinates: { latitude, longitude }
      };
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;
      const locationData = await getLocationFromCoords(latitude, longitude);
      
      setLocation(locationData);
      
      // Update user profile with location
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            city: locationData.city,
            state: locationData.state,
            zip_code: locationData.zip_code,
            location: `${locationData.city}, ${locationData.state}`
          })
          .eq('user_id', user.id);
      }

      toast({
        title: "Location detected",
        description: `${locationData.city}, ${locationData.state}`,
      });

    } catch (err) {
      const errorMessage = err instanceof GeolocationPositionError 
        ? `Location access denied: ${err.message}`
        : 'Failed to get location';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Location access failed",
        description: "Please enable location services or enter your location manually",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLocationManually = async (city: string, state: string, zipCode?: string) => {
    const locationData: LocationData = {
      city,
      state,
      zip_code: zipCode || null,
      coordinates: null
    };

    setLocation(locationData);

    // Update user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          city,
          state,
          zip_code: zipCode || null,
          location: `${city}, ${state}`
        })
        .eq('user_id', user.id);
    }

    toast({
      title: "Location updated",
      description: `${city}, ${state}`,
    });
  };

  // Load location from profile on mount
  useEffect(() => {
    const loadUserLocation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('city, state, zip_code')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile && profile.state) {
          setLocation({
            city: profile.city,
            state: profile.state,
            zip_code: profile.zip_code,
            coordinates: null
          });
        }
      }
    };

    loadUserLocation();
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    updateLocationManually
  };
};