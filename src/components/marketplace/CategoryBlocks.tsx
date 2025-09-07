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
  Globe,
  Bot,
  Play,
  Home,
  BarChart3,
  Calculator,
  Zap,
  Headphones,
  UserPlus,
  Award,
  Lock,
  ShieldCheck
} from "lucide-react";
import { logger } from "@/utils/logger";
import { useMemo } from "react";
import { type Service } from "@/hooks/useMarketplaceData";
import { useTranslation } from "react-i18next";

interface CategoryBlocksProps {
  onCategoryClick: (searchTerm: string, categoryName: string) => void;
  onAIChat?: (initialMessage: string) => void; // New prop for AI chat
  services: Service[]; // Filtered services for display
  allServices: Service[]; // All services for counting
  activeFilters?: string[]; // Currently active category filters
}

// Digital-first categories - for tech-savvy realtors focused on fast growth
const DIGITAL_CATEGORIES = [
  {
    name: "CRM",
    translationKey: "crm",
    icon: Users,
    tags: ["cat:crms", "tag:customer-management", "tag:contact-management"],
    description: "Manage client relationships",
    color: "bg-blue-500",
    iconColor: "text-white"
  },
  {
    name: "Ads & Lead Gen",
    translationKey: "adsLeadGen",
    icon: TrendingUp,
    tags: ["cat:ads-lead-gen", "tag:facebook-ads", "tag:google-ads", "tag:lead-generation"],
    description: "Generate quality leads",
    color: "bg-green-500",
    iconColor: "text-white"
  },
  {
    name: "Website",
    translationKey: "website",
    icon: Globe,
    tags: ["cat:website-idx", "tag:websites", "tag:idx", "tag:property-search"],
    description: "Professional agent websites",
    color: "bg-cyan-500",
    iconColor: "text-white"
  },
  {
    name: "Photography",
    translationKey: "photography",
    icon: Camera,
    tags: ["cat:photography", "tag:photos", "tag:virtual-tours", "tag:3d-tours"],
    description: "Stunning listing visuals",
    color: "bg-purple-500",
    iconColor: "text-white"
  },
  {
    name: "SEO",
    translationKey: "seo",
    icon: Search,
    tags: ["cat:seo", "tag:search-optimization", "tag:local-seo"],
    description: "Rank higher online",
    color: "bg-orange-500",
    iconColor: "text-white"
  },
  {
    name: "Coaching",
    translationKey: "coaching",
    icon: GraduationCap,
    tags: ["cat:coaching", "tag:training", "tag:mentoring"],
    description: "Accelerate your growth",
    color: "bg-indigo-500",
    iconColor: "text-white"
  },
  {
    name: "Automation",
    translationKey: "automation",
    icon: Bot,
    tags: ["cat:marketing-automation", "tag:email-marketing", "tag:drip-campaigns"],
    description: "Automate your marketing",
    color: "bg-pink-500",
    iconColor: "text-white"
  },
  {
    name: "Video & Media",
    translationKey: "videoMedia",
    icon: Play,
    tags: ["cat:video-media", "tag:video-production", "tag:social-media"],
    description: "Create engaging content",
    color: "bg-yellow-500",
    iconColor: "text-white"
  },
  {
    name: "Listing & Showing",
    translationKey: "listingShowing",
    icon: Home,
    tags: ["cat:listing-showing", "tag:listing-management", "tag:showing-tools"],
    description: "Streamline property sales",
    color: "bg-emerald-600",
    iconColor: "text-white"
  },
  {
    name: "Data & Analytics",
    translationKey: "dataAnalytics",
    icon: BarChart3,
    tags: ["cat:data-analytics", "tag:market-data", "tag:reporting"],
    description: "Make data-driven decisions",
    color: "bg-stone-500",
    iconColor: "text-white"
  },
  {
    name: "Finance & Ops",
    translationKey: "financeOps",
    icon: Calculator,
    tags: ["cat:finance-business", "tag:accounting", "tag:business-tools"],
    description: "Manage your finances",
    color: "bg-amber-500",
    iconColor: "text-white"
  },
  {
    name: "Productivity",
    translationKey: "productivity",
    icon: Zap,
    tags: ["cat:productivity", "tag:task-management", "tag:collaboration"],
    description: "Work more efficiently",
    color: "bg-red-500",
    iconColor: "text-white"
  },
  {
    name: "Virtual Assistants & Dialers",
    translationKey: "virtualAssistants",
    icon: Headphones,
    tags: ["cat:virtual-assistants", "tag:vas", "tag:dialers", "tag:calling"],
    description: "Scale with remote support",
    color: "bg-teal-600",
    iconColor: "text-white"
  },
  {
    name: "Team & Recruiting",
    translationKey: "teamRecruiting",
    icon: UserPlus,
    tags: ["cat:team-recruiting", "tag:hiring", "tag:team-management"],
    description: "Build your dream team",
    color: "bg-sky-500",
    iconColor: "text-white"
  },
  {
    name: "Insurance & Compliance",
    translationKey: "insuranceCompliance",
    icon: ShieldCheck,
    tags: ["cat:insurance-compliance", "tag:insurance", "tag:compliance", "tag:e-o"],
    description: "Protect your business",
    color: "bg-slate-500",
    iconColor: "text-white"
  },
  {
    name: "CE & Licensing",
    translationKey: "ceLicensing",
    icon: Award,
    tags: ["cat:ce-licensing", "tag:continuing-education", "tag:licenses"],
    description: "Stay licensed & current",
    color: "bg-violet-500",
    iconColor: "text-white"
  }
];

