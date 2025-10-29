import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { BookMockup } from "./BookMockup";
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
    <section className="relative overflow-hidden">
      {/* Soft radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-white dark:from-blue-950/10 dark:via-gray-950 dark:to-gray-900" />
      
      {/* Optional subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.05)_100%)]" />

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Split-screen layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-12 items-center mb-12">
            {/* LEFT: Book Mockup */}
            <div className="flex justify-center lg:justify-end">
              <BookMockup />
            </div>
            
            {/* RIGHT: Text Content */}
            <div className="text-content space-y-6 max-w-[600px] mx-auto lg:mx-0 text-center lg:text-left">
              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground"
              >
                Agent Playbooks
              </motion.h1>

              {/* Subheadline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-xl md:text-2xl lg:text-3xl font-medium text-foreground/90"
              >
                Hear from successful agents and what they're doing that's working right now.
              </motion.h2>

              {/* Body paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-base md:text-lg text-muted-foreground leading-relaxed"
              >
                Discover what top agents are actually doing to grow — straight from the field.
                {" "}
                <strong className="text-foreground">Agent Playbooks</strong> gives you unfiltered, step-by-step systems that are working in markets just like yours.
              </motion.p>

              {/* Pain-point callout */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-sm italic text-muted-foreground/80"
              >
                Are you tired of listening to coaches who haven't sold a home in years?
              </motion.p>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="text-base font-bold text-primary"
              >
                Built for agents who want real answers, not recycled advice.
              </motion.p>
            </div>
          </div>
          
          {/* BOTTOM: Full-width search bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative max-w-3xl mx-auto"
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
            >
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
              <Input
                type="text"
                placeholder="🔍 Search by agent, title, or market (e.g., Beverly Hills, CA)"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-14 pr-6 h-14 text-base bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-full hover:border-primary/40 focus:border-primary transition-all shadow-lg focus:shadow-xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Optional: "Powered by Circle" Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 right-8 text-xs text-muted-foreground items-center gap-2 hidden lg:flex"
      >
        <span>Powered by</span>
        <span className="font-bold text-primary">Circle Network</span>
      </motion.div>
    </section>
  );
};
