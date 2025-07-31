import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Building2, Home, Truck, Camera, Briefcase, AlertTriangle, Shield, CheckCircle, Store, Users, MapPin } from "lucide-react";
import { SERVICE_CATEGORIES, getRiskBadge } from "./RESPAComplianceSystem";

// Vendor categories - different from service categories
const VENDOR_CATEGORIES = [
  {
    id: 'mortgage-lenders',
    name: 'Mortgage & Finance',
    subcategories: [
      'Mortgage Lenders',
      'Credit Unions', 
      'Private Lenders',
      'Loan Officers'
    ]
  },
  {
    id: 'title-escrow',
    name: 'Title & Escrow',
    subcategories: [
      'Title Companies',
      'Escrow Services',
      'Real Estate Attorneys'
    ]
  },
  {
    id: 'inspections-appraisals',
    name: 'Inspections & Appraisals',
    subcategories: [
      'Home Inspectors',
      'Appraisers',
      'Specialty Inspectors'
    ]
  },
  {
    id: 'home-services-vendors',
    name: 'Home Services',
    subcategories: [
      'Contractors',
      'Handyman Services',
      'HVAC Companies',
      'Plumbers',
      'Electricians',
      'Landscapers'
    ]
  },
  {
    id: 'insurance-vendors',
    name: 'Insurance & Protection',
    subcategories: [
      'Home Insurance',
      'Home Warranty',
      'Security Companies'
    ]
  },
  {
    id: 'moving-storage-vendors',
    name: 'Moving & Storage',
    subcategories: [
      'Moving Companies',
      'Storage Facilities',
      'Relocation Services'
    ]
  },
  {
    id: 'marketing-vendors',
    name: 'Marketing & Media',
    subcategories: [
      'Marketing Agencies',
      'Photographers',
      'Videographers',
      'Print Shops',
      'Sign Companies'
    ]
  }
];

interface CategoryMegaMenuProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  viewMode?: 'services' | 'products' | 'vendors';
}

const getIconForCategory = (categoryId: string, viewMode: 'services' | 'products' | 'vendors' = 'services') => {
  if (viewMode === 'vendors') {
    switch (categoryId) {
      case 'mortgage-lenders':
        return Building2;
      case 'title-escrow':
        return Shield;
      case 'inspections-appraisals':
        return CheckCircle;
      case 'home-services-vendors':
        return Home;
      case 'insurance-vendors':
        return Shield;
      case 'moving-storage-vendors':
        return Truck;
      case 'marketing-vendors':
        return Camera;
      default:
        return Store;
    }
  } else {
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
  }
};

export const CategoryMegaMenu = ({ selectedCategory, onCategorySelect, viewMode = 'services' }: CategoryMegaMenuProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const handleCategorySelect = (category: string) => {
    onCategorySelect(category);
    setOpen(false);
  };

  const getDisplayText = () => {
    if (selectedCategory === "all") return t('allCategories');
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
      <PopoverContent className="w-[800px] p-0 z-50 bg-background border shadow-lg" align="start" side="bottom" sideOffset={5}>
        <div className="bg-background border rounded-lg shadow-lg relative z-10">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{t('selectCategory')}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleCategorySelect("all")}
                className={selectedCategory === "all" ? "bg-accent" : ""}
              >
                {t('allCategories')}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 p-6">
            {(viewMode === 'services' ? SERVICE_CATEGORIES : VENDOR_CATEGORIES).map((category) => {
              const Icon = getIconForCategory(category.id, viewMode);
              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-circle-primary" />
                      <h4 className="font-medium text-sm text-foreground">{category.name}</h4>
                    </div>
                    {viewMode === 'services' && 'riskLevel' in category && getRiskBadge((category as any).riskLevel)}
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