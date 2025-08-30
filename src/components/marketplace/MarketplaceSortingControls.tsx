import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCw, TrendingUp, Clock, DollarSign, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MarketplaceSortingControlsProps {
  currentStrategy: 'ranked' | 'recent' | 'price-low' | 'price-high';
  onStrategyChange: (strategy: 'ranked' | 'recent' | 'price-low' | 'price-high') => void;
  isAdmin?: boolean;
}

export const MarketplaceSortingControls = ({ 
  currentStrategy, 
  onStrategyChange, 
  isAdmin 
}: MarketplaceSortingControlsProps) => {
  const { toast } = useToast();
  const [isReranking, setIsReranking] = useState(false);

  const handleRerank = async () => {
    if (!isAdmin) return;
    
    setIsReranking(true);
    try {
      const { error } = await supabase.functions.invoke('auto-rerank-services');
      if (error) throw error;
      
      toast({
        title: "Reranking Complete",
        description: "Services have been re-ranked based on latest metrics.",
      });
    } catch (error) {
      console.error('Rerank error:', error);
      toast({
        title: "Rerank Failed",
        description: "Failed to trigger service reranking.",
        variant: "destructive",
      });
    } finally {
      setIsReranking(false);
    }
  };

  const getSortLabel = () => {
    switch (currentStrategy) {
      case 'ranked': return { icon: TrendingUp, label: 'Ranked' };
      case 'recent': return { icon: Clock, label: 'Newest' };
      case 'price-low': return { icon: DollarSign, label: 'Price: Low to High' };
      case 'price-high': return { icon: DollarSign, label: 'Price: High to Low' };
      default: return { icon: TrendingUp, label: 'Ranked' };
    }
  };

  const { icon: SortIcon, label } = getSortLabel();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Sort By Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={currentStrategy} onValueChange={onStrategyChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <SortIcon className="h-4 w-4" />
                {label}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ranked">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ranked
              </div>
            </SelectItem>
            <SelectItem value="recent">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Newest
              </div>
            </SelectItem>
            <SelectItem value="price-low">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price: Low to High
              </div>
            </SelectItem>
            <SelectItem value="price-high">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price: High to Low
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRerank}
          disabled={isReranking}
          className="flex items-center gap-1"
        >
          <RotateCw className={`h-3 w-3 ${isReranking ? 'animate-spin' : ''}`} />
          {isReranking ? 'Reranking...' : 'Rerank Now'}
        </Button>
      )}
    </div>
  );
};