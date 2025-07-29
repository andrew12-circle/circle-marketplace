import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Phone, Mail, Building, Filter, FilterX } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

interface LocationFilterBannerProps {
  onToggleLocationFilter: () => void;
  isLocationFilterActive: boolean;
  vendorCount: number;
  localVendorCount: number;
}

export const LocationFilterBanner = ({ 
  onToggleLocationFilter, 
  isLocationFilterActive, 
  vendorCount,
  localVendorCount 
}: LocationFilterBannerProps) => {
  const { location } = useLocation();

  if (!location?.state) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                {isLocationFilterActive ? `Local Vendors in ${location.state}` : 'All Vendors'}
              </h3>
              <p className="text-sm text-blue-700">
                {isLocationFilterActive 
                  ? `Showing ${localVendorCount} vendors licensed or serving in your state`
                  : `${localVendorCount} of ${vendorCount} vendors serve your area`
                }
              </p>
            </div>
          </div>
          
          <Button
            onClick={onToggleLocationFilter}
            variant={isLocationFilterActive ? "outline" : "default"}
            className={isLocationFilterActive 
              ? "border-blue-300 text-blue-700 hover:bg-blue-50" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {isLocationFilterActive ? (
              <>
                <FilterX className="w-4 h-4 mr-2" />
                Show All Vendors
              </>
            ) : (
              <>
                <Filter className="w-4 h-4 mr-2" />
                Show Local Only
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};