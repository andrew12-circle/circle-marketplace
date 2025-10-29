import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type FilterState } from "./PlaybooksFilters";
import { motion } from "framer-motion";

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
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-[120px] relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-[1.8rem] md:text-[2.5rem] lg:text-[3rem] font-bold tracking-tight leading-tight"
          >
            Tired of being coached by people who stopped selling years ago?
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="text-base md:text-lg font-normal text-[#555] dark:text-[rgba(255,255,255,0.7)] max-w-[60%] mx-auto leading-relaxed"
          >
            Discover what today's top agents are actually doing to grow — straight from the field.
            <br />
            <strong className="font-medium">Agent Playbooks</strong> gives you the unfiltered, step-by-step systems that are working right now in markets just like yours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="relative max-w-xl mx-auto mt-8"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Search by title, agent, or market (e.g., Phoenix, AZ)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-14 h-12 text-base bg-background/80 backdrop-blur-sm border-border/40 rounded-full hover:bg-background transition-colors focus:bg-background shadow-lg"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="text-xs text-muted-foreground mt-3"
          >
            <strong className="font-semibold text-foreground">78 playbooks</strong> from active agents across{" "}
            <strong className="font-semibold text-foreground">22 markets</strong> — updated weekly.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
            className="text-sm italic text-[#6b7280] dark:text-gray-400 tracking-wide mt-4"
          >
            Built for agents who want real answers — not recycled advice.
          </motion.p>
        </div>
      </div>
    </section>
  );
};
