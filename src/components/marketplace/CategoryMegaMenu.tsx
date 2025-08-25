import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Building2, Home, Truck, Camera, Briefcase, AlertTriangle, Shield, CheckCircle, Store, Users, MapPin, ShoppingBag, Monitor, Target, Settings, GraduationCap, FileText } from "lucide-react";
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

// Product categories for realtors
const PRODUCT_CATEGORIES = [
  {
    id: 'marketing-materials',
    name: 'Marketing Materials',
    subcategories: [
      'Business Cards',
      'Yard Signs', 
      'Open House Signs',
      'Property Flyers',
      'Listing Brochures',
      'Door Hangers',
      'Postcards',
      'Branded Materials'
    ]
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    subcategories: [
      'Facebook Ad Campaigns',
      'Google Ads',
      'Social Media Graphics',
      'Website Templates',
      'Email Marketing Templates',
      'Virtual Tour Software',
      'Professional Photography',
      'Drone Photography'
    ]
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation',
    subcategories: [
      'Zillow Leads',
      'Realtor.com Advertising',
      'Lead Generation Software',
      'CRM Systems',
      'Contact Management Tools',
      'Sphere Marketing Tools',
      'Referral Programs',
      'Expired Listing Data'
    ]
  },
  {
    id: 'technology-tools',
    name: 'Technology & Tools',
    subcategories: [
      'Transaction Management',
      'E-signature Platforms',
      'Market Analysis Tools',
      'Property Valuation Software',
      'Mobile Apps',
      'Client Portal Systems',
      'Document Storage',
      'Communication Tools'
    ]
  },
  {
    id: 'education-training',
    name: 'Education & Training',
    subcategories: [
      'Business Coaching',
      'Sales Training Courses',
      'Leadership Training',
      'Market Expertise Training',
      'Real Estate Coaching',
      'Legal Compliance Training',
      'Technology Training',
      'Negotiation Skills',
      'Listing Presentation Tools',
      'Buyer Consultation Training',
      'Certification Programs'
    ]
  },
  {
    id: 'office-professional',
    name: 'Office & Professional',
    subcategories: [
      'Professional Headshots',
      'Office Supplies',
      'Client Gifts',
      'Closing Gifts',
      'Professional Attire',
      'Branded Merchandise',
      'Office Equipment',
      'File Organization Systems'
    ]
  }
];

interface CategoryMegaMenuProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  viewMode?: 'services' | 'products' | 'vendors';
  serviceCategories?: string[]; // Add this for actual service categories
}

const getIconForCategory = (categoryId: string, viewMode: 'services' | 'products' | 'vendors' = 'services') => {
  if (viewMode === 'products') {
    switch (categoryId) {
      case 'marketing-materials':
        return FileText;
      case 'digital-marketing':
        return Monitor;
      case 'lead-generation':
        return Target;
      case 'technology-tools':
        return Settings;
      case 'education-training':
        return GraduationCap;
      case 'office-professional':
        return Briefcase;
      default:
        return ShoppingBag;
    }
  } else if (viewMode === 'vendors') {
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

export const CategoryMegaMenu = ({ selectedCategory, onCategorySelect, viewMode = 'services', serviceCategories = [] }: CategoryMegaMenuProps) => {
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
            {viewMode === 'services' && serviceCategories.length > 0 ? (
              <>
                {/* Old-school Essentials Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-circle-primary" />
                      <h4 className="font-medium text-sm text-foreground">Old-school Essentials</h4>
                    </div>
                  </div>
                   <div className="grid grid-cols-2 gap-1">
                    {['Print & Mail', 'Signage & Branding', 'Presentations', 'Branding', 'Client Event Kits', 'Client Retention', 'Marketing Automation & Content', 'Video & Media Tools', 'Listing & Showing Tools', 'Data & Analytics', 'Finance & Business Tools', 'Productivity & Collaboration', 'Virtual Assistants & Dialers', 'Team & Recruiting Tools', 'CE & Licensing'].map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors flex items-center justify-between ${
                          selectedCategory === category ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{category}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Service Categories from Database */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-circle-primary" />
                      <h4 className="font-medium text-sm text-foreground">All Service Categories</h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {serviceCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors flex items-center justify-between ${
                          selectedCategory === category ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // Show predefined categories for other modes or fallback
              (viewMode === 'services' ? SERVICE_CATEGORIES : viewMode === 'products' ? PRODUCT_CATEGORIES : VENDOR_CATEGORIES).map((category) => {
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
              })
            )}
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