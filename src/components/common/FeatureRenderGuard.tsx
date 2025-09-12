import React from "react";
import { CheckCircle } from "lucide-react";

interface Feature {
  text: string;
  included: boolean;
  id?: any;
}

interface FeatureRenderGuardProps {
  features: Feature[] | string[] | any[];
  expandedFeatures?: { [key: string]: boolean };
  packageId: string;
  maxInitialFeatures?: number;
  onToggleExpanded?: (packageId: string) => void;
}

/**
 * Safe feature renderer that handles both string and object features
 * with proper error boundaries and type checking
 */
export const FeatureRenderGuard: React.FC<FeatureRenderGuardProps> = ({
  features,
  expandedFeatures = {},
  packageId,
  maxInitialFeatures = 4,
  onToggleExpanded
}) => {
  // Normalize features to consistent format
  const normalizedFeatures = React.useMemo(() => {
    if (!Array.isArray(features)) return [];
    
    return features
      .map((f, i) => {
        if (typeof f === 'string') return { text: f, included: true, id: i };
        if (f && typeof f === 'object' && f.text) {
          return { 
            text: String(f.text).trim(), 
            included: f.included !== false, 
            id: f.id ?? i 
          };
        }
        return null;
      })
      .filter((f): f is Required<Feature> => f !== null && f.text.length > 0);
  }, [features]);

  const isExpanded = expandedFeatures[packageId];
  const displayFeatures = isExpanded 
    ? normalizedFeatures 
    : normalizedFeatures.slice(0, maxInitialFeatures);

  const hasMoreFeatures = normalizedFeatures.length > maxInitialFeatures;

  return (
    <div className="space-y-3">
      {displayFeatures.map((feature, idx) => (
        <div key={feature.id ?? idx} className="flex items-start gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span className={`text-gray-600 ${!feature.included ? 'line-through opacity-60' : ''}`}>
            {feature.text}
          </span>
        </div>
      ))}
      
      {hasMoreFeatures && onToggleExpanded && (
        <div 
          className="text-sm text-blue-500 hover:text-blue-600 text-center cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded(packageId);
          }}
        >
          {isExpanded 
            ? `Show Less` 
            : `Show ${normalizedFeatures.length - maxInitialFeatures} More Features`
          }
        </div>
      )}
    </div>
  );
};