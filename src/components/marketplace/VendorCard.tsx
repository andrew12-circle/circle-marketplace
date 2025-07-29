import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, MapPin, Award } from "lucide-react";

interface VendorCardProps {
  vendor: {
    id: string;
    company: string;
    category: string;
    retailPrice: number;
    proPrice: number;
    avgAgentCost: number;
    imageUrl?: string;
    rating?: number;
    tags?: string[];
    description?: string;
    coMarketingEligible: boolean;
  };
  onAddToWallet: (vendorId: string) => void;
  onRequestCoMarketing: (vendorId: string) => void;
}

export const VendorCard = ({ vendor, onAddToWallet, onRequestCoMarketing }: VendorCardProps) => {
  const percentSaved = Math.round(((vendor.retailPrice - vendor.proPrice) / vendor.retailPrice) * 100);

  const getTagIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "trending":
        return <TrendingUp className="w-3 h-3" />;
      case "local gem":
        return <MapPin className="w-3 h-3" />;
      case "featured":
        return <Award className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "trending":
        return "bg-circle-accent text-foreground";
      case "local gem":
        return "bg-circle-success text-primary-foreground";
      case "featured":
        return "bg-circle-primary text-primary-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {vendor.imageUrl && (
              <img 
                src={vendor.imageUrl} 
                alt={vendor.company}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold text-sm">{vendor.company}</h3>
              <p className="text-xs text-muted-foreground">{vendor.category}</p>
            </div>
          </div>
          {vendor.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-circle-accent text-circle-accent" />
              <span className="text-sm font-medium">{vendor.rating}</span>
            </div>
          )}
        </div>

        {vendor.tags && vendor.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {vendor.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className={`text-xs ${getTagColor(tag)} flex items-center gap-1`}
              >
                {getTagIcon(tag)}
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {vendor.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Retail Price:</span>
            <span className="text-sm line-through">${vendor.retailPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Circle Pro:</span>
            <span className="text-lg font-bold text-circle-primary">${vendor.proPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Agent Cost:</span>
            <span className="text-sm font-medium">${vendor.avgAgentCost}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-circle-success">You Save:</span>
            <span className="text-sm font-bold text-circle-success">{percentSaved}%</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button 
          onClick={() => onAddToWallet(vendor.id)}
          className="w-full bg-circle-primary hover:bg-circle-primary-light"
        >
          Add to Wallet
        </Button>
        {vendor.coMarketingEligible && (
          <Button 
            variant="outline" 
            onClick={() => onRequestCoMarketing(vendor.id)}
            className="w-full"
          >
            Request Co-Marketing
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};