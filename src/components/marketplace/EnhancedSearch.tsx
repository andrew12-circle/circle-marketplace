import { useState, useEffect, useCallback, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, Filter, X, DollarSign, Star, ChevronDown, TrendingUp, Clock, RotateCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useServicePriceRange } from "@/hooks/useServicePriceRange";
import { useServiceCount } from "@/hooks/useServiceCount";
import { sbInvoke } from "@/utils/sb";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface EnhancedSearchProps {
  onSearchChange: (filters: SearchFilters) => void;
  availableCategories: string[];
  availableTags: string[];
  viewMode?: 'services' | 'products' | 'vendors';
  onViewModeChange?: (mode: 'services' | 'products' | 'vendors') => void;
  // Sorting props
  sortStrategy?: 'ranked' | 'recent' | 'price-low' | 'price-high';
  onSortChange?: (strategy: 'ranked' | 'recent' | 'price-low' | 'price-high') => void;
  isAdmin?: boolean;
}

export interface SearchFilters {
  query: string;
  categories: string[];
  tags: string[];
  priceRange: [number, number];
  rating: number;
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
  availableTags,
  viewMode = 'services',
  onViewModeChange,
  sortStrategy = 'ranked',
  onSortChange,
  isAdmin = false
}: EnhancedSearchProps) => {
  const isMobile = useIsMobile();
  const { min: minPrice, max: maxPrice, isLoading: priceRangeLoading } = useServicePriceRange();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    categories: [],
    tags: [],
    priceRange: [0, maxPrice], // Will be updated when maxPrice loads
    rating: 0,
    features: []
  });

  // Update price range when dynamic price range loads
  useEffect(() => {
    if (!priceRangeLoading && maxPrice > 0) {
      setFilters(prev => ({
        ...prev,
        priceRange: [minPrice, maxPrice]
      }));
      logger.log(`🎯 Updated default price range to: $${minPrice} - $${maxPrice}`);
    }
  }, [minPrice, maxPrice, priceRangeLoading]);

  const { data: serviceCount } = useServiceCount();
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const { toast } = useToast();
  const [isReranking, setIsReranking] = useState(false);
  
  // Debounce the filters to prevent excessive calls
  const debouncedFilters = useDebounce(filters, 300);

  // Dynamic placeholder based on view mode
  const getSearchPlaceholder = () => {
    if (isMobile) {
      return "search";
    }
    
    switch (viewMode) {
      case 'services':
        return serviceCount && serviceCount > 0 
          ? `Search ${serviceCount} top realtor services or keywords...` 
          : "Search services or keywords...";
      case 'products':
        return "Search product categories...";
      case 'vendors':
        return "Search vendors or companies...";
      default:
        return "Search...";
    }
  };

  useEffect(() => {
    // Count active filters from current state (immediate update)
    let count = 0;
    if (filters.query) count++;
    if (filters.categories.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.priceRange[0] > minPrice || filters.priceRange[1] < maxPrice) count++;
    if (filters.rating > 0) count++;
    if (filters.features.length > 0) count++;
    
    setActiveFiltersCount(count);
  }, [filters, minPrice, maxPrice]);

  // Use debounced filters for search change to prevent excessive calls
  useEffect(() => {
    onSearchChange(debouncedFilters);
  }, [debouncedFilters, onSearchChange]);

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
      priceRange: [minPrice, maxPrice],
      rating: 0,
      features: []
    });
  };

  const handleRerank = async () => {
    if (!isAdmin) return;
    
    setIsReranking(true);
    try {
      const { error } = await sbInvoke('auto-rerank-services');
      if (error) throw error;
      
      toast({
        title: "Reranking Complete",
        description: "Services have been re-ranked based on latest metrics.",
      });
    } catch (error) {
      console.error('Rerank error:', error);
      toast({
        title: "Rerank Failed",
        description: "Failed to trigger service reranking.",
        variant: "destructive",
      });
    } finally {
      setIsReranking(false);
    }
  };

  const getSortLabel = () => {
    switch (sortStrategy) {
      case 'ranked': return { icon: TrendingUp, label: 'Ranked' };
      case 'recent': return { icon: Clock, label: 'Newest' };
      case 'price-low': return { icon: DollarSign, label: 'Price: Low to High' };
      case 'price-high': return { icon: DollarSign, label: 'Price: High to Low' };
      default: return { icon: TrendingUp, label: 'Ranked' };
    }
  };

  const { icon: SortIcon, label } = getSortLabel();

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
        updateFilters('priceRange', [minPrice, maxPrice]);
        break;
      case 'rating':
        updateFilters('rating', 0);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Single Compact Bar with Tabs, Search, and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Mobile: Stack vertically, Desktop: Horizontal row */}
        
        {/* Top row on mobile: Tabs + Filters button */}
        <div className="flex items-center justify-between sm:contents">
          {/* View Mode Tabs */}
          {onViewModeChange && (
            <div className="flex bg-muted rounded-lg p-0.5 sm:p-1">
              {(['services', 'products', 'vendors'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange(mode)}
                  className={`px-2 sm:px-3 py-1 text-xs transition-all ${
                    viewMode === mode 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-background/50"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
          )}

          {/* Filters Dropdown - Mobile: Compact button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-4">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[95vw] sm:w-[800px] p-4 sm:p-6 bg-background border shadow-lg z-50" align="end">
              <div className="space-y-4 sm:space-y-6">
                {/* Sort Controls - for services only */}
                {viewMode === 'services' && onSortChange && (
                  <div className="pb-4 border-b">
                    <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                    <div className="flex items-center gap-3">
                      <Select value={sortStrategy} onValueChange={onSortChange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <SortIcon className="h-4 w-4" />
                              <span>{label}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ranked">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Ranked
                            </div>
                          </SelectItem>
                          <SelectItem value="recent">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Newest
                            </div>
                          </SelectItem>
                          <SelectItem value="price-low">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Price: Low to High
                            </div>
                          </SelectItem>
                          <SelectItem value="price-high">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Price: High to Low
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Admin Rerank Button */}
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRerank}
                          disabled={isReranking}
                          className="px-3"
                        >
                          <RotateCw className={`h-4 w-4 ${isReranking ? 'animate-spin' : ''}`} />
                          <span className="ml-2">
                            {isReranking ? 'Reranking...' : 'Rerank'}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  {/* Left Column */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Categories */}
                     <div>
                       <Label className="text-sm font-medium mb-3 block">
                         Categories {filters.categories.length > 0 && (
                           <span className="text-xs text-muted-foreground">
                             ({filters.categories.length} selected)
                           </span>
                         )}
                       </Label>
                       <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                         {availableCategories.map((category) => (
                           <div key={category} className="flex items-center space-x-2 hover:bg-accent/50 p-1 rounded">
                             <Checkbox
                               id={`category-${category}`}
                               checked={filters.categories.includes(category)}
                               onCheckedChange={() => toggleArrayFilter('categories', category)}
                             />
                             <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer flex-1">
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
                  <div className="space-y-4 sm:space-y-6">
                    {/* Price Range */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">
                        Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                        {priceRangeLoading && <span className="text-muted-foreground ml-2">(loading...)</span>}
                      </Label>
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) => updateFilters('priceRange', value)}
                        max={maxPrice}
                        min={minPrice}
                        step={Math.max(1, Math.floor((maxPrice - minPrice) / 100))} // Dynamic step based on range
                        className="mt-2"
                        disabled={priceRangeLoading}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>${minPrice}</span>
                        <span>${maxPrice}</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Minimum Rating</Label>
                      <div className="grid grid-cols-3 gap-2 max-w-xs">
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
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Input - Full width on mobile, constrained on desktop */}
        <div className="relative w-full sm:flex-1 sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={getSearchPlaceholder()}
            value={filters.query}
            onChange={(e) => updateFilters('query', e.target.value)}
            className="pl-10 pr-4 h-10 sm:h-9"
          />
        </div>
      </div>

      {/* Filter Controls */}
      {/* Filter Controls moved next to search bar above */}

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
            <Badge key={category} variant="secondary" className="gap-1 bg-secondary/80 hover:bg-secondary">
              {category}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => removeFilter('category', category)}
              />
            </Badge>
          ))}
          
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 bg-secondary/80 hover:bg-secondary">
              #{tag}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => removeFilter('tag', tag)}
              />
            </Badge>
          ))}
          
          {filters.features.map((feature) => (
            <Badge key={feature} variant="secondary" className="gap-1 bg-secondary/80 hover:bg-secondary">
              {feature}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => removeFilter('feature', feature)}
              />
            </Badge>
          ))}
          
          {(filters.priceRange[0] > minPrice || filters.priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="gap-1 bg-secondary/80 hover:bg-secondary">
              <DollarSign className="w-3 h-3" />
              ${filters.priceRange[0]}-${filters.priceRange[1]}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => removeFilter('price')}
              />
            </Badge>
          )}
          
          {filters.rating > 0 && (
            <Badge variant="secondary" className="gap-1 bg-secondary/80 hover:bg-secondary">
              <Star className="w-3 h-3" />
              {filters.rating}+ stars
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => removeFilter('rating')}
              />
            </Badge>
          )}
          
        </div>
      )}
    </div>
  );
};
