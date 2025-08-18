import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  TrendingUp, 
  Zap, 
  Award, 
  Clock, 
  Shield, 
  Flame,
  Crown,
  Heart,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service } from "@/hooks/useMarketplaceData";
import { useTrendingServices } from "@/hooks/useTrendingServices";

interface ServiceBadgesProps {
  service: Service;
  variant?: 'default' | 'compact';
  maxBadges?: number;
  className?: string;
}

export const ServiceBadges = ({ 
  service, 
  variant = 'default',
  maxBadges = 3,
  className = ""
}: ServiceBadgesProps) => {
  const { isTrending, isBestseller } = useTrendingServices();
  const badges = [];

  // Priority order for badges
  if (service.is_featured) {
    badges.push({
      label: 'Featured',
      icon: <Star className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0',
      priority: 1
    });
  }

  if (service.is_top_pick) {
    badges.push({
      label: 'Top Pick',
      icon: <Crown className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0',
      priority: 2
    });
  }

  if (service.vendor?.is_verified) {
    badges.push({
      label: 'Verified',
      icon: <Shield className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
      priority: 3
    });
  }

  // Check if trending based on performance data
  if (isTrending(service.id)) {
    badges.push({
      label: 'Trending',
      icon: <TrendingUp className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0',
      priority: 4
    });
  }

  // Bestseller (high sales performance)
  if (isBestseller(service.id)) {
    badges.push({
      label: 'Bestseller',
      icon: <Flame className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0',
      priority: 5
    });
  }

  // Fast response (based on support hours)
  if (service.vendor?.support_hours?.includes('24/7') || service.vendor?.support_hours?.includes('24')) {
    badges.push({
      label: '24/7',
      icon: <Clock className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0',
      priority: 6
    });
  }

  // Instant quote
  if (service.requires_quote === false) {
    badges.push({
      label: 'Instant',
      icon: <Zap className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0',
      priority: 7
    });
  }


  // High ROI
  if (service.estimated_roi && service.estimated_roi >= 300) {
    badges.push({
      label: 'High ROI',
      icon: <Target className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-green-600 to-lime-500 text-white border-0',
      priority: 9
    });
  }

  // New service (created in last 30 days) - mock for now
  const isNew = Math.random() < 0.1; // 10% chance for demo
  if (isNew) {
    badges.push({
      label: 'New',
      icon: <Zap className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0',
      priority: 10
    });
  }

  // Sort by priority and limit
  const sortedBadges = badges
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxBadges);

  if (sortedBadges.length === 0) {
    return null;
  }

  const badgeSize = variant === 'compact' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {sortedBadges.map((badge, index) => (
        <Badge
          key={badge.label}
          className={cn(
            badgeSize,
            "flex items-center gap-1 font-medium shadow-sm",
            badge.className
          )}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </Badge>
      ))}
    </div>
  );
};