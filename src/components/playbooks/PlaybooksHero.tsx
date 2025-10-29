import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type FilterState } from "./PlaybooksFilters";

interface PlaybooksHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const PlaybooksHero = ({
  searchQuery,
  onSearchChange,
}: PlaybooksHeroProps) => {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight">
            Learn. Listen.
            <br />
            Discover.
            <br />
            <span className="text-muted-foreground">All in one place.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Agent Playbooks is your destination to discover proven strategies from top-producing agents still in the field. No fluff. Just the plays that move deals in markets like yours. All with no subscription or monthly commitment.
          </p>

          <div className="relative max-w-xl mx-auto mt-12">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Search playbooks"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-14 h-12 text-base bg-muted/30 border-border/40 rounded-full hover:bg-muted/50 transition-colors focus:bg-background"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
