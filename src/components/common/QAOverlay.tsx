import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Info } from "lucide-react";
import { useABTest, type ABVariant } from "@/hooks/useABTest";
import { useAuth } from "@/contexts/AuthContext";

interface QAOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  currentSortingStrategy?: 'ranked' | 'recent';
}

export const QAOverlay = ({ isVisible, onClose, currentSortingStrategy }: QAOverlayProps) => {
  const { variant: rankingVariant } = useABTest('ranking_v1', { holdout: 0.1 });
  const { variant: sponsoredVariant } = useABTest('sponsored-placements', { holdout: 0.1 });
  const { profile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (isVisible) {
      setDebugInfo({
        timestamp: new Date().toISOString(),
        userId: profile?.user_id,
        isAdmin: profile?.is_admin,
        rankingAB: rankingVariant,
        sponsoredAB: sponsoredVariant,
        activeSorting: currentSortingStrategy,
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 50) + '...'
      });
    }
  }, [isVisible, rankingVariant, sponsoredVariant, currentSortingStrategy, profile]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-sm">QA Debug Info</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-medium">Ranking A/B:</span>{' '}
          <Badge variant={rankingVariant === 'ranked' ? 'default' : 'secondary'}>
            {rankingVariant}
          </Badge>
        </div>
        
        <div>
          <span className="font-medium">Active Sorting:</span>{' '}
          <Badge variant={currentSortingStrategy === 'ranked' ? 'default' : 'secondary'}>
            {currentSortingStrategy}
          </Badge>
        </div>
        
        <div>
          <span className="font-medium">Sponsored A/B:</span>{' '}
          <Badge variant={sponsoredVariant === 'ranked' ? 'default' : 'secondary'}>
            {sponsoredVariant}
          </Badge>
        </div>
        
        {profile?.is_admin && (
          <div>
            <span className="font-medium">Admin:</span>{' '}
            <Badge variant="outline" className="text-green-600 border-green-300">
              Yes
            </Badge>
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            User: {debugInfo.userId?.substring(0, 8)}...
          </div>
          <div className="text-xs text-gray-500">
            {debugInfo.timestamp?.substring(11, 19)}
          </div>
        </div>
      </div>
    </div>
  );
};