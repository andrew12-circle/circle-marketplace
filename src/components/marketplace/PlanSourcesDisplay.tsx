import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe } from "lucide-react";

interface Source {
  name: string;
  url: string;
  excerpt: string;
}

interface PlanSourcesDisplayProps {
  sources: Source[];
  className?: string;
}

export function PlanSourcesDisplay({ sources, className }: PlanSourcesDisplayProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <Card className={`p-4 border-border/50 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Market Intelligence Sources</span>
        <Badge variant="secondary" className="text-xs">
          {sources.length} sources
        </Badge>
      </div>
      
      <div className="space-y-3">
        {sources.map((source, index) => (
          <div key={index} className="border-l-2 border-primary/20 pl-3">
            <div className="flex items-center gap-2 mb-1">
              <a 
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                {source.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              {source.excerpt}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}