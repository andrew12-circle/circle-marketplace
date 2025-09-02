import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";

interface NoVendorsCardProps {
  onBrowseCategories?: () => void;
}

export const NoVendorsCard = ({ onBrowseCategories }: NoVendorsCardProps) => {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Vendors Coming Online Soon
          </h3>
          <p className="text-sm text-muted-foreground">
            We're adding new vendor partners daily. Check back soon or browse our other categories.
          </p>
        </div>

        {onBrowseCategories && (
          <Button onClick={onBrowseCategories} variant="outline" className="w-full">
            Browse Categories
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};