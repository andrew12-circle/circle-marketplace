import { useMemo } from "react";
import { type FilterState } from "@/components/playbooks/PlaybooksFilters";

interface Playbook {
  id: string;
  title: string;
  cover_url: string | null;
  agent_name: string | null;
  agent_headshot_url: string | null;
  market_city: string | null;
  market_state: string | null;
  production_units_l12m: number | null;
  production_volume_l12m: number | null;
  tier_label: string | null;
  team_size: string | null;
  duration_minutes: number | null;
  price_usd: number | null;
  member_price_usd: number | null;
  created_at: string;
  niches: any;
}

export const usePlaybooksFilters = (
  playbooks: Playbook[],
  searchQuery: string,
  filters: FilterState
) => {
  return useMemo(() => {
    let filtered = [...playbooks];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      // Check if query contains a comma (city, state search)
      if (query.includes(',')) {
        const [cityQuery, stateQuery] = query.split(',').map(s => s.trim());
        filtered = filtered.filter((playbook) => {
          const cityMatch = playbook.market_city?.toLowerCase().includes(cityQuery);
          const stateMatch = stateQuery ? playbook.market_state?.toLowerCase().includes(stateQuery) : true;
          return cityMatch && stateMatch;
        });
      } else {
        // General search across title, city, and state
        filtered = filtered.filter((playbook) => {
          const titleMatch = playbook.title?.toLowerCase().includes(query);
          const cityMatch = playbook.market_city?.toLowerCase().includes(query);
          const stateMatch = playbook.market_state?.toLowerCase().includes(query);
          return titleMatch || cityMatch || stateMatch;
        });
      }
    }

    // Tier filter
    if (filters.tiers.length > 0) {
      filtered = filtered.filter((playbook) =>
        playbook.tier_label && filters.tiers.includes(playbook.tier_label)
      );
    }

    // Team size filter
    if (filters.teamSizes.length > 0) {
      filtered = filtered.filter((playbook) =>
        playbook.team_size && filters.teamSizes.includes(playbook.team_size)
      );
    }

    // Duration filter
    if (filters.durations.length > 0) {
      filtered = filtered.filter((playbook) => {
        if (!playbook.duration_minutes) return false;
        
        const minutes = playbook.duration_minutes;
        return filters.durations.some((duration) => {
          if (duration === "< 30 min") return minutes < 30;
          if (duration === "30-60 min") return minutes >= 30 && minutes <= 60;
          if (duration === "1-2 hours") return minutes > 60 && minutes <= 120;
          if (duration === "2+ hours") return minutes > 120;
          return false;
        });
      });
    }

    // Sort
    switch (filters.sortBy) {
      case "new":
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "price-low":
        filtered.sort((a, b) => (a.price_usd || 0) - (b.price_usd || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price_usd || 0) - (a.price_usd || 0));
        break;
      case "popular":
      default:
        // For popular, we could add a view_count or purchase_count field later
        // For now, keep the default order
        break;
    }

    return filtered;
  }, [playbooks, searchQuery, filters]);
};
