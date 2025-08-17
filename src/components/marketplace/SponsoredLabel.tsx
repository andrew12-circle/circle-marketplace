import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SponsoredLabelProps {
  className?: string;
  variant?: 'default' | 'small' | 'minimal';
}

export const SponsoredLabel = ({ className = '', variant = 'default' }: SponsoredLabelProps) => {
  const baseClasses = "bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 hover:bg-white/95 transition-colors";
  
  const variantClasses = {
    default: "text-xs px-2 py-1",
    small: "text-xs px-1.5 py-0.5",
    minimal: "text-xs px-1 py-0.5"
  };

  return (
    <Badge 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label="Sponsored content"
    >
      <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
      Sponsored
    </Badge>
  );
};