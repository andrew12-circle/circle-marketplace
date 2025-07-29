import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Building2, Home, Truck, Camera, Briefcase, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { SERVICE_CATEGORIES, getRiskBadge } from "./RESPAComplianceSystem";

interface CategoryMegaMenuProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const getIconForCategory = (categoryId: string) => {
  switch (categoryId) {
    case 'settlement-services':
      return Building2;
    case 'home-services':
      return Home;
    case 'moving-relocation':
      return Truck;
    case 'property-services':
      return Camera;
    case 'professional-services':
      return Briefcase;
    default:
      return Building2;
  }
};

export const CategoryMegaMenu = ({ selectedCategory, onCategorySelect }: CategoryMegaMenuProps) => {
  const [open, setOpen] = useState(false);

  const handleCategorySelect = (category: string) => {
    onCategorySelect(category);
    setOpen(false);
  };

  const getDisplayText = () => {
    if (selectedCategory === "all") return "All Categories";
    return selectedCategory;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {getDisplayText()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0 z-50" align="start">
        <div className="bg-background border rounded-lg shadow-lg">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Select Category</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleCategorySelect("all")}
                className={selectedCategory === "all" ? "bg-accent" : ""}
              >
                All Categories
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 p-6">
            {SERVICE_CATEGORIES.map((category) => {
              const Icon = getIconForCategory(category.id);
              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-circle-primary" />
                      <h4 className="font-medium text-sm text-foreground">{category.name}</h4>
                    </div>
                    {getRiskBadge(category.riskLevel)}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {category.subcategories.map((subcategory) => {
                      const itemCount = Math.floor(Math.random() * 50) + 5; // Mock count
                      return (
                        <button
                          key={subcategory}
                          onClick={() => handleCategorySelect(subcategory)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors flex items-center justify-between ${
                            selectedCategory === subcategory ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span>{subcategory}</span>
                          <span className="text-xs bg-muted px-1 rounded">({itemCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedCategory && selectedCategory !== "all" && (
            <div className="p-4 border-t bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  <Badge variant="secondary">{selectedCategory}</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleCategorySelect("all")}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};