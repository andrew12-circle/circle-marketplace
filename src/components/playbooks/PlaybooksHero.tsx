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
    <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Agent Playbooks
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Hear from top producing agents who are still in the field. No fluff. Just the plays that move deals in markets like yours.
          </p>

          <div className="relative max-w-2xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title or location"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-14 text-base bg-background/80 backdrop-blur border-border/50 shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
