import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryMegaMenu } from "./CategoryMegaMenu";
import { useLocation } from "@/hooks/useLocation";

interface FilterState {
  category: string; // Should be "all" or a valid category, never empty string
  priceRange: number[];
  verified: boolean;
  featured: boolean;
  coPayEligible: boolean;
  locationFilter: boolean; // New location filter
  riskLevel?: string; // Only for services view
}

export interface MarketplaceFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
  viewMode?: 'services' | 'products' | 'vendors'; // Add viewMode prop
  vendorCount?: number;
  localVendorCount?: number;
}

export const MarketplaceFilters = ({ 
  filters, 
  onFiltersChange, 
  categories, 
  viewMode = 'services',
  vendorCount = 0,
  localVendorCount = 0 
}: MarketplaceFiltersProps) => {
  const { t } = useTranslation();
  const { location } = useLocation();
  // Provide default values to prevent undefined errors
  const safeFilters = filters || {
    category: "all",
    priceRange: [0, 2000],
    verified: false,
    featured: false,
    coPayEligible: false,
    locationFilter: false,
  };
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...safeFilters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: "all",
      priceRange: [0, 2000],
      verified: false,
      featured: false,
      coPayEligible: false,
      locationFilter: false,
    });
  };

  const hasActiveFilters = (safeFilters.category && safeFilters.category !== "all") || 
    safeFilters.verified || safeFilters.featured || safeFilters.coPayEligible || safeFilters.locationFilter ||
    safeFilters.priceRange[0] > 0 || safeFilters.priceRange[1] < 2000;

  return (
    <div className="bg-gradient-to-r from-background via-background/95 to-background/90 backdrop-blur-md border border-border/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4">
        {hasActiveFilters && (
          <div className="flex justify-end mb-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters} 
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200 rounded-full px-3"
            >
              Clear all
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="min-w-fit">
            <CategoryMegaMenu 
              selectedCategory={safeFilters.category}
              onCategorySelect={(value) => updateFilter("category", value)}
              viewMode={viewMode}
              serviceCategories={categories}
            />
          </div>

          {/* Price Range Filter */}
          <div className="flex items-center gap-3 bg-muted/20 rounded-full px-4 py-2 min-w-[180px]">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Price</span>
            <div className="flex-1 space-y-1">
              <div className="text-center">
                <span className="text-xs font-semibold text-circle-primary">
                  ${safeFilters.priceRange[0]} - ${safeFilters.priceRange[1]}
                </span>
              </div>
              <Slider
                value={safeFilters.priceRange}
                onValueChange={(value) => updateFilter("priceRange", value)}
                max={2000}
                min={0}
                step={50}
                className="w-full"
              />
            </div>
          </div>

          {/* Verification Filter */}
          <div className="flex items-center gap-2 bg-muted/20 hover:bg-muted/30 rounded-full px-3 py-2 transition-all duration-200 cursor-pointer group">
            <Checkbox
              id="verified"
              checked={safeFilters.verified}
              onCheckedChange={(checked) => updateFilter("verified", checked)}
              className="data-[state=checked]:bg-circle-primary data-[state=checked]:border-circle-primary"
            />
            <Label htmlFor="verified" className="text-xs font-medium cursor-pointer group-hover:text-foreground transition-colors">
              Verified
            </Label>
          </div>

          {/* Featured Filter */}
          <div className="flex items-center gap-2 bg-muted/20 hover:bg-muted/30 rounded-full px-3 py-2 transition-all duration-200 cursor-pointer group">
            <Checkbox
              id="featured"
              checked={safeFilters.featured}
              onCheckedChange={(checked) => updateFilter("featured", checked)}
              className="data-[state=checked]:bg-circle-primary data-[state=checked]:border-circle-primary"
            />
            <Label htmlFor="featured" className="text-xs font-medium cursor-pointer group-hover:text-foreground transition-colors">
              Featured
            </Label>
          </div>

          {/* Co-Pay Eligible Filter - Only for services */}
          {viewMode === 'services' && (
            <div className="flex items-center gap-2 bg-muted/20 hover:bg-muted/30 rounded-full px-3 py-2 transition-all duration-200 cursor-pointer group">
              <Checkbox
                id="coPayEligible"
                checked={safeFilters.coPayEligible}
                onCheckedChange={(checked) => updateFilter("coPayEligible", checked)}
                className="data-[state=checked]:bg-circle-primary data-[state=checked]:border-circle-primary"
              />
              <Label htmlFor="coPayEligible" className="text-xs font-medium cursor-pointer group-hover:text-foreground transition-colors">
                Co-Pay
              </Label>
            </div>
          )}

          {/* Location Filter - Only show if user has location */}
          {location?.state && (
            <div className="flex items-center gap-2 bg-muted/20 hover:bg-muted/30 rounded-full px-3 py-2 transition-all duration-200 cursor-pointer group">
              <Checkbox
                id="locationFilter"
                checked={safeFilters.locationFilter}
                onCheckedChange={(checked) => updateFilter("locationFilter", checked)}
                className="data-[state=checked]:bg-circle-primary data-[state=checked]:border-circle-primary"
              />
              <Label htmlFor="locationFilter" className="text-xs font-medium cursor-pointer group-hover:text-foreground transition-colors flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location.state}
              </Label>
            </div>
          )}

        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-border/20">
            <div className="flex flex-wrap gap-2">
              {safeFilters.category && safeFilters.category !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1 rounded-full">
                  {safeFilters.category}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateFilter("category", "all");
                    }}
                  />
                </Badge>
              )}
              {safeFilters.verified && (
                <Badge variant="secondary" className="flex items-center gap-1 rounded-full">
                  Verified
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                    onClick={() => updateFilter("verified", false)}
                  />
                </Badge>
              )}
              {safeFilters.featured && (
                <Badge variant="secondary" className="flex items-center gap-1 rounded-full">
                  Featured
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                    onClick={() => updateFilter("featured", false)}
                  />
                </Badge>
              )}
              {viewMode === 'services' && safeFilters.coPayEligible && (
                <Badge variant="secondary" className="flex items-center gap-1 rounded-full">
                  Co-Pay Eligible
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                    onClick={() => updateFilter("coPayEligible", false)}
                  />
                </Badge>
              )}
              {safeFilters.locationFilter && location?.state && (
                <Badge variant="secondary" className="flex items-center gap-1 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {location.state} Only
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                    onClick={() => updateFilter("locationFilter", false)}
                  />
                </Badge>
              )}
              {(safeFilters.priceRange[0] > 0 || safeFilters.priceRange[1] < 2000) && (
                <Badge variant="secondary" className="flex items-center gap-1 rounded-full">
                  ${safeFilters.priceRange[0]} - ${safeFilters.priceRange[1]}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                    onClick={() => updateFilter("priceRange", [0, 2000])}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};