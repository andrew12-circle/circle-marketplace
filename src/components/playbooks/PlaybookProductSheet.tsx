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

  const isVerified = playbook.production_units_l12m && playbook.production_units_l12m > 0;
  const hasMemberDiscount = playbook.member_price_usd && playbook.price_usd && playbook.member_price_usd < playbook.price_usd;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="space-y-8">
            {/* Hero Cover Image - Full Width */}
            <div className="relative w-full h-80 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
              {playbook.cover_url && (
                <img
                  src={playbook.cover_url}
                  alt={playbook.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              
              {/* Badges on cover */}
              <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                {playbook.tier_label && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                    {playbook.tier_label}
                  </Badge>
                )}
                {isVerified && (
                  <Badge className="bg-emerald-500 text-white border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Agent
                  </Badge>
                )}
              </div>
            </div>

            {/* Content with Padding */}
            <div className="px-8 space-y-8">
              {/* Title and Subtitle - Editorial Style */}
              <div className="space-y-4">
                <SheetHeader>
                  <SheetTitle className="text-4xl font-bold leading-tight tracking-tight">
                    {playbook.title}
                  </SheetTitle>
                </SheetHeader>

                <p className="text-xl text-muted-foreground leading-relaxed">
                  {playbook.teaser_one_liner || "Transform your business with proven strategies from a top-producing agent"}
                </p>

                {/* Meta badges */}
                <div className="flex flex-wrap gap-2">
                  {playbook.duration_minutes && (
                    <Badge variant="secondary" className="gap-1.5 text-sm py-1.5 px-3">
                      <Clock className="h-4 w-4" />
                      {playbook.duration_minutes} min listen
                    </Badge>
                  )}
                  {playbook.production_units_l12m && (
                    <Badge variant="secondary" className="gap-1.5 text-sm py-1.5 px-3">
                      <TrendingUp className="h-4 w-4" />
                      {formatNumber(playbook.production_units_l12m)} units L12M
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* About the Agent - Editorial Block */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">About the Agent</h3>
                <div className="flex gap-4 items-start bg-muted/30 rounded-xl p-6">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src={playbook.agent_headshot_url || undefined} />
                    <AvatarFallback className="text-lg">{getInitials(playbook.agent_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-xl font-semibold">{playbook.agent_name}</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {playbook.market_city && playbook.market_state && (
                        <>
                          <MapPin className="h-4 w-4" />
                          <span className="text-base">{playbook.market_city}, {playbook.market_state}</span>
                        </>
                      )}
                    </div>
                    {playbook.production_units_l12m && playbook.production_volume_l12m && (
                      <p className="text-base text-muted-foreground">
                        <span className="font-semibold text-foreground">{formatNumber(playbook.production_units_l12m)} transactions</span> worth <span className="font-semibold text-foreground">{formatCurrency(playbook.production_volume_l12m)}</span> in the last 12 months
                      </p>
                    )}
                    {playbook.team_size && (
                      <p className="text-sm text-muted-foreground">Team Size: <span className="font-medium text-foreground">{playbook.team_size}</span></p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* What You'll Learn - Editorial Style */}
              {outcomes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">What You'll Learn</h3>
                  <ul className="space-y-3">
                    {outcomes.map((outcome: any, index: number) => (
                      <li key={index} className="flex gap-3 text-base leading-relaxed">
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                        <span>{typeof outcome === 'string' ? outcome : outcome.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Niches and Tools */}
              {(niches.length > 0 || toolsUsed.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-6">
                    {niches.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {niches.map((niche: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                              {typeof niche === 'string' ? niche : niche.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {toolsUsed.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Tools & Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {toolsUsed.map((tool: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-sm py-1.5 px-3">
                              {typeof tool === 'string' ? tool : tool.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Proof Section - Testimonial Style */}
              <div className="space-y-4 bg-gradient-to-br from-primary/5 to-primary/10 p-8 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Proof It Works</h3>
                </div>
                <p className="text-lg leading-relaxed">
                  {playbook.production_units_l12m && playbook.production_volume_l12m
                    ? `${playbook.agent_name} closed ${formatNumber(playbook.production_units_l12m)} units totaling ${formatCurrency(playbook.production_volume_l12m)} in the last 12 months using these exact strategies. These aren't theoretical concepts — this is what's working right now in ${playbook.market_city}, ${playbook.market_state}.`
                    : "Proven strategies from a top-performing agent actively working in the field."}
                </p>
              </div>

              {/* Bottom spacer */}
              <div className="h-4" />
            </div>
          </div>
        </ScrollArea>

        {/* Purchase Box - Fixed at bottom - Editorial Style */}
        <div className="border-t bg-gradient-to-b from-background to-muted/20 p-8 space-y-4">
          {/* Prominent Pricing */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold tracking-tight">
                {formatCurrency(playbook.member_price_usd || playbook.price_usd)}
              </span>
              {hasMemberDiscount && (
                <div className="space-y-1">
                  <span className="text-2xl text-muted-foreground line-through">
                    {formatCurrency(playbook.price_usd)}
                  </span>
                  <Badge className="bg-blue-500 text-white ml-2">Circle Pro Price</Badge>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              One-time payment • Lifetime access • All updates included
            </p>
          </div>

          {/* CTA Buttons - Larger & More Prominent */}
          <div className="flex gap-3">
            {playbook.preview_video_url && (
              <Button variant="outline" size="lg" className="flex-1 gap-2 h-14 text-base">
                <Play className="h-5 w-5" />
                Preview
              </Button>
            )}
            <Button size="lg" className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Get This Playbook
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            30-day money-back guarantee • Results vary by market and effort
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
