import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export interface FilterState {
  markets: string[];
  tiers: string[];
  teamSizes: string[];
  niches: string[];
  durations: string[];
  sortBy: "popular" | "new" | "price-low" | "price-high";
}

interface PlaybooksFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const TIER_OPTIONS = ["Top 1%", "Top 5%", "Top 10%", "Rising Star"];
const TEAM_SIZE_OPTIONS = ["Solo", "2-5", "6-10", "11+"];
const DURATION_OPTIONS = ["< 30 min", "30-60 min", "1-2 hours", "2+ hours"];

export const PlaybooksFilters = ({
  filters,
  onFiltersChange,
}: PlaybooksFiltersProps) => {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (
    key: keyof Pick<FilterState, "tiers" | "teamSizes" | "durations">,
    value: string
  ) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const hasActiveFilters = 
    filters.tiers.length > 0 ||
    filters.teamSizes.length > 0 ||
    filters.durations.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-12">
      {/* Sort By */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-sm font-normal rounded-full">
            {SORT_OPTIONS.find((opt) => opt.value === filters.sortBy)?.label || "Sort By"}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.sortBy === option.value}
              onCheckedChange={() =>
                updateFilter("sortBy", option.value as FilterState["sortBy"])
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tier Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={filters.tiers.length > 0 ? "secondary" : "ghost"} 
            size="sm" 
            className="gap-1.5 text-sm font-normal rounded-full"
          >
            Tier {filters.tiers.length > 0 && `(${filters.tiers.length})`}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Agent Tier</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TIER_OPTIONS.map((tier) => (
            <DropdownMenuCheckboxItem
              key={tier}
              checked={filters.tiers.includes(tier)}
              onCheckedChange={() => toggleArrayFilter("tiers", tier)}
            >
              {tier}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Team Size Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={filters.teamSizes.length > 0 ? "secondary" : "ghost"} 
            size="sm" 
            className="gap-1.5 text-sm font-normal rounded-full"
          >
            Team Size {filters.teamSizes.length > 0 && `(${filters.teamSizes.length})`}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Team Size</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TEAM_SIZE_OPTIONS.map((size) => (
            <DropdownMenuCheckboxItem
              key={size}
              checked={filters.teamSizes.includes(size)}
              onCheckedChange={() => toggleArrayFilter("teamSizes", size)}
            >
              {size}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Duration Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={filters.durations.length > 0 ? "secondary" : "ghost"} 
            size="sm" 
            className="gap-1.5 text-sm font-normal rounded-full"
          >
            Duration {filters.durations.length > 0 && `(${filters.durations.length})`}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Duration</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DURATION_OPTIONS.map((duration) => (
            <DropdownMenuCheckboxItem
              key={duration}
              checked={filters.durations.includes(duration)}
              onCheckedChange={() => toggleArrayFilter("durations", duration)}
            >
              {duration}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-sm font-normal rounded-full"
          onClick={() =>
            onFiltersChange({
              ...filters,
              tiers: [],
              teamSizes: [],
              durations: [],
            })
          }
        >
          Clear all
        </Button>
      )}
    </div>
  );
};
