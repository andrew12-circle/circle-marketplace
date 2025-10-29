import { useState } from "react";
import { PlaybooksHero } from "./PlaybooksHero";
import { PlaybooksGrid } from "./PlaybooksGrid";
import { PlaybooksFilters, type FilterState } from "./PlaybooksFilters";

export const PlaybooksLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    markets: [],
    tiers: [],
    teamSizes: [],
    niches: [],
    durations: [],
    sortBy: "popular",
  });

  return (
    <div className="min-h-screen bg-background">
      <PlaybooksHero 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />
      
      <div className="container mx-auto px-4 py-8">
        <PlaybooksFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        <PlaybooksGrid
          searchQuery={searchQuery}
          filters={filters}
        />
      </div>
    </div>
  );
};
