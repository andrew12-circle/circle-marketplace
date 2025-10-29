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
        "bg-card border border-border/40",
        "hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-out",
        "aspect-[2/3]"
      )}
    >
      {/* Cover Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10">
        {playbook.cover_url ? (
          <img
            src={playbook.cover_url}
            alt={playbook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Tier Badge - Top Left */}
      {playbook.tier_label && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="text-xs font-medium bg-white/95 text-foreground hover:bg-white backdrop-blur-sm shadow-lg">
            {playbook.tier_label}
          </Badge>
        </div>
      )}

      {/* Agent Headshot - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <Avatar className="h-10 w-10 border-2 border-white/80 shadow-xl ring-2 ring-white/20">
          <AvatarImage src={playbook.agent_headshot_url || undefined} />
          <AvatarFallback className="text-xs">{getInitials(playbook.agent_name)}</AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-5 space-y-3 z-10">
        {/* Title */}
        <h3 className="text-xl font-semibold text-white line-clamp-2 leading-snug">
          {playbook.title}
        </h3>

        {/* Agent Name */}
        <p className="text-sm text-white/80 font-normal">
          by {playbook.agent_name || "Unknown Agent"}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-2 text-xs text-white/70">
          {playbook.market_city && playbook.market_state && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{playbook.market_city}, {playbook.market_state}</span>
            </div>
          )}
          {playbook.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(playbook.duration_minutes)}</span>
            </div>
          )}
        </div>

        {playbook.production_units_l12m && playbook.production_volume_l12m && (
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <TrendingUp className="h-3 w-3" />
            <span>{playbook.production_units_l12m} units • {formatCurrency(playbook.production_volume_l12m)}</span>
          </div>
        )}

        {/* Action (shows on hover) */}
        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="secondary"
            className="w-full bg-white/95 text-foreground hover:bg-white backdrop-blur-sm font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Playbook
          </Button>
        </div>
      </div>
    </div>
  );
};
