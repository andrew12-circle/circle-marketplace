import { useState, useEffect, useRef } from "react";
import { Search, Clock, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketplaceData } from "@/hooks/useMarketplaceData";
import { supabase } from "@/integrations/supabase/client";

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

interface SearchSuggestion {
  type: 'service' | 'category' | 'vendor' | 'recent' | 'trending';
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface SmartSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SmartSearchAutocomplete = ({ 
  onSearch, 
  placeholder = "Search services, vendors, or categories...",
  className = ""
}: SmartSearchProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: marketplaceData } = useMarketplaceData();
  
  // Debounce the query to prevent excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('circle-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch (e) {
        console.warn('Failed to parse recent searches');
      }
    }
  }, []);

  // Fetch trending searches from database
  useEffect(() => {
    const fetchTrendingSearches = async () => {
      try {
        const { data } = await supabase
          .from('ai_interaction_logs')
          .select('query_text')
          .eq('intent_type', 'search')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(10);

        if (data) {
          const trending = data
            .map(item => item.query_text)
            .filter(Boolean)
            .slice(0, 5);
          setTrendingSearches(trending);
        }
      } catch (error) {
        console.warn('Failed to fetch trending searches');
      }
    };

    fetchTrendingSearches();
  }, []);

  // Generate suggestions based on debounced query to reduce unnecessary processing
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      // Show recent and trending when no query
      const defaultSuggestions: SearchSuggestion[] = [
        ...recentSearches.map(search => ({
          type: 'recent' as const,
          value: search,
          label: search,
          icon: <Clock className="w-4 h-4 text-muted-foreground" />
        })),
        ...trendingSearches.map(search => ({
          type: 'trending' as const,
          value: search,
          label: search,
          icon: <TrendingUp className="w-4 h-4 text-muted-foreground" />
        }))
      ];
      setSuggestions(defaultSuggestions.slice(0, 8));
      return;
    }

    if (!marketplaceData) return;

    const lowerQuery = debouncedQuery.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Keyword mapping for old-school categories
    const keywordMap = new Map([
      ['yard signs', 'Signs'],
      ['signs', 'Signs'], 
      ['for sale signs', 'Signs'],
      ['postcards', 'Print & Mail'],
      ['direct mail', 'Print & Mail'],
      ['print', 'Print & Mail'],
      ['flyers', 'Print & Mail'],
      ['mailers', 'Print & Mail'],
      ['presentations', 'Presentations'],
      ['listing presentations', 'Presentations'],
      ['branding', 'Branding'],
      ['business cards', 'Branding'],
      ['logos', 'Branding'],
      ['client events', 'Client Event Kits'],
      ['open house supplies', 'Client Event Kits'],
      ['event kits', 'Client Event Kits'],
      ['gifting', 'Client Retention'],
      ['client appreciation', 'Client Retention'],
      ['closing gifts', 'Client Retention']
    ]);

    // Check for keyword matches first
    for (const [keyword, category] of keywordMap) {
      if (lowerQuery.includes(keyword)) {
        newSuggestions.push({
          type: 'category' as const,
          value: category,
          label: `${category} services`,
          count: marketplaceData.services.filter(s => 
            s.category?.toLowerCase().includes(category.toLowerCase()) ||
            s.title?.toLowerCase().includes(keyword) ||
            s.description?.toLowerCase().includes(keyword)
          ).length
        });
      }
    }

    // Service suggestions
    const matchingServices = marketplaceData.services
      .filter(service => 
        service.title.toLowerCase().includes(lowerQuery) ||
        service.description?.toLowerCase().includes(lowerQuery) ||
        service.category.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .map(service => ({
        type: 'service' as const,
        value: service.title,
        label: service.title,
        count: 1
      }));

    // Category suggestions
    const categories = [...new Set(marketplaceData.services.map(s => s.category))];
    const matchingCategories = categories
      .filter(category => category.toLowerCase().includes(lowerQuery))
      .slice(0, 2)
      .map(category => ({
        type: 'category' as const,
        value: category,
        label: `${category} services`,
        count: marketplaceData.services.filter(s => s.category === category).length
      }));

    // Vendor suggestions
    const matchingVendors = marketplaceData.vendors
      .filter(vendor => vendor.name.toLowerCase().includes(lowerQuery))
      .slice(0, 2)
      .map(vendor => ({
        type: 'vendor' as const,
        value: vendor.name,
        label: vendor.name,
        count: 1
      }));

    newSuggestions.push(...matchingServices, ...matchingCategories, ...matchingVendors);
    setSuggestions(newSuggestions.slice(0, 8));
  }, [debouncedQuery, marketplaceData, recentSearches, trendingSearches]);

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    // Save to recent searches
    const updatedRecent = [trimmedQuery, ...recentSearches.filter(s => s !== trimmedQuery)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('circle-recent-searches', JSON.stringify(updatedRecent));

    // Log search for analytics (fire and forget)
    supabase.from('ai_interaction_logs').insert({
      query_text: trimmedQuery,
      intent_type: 'search',
      result_type: 'autocomplete',
      interaction_timestamp: new Date().toISOString()
    }).select();

    onSearch(trimmedQuery);
    setQuery(trimmedQuery);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.value);
  };

  const clearQuery = () => {
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query);
            }
            if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearQuery}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            {!query && recentSearches.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Recent searches</p>
              </div>
            )}
            {!query && trendingSearches.length > 0 && recentSearches.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Trending</p>
              </div>
            )}
            
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.value}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
              >
                {suggestion.icon || <Search className="w-4 h-4 text-muted-foreground" />}
                <span className="flex-1">{suggestion.label}</span>
                {suggestion.count && suggestion.count > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.count}
                  </Badge>
                )}
                {suggestion.type === 'category' && (
                  <Badge variant="outline" className="text-xs">
                    Category
                  </Badge>
                )}
                {suggestion.type === 'vendor' && (
                  <Badge variant="outline" className="text-xs">
                    Vendor
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};