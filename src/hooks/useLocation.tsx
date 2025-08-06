import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { requestDeduplicator } from '@/utils/requestDeduplicator';
import { useAuth } from '@/contexts/AuthContext';

interface LocationData {
  city: string | null;
  state: string | null;
  zip_code: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

// Query keys for location data
const LOCATION_QUERY_KEYS = {
  userLocation: (userId: string) => ['location', 'user', userId],
} as const;

/**
 * Fetch user location from profile with caching and deduplication
 */
const fetchUserLocation = async (userId: string): Promise<LocationData | null> => {
  if (!userId) return null;
  
  return requestDeduplicator.dedupRequest(
    `user-location-${userId}`,
    async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('city, state, zip_code')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profile && profile.state) {
        return {
          city: profile.city,
          state: profile.state,
          zip_code: profile.zip_code,
          coordinates: null
        };
      }
      
      return null;
    }
  );
};

export const useLocation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Use React Query for location data with caching
  const { 
    data: location, 
    isLoading: loading, 
    error 
  } = useQuery({
    queryKey: LOCATION_QUERY_KEYS.userLocation(user?.id || ''),
    queryFn: () => fetchUserLocation(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent excessive refetching
  });

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
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location not supported",
        description: "Geolocation is not supported by this browser",
      });
      setIsGettingLocation(false);
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
      
      // Update user profile with location and invalidate cache
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            city: locationData.city,
            state: locationData.state,
            zip_code: locationData.zip_code,
            location: `${locationData.city}, ${locationData.state}`
          })
          .eq('user_id', user.id);
        
        // Invalidate and refetch location data
        queryClient.setQueryData(
          LOCATION_QUERY_KEYS.userLocation(user.id),
          locationData
        );
      }

      toast({
        title: "Location detected",
        description: `${locationData.city}, ${locationData.state}`,
      });

    } catch (err) {
      const errorMessage = err instanceof GeolocationPositionError 
        ? `Location access denied: ${err.message}`
        : 'Failed to get location';
      
      toast({
        variant: "destructive",
        title: "Location access failed",
        description: "Please enable location services or enter your location manually",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const updateLocationManually = async (city: string, state: string, zipCode?: string) => {
    const locationData: LocationData = {
      city,
      state,
      zip_code: zipCode || null,
      coordinates: null
    };

    // Update user profile and cache
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({
          city,
          state,
          zip_code: zipCode || null,
          location: `${city}, ${state}`
        })
        .eq('user_id', user.id);
      
      // Update cache immediately
      queryClient.setQueryData(
        LOCATION_QUERY_KEYS.userLocation(user.id),
        locationData
      );
    }

    toast({
      title: "Location updated",
      description: `${city}, ${state}`,
    });
  };

  return {
    location,
    loading: loading || isGettingLocation,
    error: error?.message || null,
    getCurrentLocation,
    updateLocationManually
  };
};