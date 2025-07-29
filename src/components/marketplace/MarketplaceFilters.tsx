import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterState {
  category: string;
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
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: "",
      priceRange: [0, 2000],
      verified: false,
      featured: false,
    });
  };

  const hasActiveFilters = filters.category || filters.verified || filters.featured || 
    filters.priceRange[0] > 0 || filters.priceRange[1] < 2000;

  return (
    <Card className="bg-card border border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Filters</h3>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </Label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => updateFilter("priceRange", value)}
              max={2000}
              min={0}
              step={50}
              className="w-full"
            />
          </div>

          {/* Verification Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Verification</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.verified}
                onCheckedChange={(checked) => updateFilter("verified", checked)}
              />
              <Label htmlFor="verified" className="text-sm">
                Circle Verified Only
              </Label>
            </div>
          </div>

          {/* Featured Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Special</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={filters.featured}
                onCheckedChange={(checked) => updateFilter("featured", checked)}
              />
              <Label htmlFor="featured" className="text-sm">
                Featured Only
              </Label>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.category}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter("category", "")}
                  />
                </Badge>
              )}
              {filters.verified && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Verified
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter("verified", false)}
                  />
                </Badge>
              )}
              {filters.featured && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Featured
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter("featured", false)}
                  />
                </Badge>
              )}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 2000) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  ${filters.priceRange[0]} - ${filters.priceRange[1]}
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