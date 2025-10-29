import { motion } from "framer-motion";

export const MarketCarousel = () => {
  const markets = [
    "Nashville", "Scottsdale", "Austin", "Miami", "Charlotte",
    "Phoenix", "Denver", "Dallas", "Seattle", "Portland"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="py-4 border-t border-border/50 bg-background/50 backdrop-blur-sm"
    >
      <div className="container mx-auto px-4">
        <p className="text-xs text-muted-foreground text-center">
          Now featuring playbooks from:{" "}
          {markets.map((market, idx) => (
            <span key={market}>
              <span className="font-medium text-foreground">{market}</span>
              {idx < markets.length - 1 && " • "}
            </span>
          ))}
        </p>
      </div>
    </motion.div>
  );
};
