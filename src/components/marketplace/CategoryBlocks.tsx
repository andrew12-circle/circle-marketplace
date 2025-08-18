import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Search, 
  GraduationCap, 
  Gift, 
  Camera, 
  Video, 
  Mail,
  FileText,
  Presentation,
  Palette,
  Globe
} from "lucide-react";
import { logger } from "@/utils/logger";
import { useMemo } from "react";
import { type Service } from "@/hooks/useMarketplaceData";

interface CategoryBlocksProps {
  onCategoryClick: (searchTerm: string, categoryName: string) => void;
  services: Service[];
}

// Digital-first categories - for tech-savvy realtors focused on fast growth
const DIGITAL_CATEGORIES = [
  {
    name: "CRMs",
    icon: Users,
    tags: ["cat:crms"],
    description: "Customer Management",
    color: "bg-blue-500",
    iconColor: "text-white"
  },
  {
    name: "Ads & Lead Gen", 
    icon: TrendingUp,
    tags: ["cat:ads-lead-gen"],
    description: "Digital Advertising",
    color: "bg-green-500",
    iconColor: "text-white"
  },
  {
    name: "Website / IDX",
    icon: Globe,
    tags: ["cat:website-idx"],
    description: "Websites & Property Search",
    color: "bg-cyan-500",
    iconColor: "text-white"
  },
  {
    name: "SEO",
    icon: Search,
    tags: ["cat:seo"],
    description: "Search Optimization",
    color: "bg-purple-500",
    iconColor: "text-white"
  },
  {
    name: "Coaching",
    icon: GraduationCap,
    tags: ["cat:coaching"],
    description: "Professional Training",
    color: "bg-orange-500",
    iconColor: "text-white"
  }
];

// Old-school categories - for relationship-focused realtors who value traditional marketing
const OLD_SCHOOL_CATEGORIES = [
  {
    name: "Client Event Kits",
    icon: Gift,
    tags: ["cat:client-events"],
    description: "Event Hosting Supplies",
    color: "bg-emerald-500",
    iconColor: "text-white"
  },
  {
    name: "Print & Mail",
    icon: Mail,
    tags: ["cat:print-mail"],
    description: "Physical Marketing",
    color: "bg-teal-500",
    iconColor: "text-white"
  },
  {
    name: "Signs",
    icon: FileText,
    tags: ["cat:signs"],
    description: "Property Signage",
    color: "bg-slate-500",
    iconColor: "text-white"
  },
  {
    name: "Presentations",
    icon: Presentation,
    tags: ["cat:presentations"],
    description: "Client Presentations",
    color: "bg-violet-500",
    iconColor: "text-white"
  },
  {
    name: "Branding",
    icon: Palette,
    tags: ["cat:branding"],
    description: "Brand Identity",
    color: "bg-rose-500",
    iconColor: "text-white"
  },
  {
    name: "Client Retention",
    icon: Camera,
    tags: ["cat:client-retention"],
    description: "Relationship Building",
    color: "bg-red-500",
    iconColor: "text-white"
  }
];

export const CategoryBlocks = ({ onCategoryClick, services }: CategoryBlocksProps) => {
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const allCategories = [...DIGITAL_CATEGORIES, ...OLD_SCHOOL_CATEGORIES];
    
    services.forEach(service => {
      const serviceTags = service.tags || [];
      
      allCategories.forEach(cat => {
        const hasMatch = cat.tags.some(catTag => serviceTags.includes(catTag));
        
        if (hasMatch) {
          counts.set(cat.name, (counts.get(cat.name) || 0) + 1);
        }
      });
    });
    
    return counts;
  }, [services]);

  const handleCategoryClick = (tags: string[], categoryName: string) => {
    logger.log('category_block_clicked', { tags, categoryName });
    onCategoryClick(tags[0], categoryName); // Use first tag for search
  };

  const renderCategoryGrid = (categories: typeof DIGITAL_CATEGORIES, title: string, subtitle: string) => (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          
          return (
            <Card 
              key={category.name}
              className="hover:shadow-md transition-all duration-200 cursor-pointer group hover:border-primary/50"
              onClick={() => handleCategoryClick(category.tags, category.name)}
            >
              <CardContent className="p-4 text-center">
                <div className="space-y-3">
                  <div className="relative mx-auto w-12 h-12">
                    <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent className={`w-6 h-6 ${category.iconColor}`} />
                    </div>
                    {categoryCounts.get(category.name) && (
                      <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground px-1">
                          {categoryCounts.get(category.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {category.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Shop by Category</h2>
      
      {renderCategoryGrid(
        DIGITAL_CATEGORIES, 
        "Digital-first (Fast Growth)", 
        "Technology and automation tools for scaling your business"
      )}
      
      {renderCategoryGrid(
        OLD_SCHOOL_CATEGORIES, 
        "Old-school (Relationship Builders)", 
        "Traditional marketing and relationship-building essentials"
      )}
    </div>
  );
};
