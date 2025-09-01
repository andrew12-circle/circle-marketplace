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
  Globe,
  Bot,
  Play,
  Home,
  BarChart3,
  Calculator,
  Zap,
  Headphones,
  UserPlus,
  Award
} from "lucide-react";
import { logger } from "@/utils/logger";
import { useMemo } from "react";
import { type Service } from "@/hooks/useMarketplaceData";

interface CategoryBlocksProps {
  onCategoryClick: (searchTerm: string, categoryName: string) => void;
  services: Service[]; // Filtered services for display
  allServices: Service[]; // All services for counting
  activeFilters?: string[]; // Currently active category filters
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
  },
  {
    name: "Marketing Automation & Content",
    icon: Bot,
    tags: ["cat:marketing-automation"],
    description: "Automated Marketing Tools",
    color: "bg-indigo-500",
    iconColor: "text-white"
  },
  {
    name: "Video & Media Tools",
    icon: Play,
    tags: ["cat:video-media"],
    description: "Video & Media Production",
    color: "bg-pink-500",
    iconColor: "text-white"
  },
  {
    name: "Listing & Showing Tools",
    icon: Home,
    tags: ["cat:listing-showing"],
    description: "Property Management Tools",
    color: "bg-yellow-500",
    iconColor: "text-white"
  },
  {
    name: "Data & Analytics",
    icon: BarChart3,
    tags: ["cat:data-analytics"],
    description: "Business Intelligence",
    color: "bg-emerald-600",
    iconColor: "text-white"
  },
  {
    name: "Finance & Business Tools",
    icon: Calculator,
    tags: ["cat:finance-business"],
    description: "Financial Management",
    color: "bg-stone-500",
    iconColor: "text-white"
  },
  {
    name: "Productivity & Collaboration",
    icon: Zap,
    tags: ["cat:productivity"],
    description: "Team & Task Management",
    color: "bg-amber-500",
    iconColor: "text-white"
  },
  {
    name: "Virtual Assistants & Dialers",
    icon: Headphones,
    tags: ["cat:virtual-assistants"],
    description: "Remote Support & Calling",
    color: "bg-red-500",
    iconColor: "text-white"
  },
  {
    name: "Team & Recruiting Tools",
    icon: UserPlus,
    tags: ["cat:team-recruiting"],
    description: "Staff Management & Hiring",
    color: "bg-teal-600",
    iconColor: "text-white"
  },
  {
    name: "CE & Licensing",
    icon: Award,
    tags: ["cat:ce-licensing"],
    description: "Continuing Education & Licenses",
    color: "bg-sky-500",
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
    name: "Client Gifting",
    icon: Gift,
    tags: ["cat:client-gifting"],
    description: "Client Appreciation Gifts",
    color: "bg-lime-500",
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
    name: "Signage & Branding",
    icon: FileText,
    tags: ["cat:signs"],
    description: "Yard signs, riders, car wraps, branded merchandise",
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
  },
  {
    name: "Transaction Coordinator",
    icon: FileText,
    tags: ["cat:transaction-coordinator"],
    description: "Transaction Management",
    color: "bg-blue-600",
    iconColor: "text-white"
  }
];

export const CategoryBlocks = ({ onCategoryClick, services, allServices, activeFilters = [] }: CategoryBlocksProps) => {
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const allCategories = [...DIGITAL_CATEGORIES, ...OLD_SCHOOL_CATEGORIES];
    
    // Always use allServices for counting to maintain consistent numbers
    allServices.forEach(service => {
      const serviceTags = service.tags || [];
      
      allCategories.forEach(cat => {
        const hasMatch = cat.tags.some(catTag => serviceTags.includes(catTag));
        
        if (hasMatch) {
          counts.set(cat.name, (counts.get(cat.name) || 0) + 1);
        }
      });
    });
    
    return counts;
  }, [allServices]); // Only depend on allServices, not filtered services

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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isActive = activeFilters.some(filter => category.tags.includes(filter));
          
          return (
            <Card 
              key={category.name}
              className={`hover:shadow-md transition-all duration-200 cursor-pointer group hover:border-primary/50 ${
                isActive ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleCategoryClick(category.tags, category.name)}
            >
              <CardContent className="p-4 text-center">
                <div className="space-y-3">
                  <div className="relative mx-auto w-12 h-12">
                    <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}>
                      <IconComponent className={`w-6 h-6 ${category.iconColor}`} />
                    </div>
                    {categoryCounts.get(category.name) && (
                      <div className={`absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-primary ring-2 ring-white' : 'bg-primary'
                      }`}>
                        <span className="text-xs font-medium text-primary-foreground px-1">
                          {categoryCounts.get(category.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm group-hover:text-primary transition-colors ${
                      isActive ? 'text-primary' : ''
                    }`}>
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
        OLD_SCHOOL_CATEGORIES, 
        "Old-school (Relationship Builders)", 
        "Traditional marketing and relationship-building essentials"
      )}
      
      {renderCategoryGrid(
        DIGITAL_CATEGORIES, 
        "Digital-first (Fast Growth)", 
        "Technology and automation tools for scaling your business"
      )}
    </div>
  );
};
