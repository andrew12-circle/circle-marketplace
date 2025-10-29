import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, TrendingUp, CheckCircle2, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface PlaybookProductSheetProps {
  playbookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaybookProductSheet = ({
  playbookId,
  open,
  onOpenChange,
}: PlaybookProductSheetProps) => {
  const { data: playbook, isLoading } = useQuery({
    queryKey: ["playbook", playbookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbooks")
        .select("*")
        .eq("id", playbookId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number | null) => {
    if (!num) return "0";
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <div className="space-y-4 py-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!playbook) return null;

  const outcomes = Array.isArray(playbook.outcomes) ? playbook.outcomes : [];
  const toolsUsed = Array.isArray(playbook.tools_used) ? playbook.tools_used : [];
  const niches = Array.isArray(playbook.niches) ? playbook.niches : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header Block */}
            <div className="flex gap-4">
              {/* Cover Image */}
              <div className="w-32 h-44 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5">
                {playbook.cover_url && (
                  <img
                    src={playbook.cover_url}
                    alt={playbook.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Title and Agent Info */}
              <div className="flex-1 space-y-3">
                <SheetHeader>
                  <SheetTitle className="text-2xl leading-tight">
                    {playbook.title}
                  </SheetTitle>
                </SheetHeader>

                <p className="text-muted-foreground">
                  {playbook.teaser_one_liner || "Transform your business with proven strategies"}
                </p>

                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={playbook.agent_headshot_url || undefined} />
                    <AvatarFallback>{getInitials(playbook.agent_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{playbook.agent_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {playbook.market_city && playbook.market_state && (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span>{playbook.market_city}, {playbook.market_state}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap gap-2">
                  {playbook.tier_label && (
                    <Badge variant="default">{playbook.tier_label}</Badge>
                  )}
                  {playbook.duration_minutes && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {playbook.duration_minutes} min
                    </Badge>
                  )}
                  {playbook.production_units_l12m && (
                    <Badge variant="outline" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatNumber(playbook.production_units_l12m)} units
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* What You'll Learn */}
            {outcomes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">What You'll Learn</h3>
                <ul className="space-y-2">
                  {outcomes.map((outcome: any, index: number) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{typeof outcome === 'string' ? outcome : outcome.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Agent at a Glance */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Agent at a Glance</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {playbook.production_units_l12m && playbook.production_volume_l12m && (
                  <div>
                    <p className="text-muted-foreground">Production (L12M)</p>
                    <p className="font-medium">
                      {formatNumber(playbook.production_units_l12m)} units · {formatCurrency(playbook.production_volume_l12m)}
                    </p>
                  </div>
                )}
                {playbook.team_size && (
                  <div>
                    <p className="text-muted-foreground">Team Size</p>
                    <p className="font-medium">{playbook.team_size}</p>
                  </div>
                )}
              </div>

              {niches.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Niches</p>
                  <div className="flex flex-wrap gap-2">
                    {niches.map((niche: any, index: number) => (
                      <Badge key={index} variant="secondary">
                        {typeof niche === 'string' ? niche : niche.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {toolsUsed.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Tools They Use</p>
                  <div className="flex flex-wrap gap-2">
                    {toolsUsed.map((tool: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {typeof tool === 'string' ? tool : tool.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Proof Section */}
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Proof It Works</h3>
              <p className="text-sm text-muted-foreground">
                {playbook.production_units_l12m && playbook.production_volume_l12m
                  ? `Agent closed ${formatNumber(playbook.production_units_l12m)} units totaling ${formatCurrency(playbook.production_volume_l12m)} in the last 12 months using these exact strategies.`
                  : "Proven strategies from a top-performing agent in the field."}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Purchase Box - Fixed at bottom */}
        <div className="border-t bg-background p-6 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {formatCurrency(playbook.member_price_usd || playbook.price_usd)}
                </span>
                {playbook.member_price_usd && playbook.price_usd && playbook.member_price_usd < playbook.price_usd && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(playbook.price_usd)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Includes lifetime access and updates
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {playbook.preview_video_url && (
              <Button variant="outline" className="flex-1 gap-2">
                <Play className="h-4 w-4" />
                Preview
              </Button>
            )}
            <Button className="flex-1">
              Get this playbook
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Results vary by market and effort.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
