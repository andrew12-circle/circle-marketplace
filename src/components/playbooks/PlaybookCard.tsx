import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, TrendingUp, ShieldCheck } from "lucide-react";
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

  const isVerified = playbook.production_units_l12m && playbook.production_units_l12m > 0;
  const hasMemberDiscount = playbook.member_price_usd && playbook.price_usd && playbook.member_price_usd < playbook.price_usd;
  const savingsPercent = hasMemberDiscount 
    ? Math.round(((playbook.price_usd! - playbook.member_price_usd!) / playbook.price_usd!) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer",
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-card via-card to-card/80 border border-border/40",
        "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-500 ease-out",
        "aspect-[2/3]"
      )}
    >
      {/* Cover Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10">
        {playbook.cover_url ? (
          <img
            src={playbook.cover_url}
            alt={playbook.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
      </div>

      {/* Badges Row - Top */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {playbook.tier_label && (
            <Badge className="text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600 backdrop-blur-sm shadow-lg">
              {playbook.tier_label}
            </Badge>
          )}
          {isVerified && (
            <Badge className="text-xs font-medium bg-emerald-500/90 text-white border-0 backdrop-blur-sm shadow-lg gap-1">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
        {hasMemberDiscount && (
          <Badge className="text-xs font-semibold bg-amber-500/95 text-white border-0 backdrop-blur-sm shadow-lg">
            Save {savingsPercent}%
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 space-y-3 z-10">
        {/* Title */}
        <h3 className="text-xl md:text-2xl font-semibold text-white line-clamp-2 leading-tight">
          {playbook.title}
        </h3>

        {/* Agent Info with Headshot */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-white/60 shadow-lg">
            <AvatarImage src={playbook.agent_headshot_url || undefined} />
            <AvatarFallback className="text-xs">{getInitials(playbook.agent_name)}</AvatarFallback>
          </Avatar>
          <p className="text-base font-medium text-white/95">
            {playbook.agent_name || "Unknown Agent"}
          </p>
        </div>

        {/* Production Metrics - Prominent */}
        {playbook.production_units_l12m && playbook.production_volume_l12m && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-white/95 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
            <TrendingUp className="h-4 w-4" />
            <span>{playbook.production_units_l12m} units • {formatCurrency(playbook.production_volume_l12m)}</span>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-xs text-white/80">
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

        {/* Pricing Info */}
        {playbook.price_usd && (
          <div className="text-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {formatCurrency(hasMemberDiscount ? playbook.member_price_usd : playbook.price_usd)}
              </span>
              {hasMemberDiscount && (
                <span className="text-sm text-white/60 line-through">
                  {formatCurrency(playbook.price_usd)}
                </span>
              )}
            </div>
            {hasMemberDiscount && (
              <p className="text-xs text-blue-300">Circle Pro member price</p>
            )}
          </div>
        )}

        {/* Action (shows on hover) */}
        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-fade-in">
          <Button
            size="sm"
            variant="secondary"
            className="w-full bg-white/95 text-foreground hover:bg-white backdrop-blur-sm font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Preview & Buy
          </Button>
        </div>
      </div>
    </div>
  );
};
