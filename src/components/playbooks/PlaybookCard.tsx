import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  duration_minutes: number | null;
  tier_label: string | null;
  price_usd: number | null;
  member_price_usd: number | null;
}

interface PlaybookCardProps {
  playbook: Playbook;
  onClick: () => void;
}

export const PlaybookCard = ({ playbook, onClick }: PlaybookCardProps) => {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    const parts = name.split(" ");
    return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer",
        "rounded-2xl overflow-hidden",
        "bg-card border border-border",
        "hover:shadow-xl hover:scale-[1.02] transition-all duration-300",
        "aspect-[3/4]"
      )}
    >
      {/* Cover Image */}
      <div className="absolute inset-0">
        {playbook.cover_url ? (
          <img
            src={playbook.cover_url}
            alt={playbook.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Agent Headshot Chip */}
      <div className="absolute top-3 right-3 z-10">
        <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
          <AvatarImage src={playbook.agent_headshot_url || undefined} />
          <AvatarFallback>{getInitials(playbook.agent_name)}</AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 space-y-2 z-10">
        {/* Title */}
        <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">
          {playbook.title}
        </h3>

        {/* Agent Name */}
        <p className="text-sm text-white/90 font-medium">
          {playbook.agent_name || "Unknown Agent"}
        </p>

        {/* Pills Row 1: Location & Production */}
        <div className="flex flex-wrap gap-2">
          {playbook.market_city && playbook.market_state && (
            <Badge variant="secondary" className="gap-1 text-xs bg-white/20 text-white border-white/30">
              <MapPin className="h-3 w-3" />
              {playbook.market_city}, {playbook.market_state}
            </Badge>
          )}
          {playbook.production_units_l12m && playbook.production_volume_l12m && (
            <Badge variant="secondary" className="gap-1 text-xs bg-white/20 text-white border-white/30">
              <TrendingUp className="h-3 w-3" />
              {playbook.production_units_l12m} units · {formatCurrency(playbook.production_volume_l12m)}
            </Badge>
          )}
        </div>

        {/* Pills Row 2: Duration & Tier */}
        <div className="flex flex-wrap gap-2">
          {playbook.duration_minutes && (
            <Badge variant="secondary" className="gap-1 text-xs bg-white/20 text-white border-white/30">
              <Clock className="h-3 w-3" />
              {formatDuration(playbook.duration_minutes)}
            </Badge>
          )}
          {playbook.tier_label && (
            <Badge className="text-xs bg-primary text-primary-foreground">
              {playbook.tier_label}
            </Badge>
          )}
        </div>

        {/* Preview Button (shows on hover) */}
        <Button
          size="sm"
          className="w-full opacity-0 group-hover:opacity-100 transition-opacity mt-3"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Preview
        </Button>
      </div>
    </div>
  );
};
