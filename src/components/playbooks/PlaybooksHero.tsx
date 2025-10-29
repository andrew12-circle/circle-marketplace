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
    <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 overflow-hidden">
      {/* Background accent elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
            Learn. Listen.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Discover.</span>
            <br />
            <span className="text-muted-foreground text-3xl md:text-4xl lg:text-5xl">All in one place.</span>
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Agent Playbooks is your destination to discover proven strategies from top-producing agents still in the field. No fluff. Just the plays that move deals in markets like yours.
          </p>

          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Search playbooks"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-14 h-12 text-base bg-background/80 backdrop-blur-sm border-border/40 rounded-full hover:bg-background transition-colors focus:bg-background shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
