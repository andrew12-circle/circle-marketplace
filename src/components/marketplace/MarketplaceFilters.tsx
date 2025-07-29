import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryMegaMenu } from "./CategoryMegaMenu";

interface FilterState {
  category: string; // Should be "all" or a valid category, never empty string
  priceRange: number[];
  verified: boolean;
  featured: boolean;
}

export interface MarketplaceFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
}

export const MarketplaceFilters = ({ filters, onFiltersChange, categories }: MarketplaceFiltersProps) => {
  // Provide default values to prevent undefined errors
  const safeFilters = filters || {
    category: "all",
    priceRange: [0, 2000],
    verified: false,
    featured: false,
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
    });
  };

  const hasActiveFilters = (safeFilters.category && safeFilters.category !== "all") || 
    safeFilters.verified || safeFilters.featured || 
    safeFilters.priceRange[0] > 0 || safeFilters.priceRange[1] < 2000;

  return (
    <Card className="bg-card border border-border/50">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Category Filter */}
          <div>
            <CategoryMegaMenu 
              selectedCategory={safeFilters.category}
              onCategorySelect={(value) => updateFilter("category", value)}
            />
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Price Range: ${safeFilters.priceRange[0]} - ${safeFilters.priceRange[1]}
            </Label>
            <Slider
              value={safeFilters.priceRange}
              onValueChange={(value) => updateFilter("priceRange", value)}
              max={2000}
              min={0}
              step={50}
              className="w-full"
            />
          </div>

          {/* Verification Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={safeFilters.verified}
              onCheckedChange={(checked) => updateFilter("verified", checked)}
            />
            <Label htmlFor="verified" className="text-sm">
              Circle Verified Only
            </Label>
          </div>

          {/* Featured Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={safeFilters.featured}
              onCheckedChange={(checked) => updateFilter("featured", checked)}
            />
            <Label htmlFor="featured" className="text-sm">
              Featured Only
            </Label>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {safeFilters.category && safeFilters.category !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {safeFilters.category}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter("category", "all")}
                  />
                </Badge>
              )}
              {safeFilters.verified && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Verified
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter("verified", false)}
                  />
                </Badge>
              )}
              {safeFilters.featured && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Featured
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter("featured", false)}
                  />
                </Badge>
              )}
              {(safeFilters.priceRange[0] > 0 || safeFilters.priceRange[1] < 2000) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  ${safeFilters.priceRange[0]} - ${safeFilters.priceRange[1]}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter("priceRange", [0, 2000])}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};