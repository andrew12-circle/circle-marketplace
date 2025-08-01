
import { useState, useEffect } from "react";
import { Search, Filter, X, MapPin, DollarSign, Star, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface EnhancedSearchProps {
  onSearchChange: (filters: SearchFilters) => void;
  availableCategories: string[];
  availableTags: string[];
}

export interface SearchFilters {
  query: string;
  categories: string[];
  tags: string[];
  priceRange: [number, number];
  rating: number;
  location: string;
  features: string[];
}

const FEATURE_OPTIONS = [
  "Co-Pay Available",
  "Instant Quote",
  "Featured Service",
  "Top Pick",
  "Pro Member Discount"
];

export const EnhancedSearch = ({ 
  onSearchChange, 
  availableCategories, 
  availableTags 
}: EnhancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    categories: [],
    tags: [],
    priceRange: [0, 1000],
    rating: 0,
    location: "",
    features: []
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.query) count++;
    if (filters.categories.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    if (filters.rating > 0) count++;
    if (filters.location) count++;
    if (filters.features.length > 0) count++;
    
    setActiveFiltersCount(count);
    onSearchChange(filters);
  }, [filters, onSearchChange]);

  const updateFilters = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayFilter = (key: 'categories' | 'tags' | 'features', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: "",
      categories: [],
      tags: [],
      priceRange: [0, 1000],
      rating: 0,
      location: "",
      features: []
    });
  };

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'query':
        updateFilters('query', '');
        break;
      case 'category':
        if (value) toggleArrayFilter('categories', value);
        break;
      case 'tag':
        if (value) toggleArrayFilter('tags', value);
        break;
      case 'feature':
        if (value) toggleArrayFilter('features', value);
        break;
      case 'price':
        updateFilters('priceRange', [0, 1000]);
        break;
      case 'rating':
        updateFilters('rating', 0);
        break;
      case 'location':
        updateFilters('location', '');
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search services, vendors, or keywords..."
          value={filters.query}
          onChange={(e) => updateFilters('query', e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[600px] p-6 bg-popover border shadow-md" align="start">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Categories</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {availableCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={() => toggleArrayFilter('categories', category)}
                        />
                        <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Features</Label>
                  <div className="space-y-2">
                    {FEATURE_OPTIONS.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature}`}
                          checked={filters.features.includes(feature)}
                          onCheckedChange={() => toggleArrayFilter('features', feature)}
                        />
                        <Label htmlFor={`feature-${feature}`} className="text-sm cursor-pointer">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Price Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </Label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilters('priceRange', value)}
                    max={1000}
                    step={10}
                    className="mt-2"
                  />
                </div>

                {/* Rating */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Minimum Rating</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={filters.rating >= rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilters('rating', rating)}
                        className="px-2 py-1 text-xs"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {rating}+
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Clear All Button */}
                {activeFiltersCount > 0 && (
                  <div className="pt-4 border-t">
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="w-full">
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Location Filter */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
          <Input
            placeholder="Location"
            value={filters.location}
            onChange={(e) => updateFilters('location', e.target.value)}
            className="pl-8 pr-4 w-40"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary" className="gap-1">
              "{filters.query}"
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeFilter('query')}
              />
            </Badge>
          )}
          
          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeFilter('category', category)}
              />
            </Badge>
          ))}
          
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              #{tag}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeFilter('tag', tag)}
              />
            </Badge>
          ))}
          
          {filters.features.map((feature) => (
            <Badge key={feature} variant="secondary" className="gap-1">
              {feature}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeFilter('feature', feature)}
              />
            </Badge>
          ))}
          
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="w-3 h-3" />
              ${filters.priceRange[0]}-${filters.priceRange[1]}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeFilter('price')}
              />
            </Badge>
          )}
          
          {filters.rating > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Star className="w-3 h-3" />
              {filters.rating}+ stars
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeFilter('rating')}
              />
            </Badge>
          )}
          
          {filters.location && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="w-3 h-3" />
              {filters.location}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeFilter('location')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
