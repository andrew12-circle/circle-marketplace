import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCw, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MarketplaceSortingControlsProps {
  currentStrategy: 'ranked' | 'recent';
  onStrategyChange: (strategy: 'ranked' | 'recent') => void;
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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sorting Strategy Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sorting by:</span>
        <Badge 
          variant={currentStrategy === 'ranked' ? 'default' : 'secondary'}
          className="flex items-center gap-1"
        >
          {currentStrategy === 'ranked' ? (
            <>
              <TrendingUp className="h-3 w-3" />
              Ranked
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              Newest
            </>
          )}
        </Badge>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStrategyChange(currentStrategy === 'ranked' ? 'recent' : 'ranked')}
          >
            {currentStrategy === 'ranked' ? 'Show Newest' : 'Show Ranked'}
          </Button>
          
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
        </div>
      )}
    </div>
  );
};