// Old-school categories - for relationship-focused realtors who value traditional marketing
const OLD_SCHOOL_CATEGORIES = [
  {
    name: "Client Event Kits",
    translationKey: "clientEventKits",
    icon: Gift,
    tags: ["cat:client-events", "tag:events", "tag:hosting"],
    description: "Host memorable events",
    color: "bg-emerald-500",
    iconColor: "text-white"
  },
  {
    name: "Client Gifting",
    translationKey: "clientGifting",
    icon: Gift,
    tags: ["cat:client-gifting", "tag:gifts", "tag:appreciation", "tag:closing-gifts"],
    description: "Show client appreciation",
    color: "bg-lime-500",
    iconColor: "text-white"
  },
  {
    name: "Open House",
    translationKey: "openHouse",
    icon: Home,
    tags: ["cat:open-house-kits", "tag:open-house", "tag:signage"],
    description: "Professional open houses",
    color: "bg-orange-500",
    iconColor: "text-white"
  },
  {
    name: "Print & Mail",
    translationKey: "printMail",
    icon: Mail,
    tags: ["cat:print-mail", "tag:postcards", "tag:mailers", "tag:print"],
    description: "Direct mail campaigns",
    color: "bg-teal-500",
    iconColor: "text-white"
  },
  {
    name: "Signage & Branding",
    translationKey: "signageBranding",
    icon: FileText,
    tags: ["cat:signs", "tag:branding", "tag:yard-signs", "tag:car-wraps", "tag:merchandise"],
    description: "Stand-out signs & swag",
    color: "bg-slate-500",
    iconColor: "text-white"
  },
  {
    name: "Presentations",
    translationKey: "presentations",
    icon: Presentation,
    tags: ["cat:presentations", "tag:listing-presentations", "tag:buyer-presentations"],
    description: "Win more listings",
    color: "bg-violet-500",
    iconColor: "text-white"
  },
  {
    name: "Lockboxes",
    translationKey: "lockboxes",
    icon: Lock,
    tags: ["cat:lockboxes", "tag:lockbox", "tag:access-tools", "tag:showing-tools"],
    description: "Secure property access",
    color: "bg-blue-600",
    iconColor: "text-white"
  },
  {
    name: "Pop-By Kits",
    translationKey: "popByKits",
    icon: Gift,
    tags: ["cat:pop-by-kits", "tag:popby", "tag:pop-by", "tag:client-touch"],
    description: "Stay top-of-mind",
    color: "bg-rose-500",
    iconColor: "text-white"
  },
  {
    name: "Transaction Coordinator",
    translationKey: "transactionCoordinator",
    icon: FileText,
    tags: ["cat:transaction-coordinator", "tag:tc", "tag:transaction-management"],
    description: "Smooth transactions",
    color: "bg-amber-600",
    iconColor: "text-white"
  }
];

export const CategoryBlocks = ({ onCategoryClick, onAIChat, services, allServices, activeFilters = [] }: CategoryBlocksProps) => {
  const { t } = useTranslation();
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
    
    // If AI chat is available, use it with a formulated question
    if (onAIChat) {
      const question = `What's the best ${categoryName.toLowerCase()} service for a real estate agent?`;
      onAIChat(question);
    } else {
      // Fallback to old behavior
      onCategoryClick(tags[0], categoryName); // Use first tag for search
    }
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
          
          // Get translated name and description
          const translatedName = t(`categories.${category.translationKey}`) !== `categories.${category.translationKey}` 
            ? t(`categories.${category.translationKey}`) 
            : category.name;
          const translatedDescription = t(`categories.${category.translationKey}Description`) !== `categories.${category.translationKey}Description` 
            ? t(`categories.${category.translationKey}Description`) 
            : category.description;
          
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
                      {translatedName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {translatedDescription}
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
    <div className="mb-8" data-tour="category-blocks">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">{t('shopByCategory')}</h2>
      
      {renderCategoryGrid(
        OLD_SCHOOL_CATEGORIES, 
        t('oldSchoolCategory'), 
        t('oldSchoolSubtitle')
      )}
      
      {renderCategoryGrid(
        DIGITAL_CATEGORIES, 
        t('digitalFirstCategory'), 
        t('digitalFirstSubtitle')
      )}
    </div>
  );
};
