import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Search, 
  GraduationCap, 
  Shield, 
  Camera, 
  Video, 
  Mail 
} from "lucide-react";
import { logger } from "@/utils/logger";
import { useMemo } from "react";
import { type Service } from "@/hooks/useMarketplaceData";

interface CategoryBlocksProps {
  onCategoryClick: (searchTerm: string, categoryName: string) => void;
  services: Service[];
}

const categories = [
  {
    name: "CRMs",
    icon: Users,
    searchTerm: "crm",
    description: "Customer Management",
    color: "bg-blue-500",
    iconColor: "text-white"
  },
  {
    name: "Marketing", 
    icon: TrendingUp,
    searchTerm: "marketing",
    description: "Lead Generation",
    color: "bg-green-500",
    iconColor: "text-white"
  },
  {
    name: "SEO",
    icon: Search,
    searchTerm: "seo",
    description: "Search Optimization",
    color: "bg-purple-500",
    iconColor: "text-white"
  },
  {
    name: "Coaching",
    icon: GraduationCap,
    searchTerm: "coaching",
    description: "Professional Training",
    color: "bg-orange-500",
    iconColor: "text-white"
  },
  {
    name: "Insurance",
    icon: Shield,
    searchTerm: "insurance",
    description: "Protection & Coverage",
    color: "bg-red-500",
    iconColor: "text-white"
  },
  {
    name: "Photography",
    icon: Camera,
    searchTerm: "photography",
    description: "Visual Content",
    color: "bg-pink-500",
    iconColor: "text-white"
  },
  {
    name: "Video",
    icon: Video,
    searchTerm: "video",
    description: "Video Production",
    color: "bg-indigo-500",
    iconColor: "text-white"
  },
  {
    name: "Direct Mail",
    icon: Mail,
    searchTerm: "direct mail",
    description: "Physical Marketing",
    color: "bg-teal-500",
    iconColor: "text-white"
  }
];

export const CategoryBlocks = ({ onCategoryClick, services }: CategoryBlocksProps) => {
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    services.forEach(service => {
      const category = (service.category || '').toLowerCase();
      const title = (service.title || '').toLowerCase();
      const description = (service.description || '').toLowerCase();
      const tags = (service.tags || []).join(' ').toLowerCase();
      
      categories.forEach(cat => {
        const searchTerms = cat.searchTerm.split(' ').map(term => term.toLowerCase());
        const hasMatch = searchTerms.some(term => 
          category.includes(term) || 
          title.includes(term) || 
          description.includes(term) ||
          tags.includes(term)
        );
        
        if (hasMatch) {
          counts.set(cat.name, (counts.get(cat.name) || 0) + 1);
        }
      });
    });
    
    return counts;
  }, [services]);

  const handleCategoryClick = (searchTerm: string, categoryName: string) => {
    logger.log('category_block_clicked', { searchTerm, categoryName });
    onCategoryClick(searchTerm, categoryName);
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-foreground">Shop by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          
          return (
            <Card 
              key={category.name}
              className="hover:shadow-md transition-all duration-200 cursor-pointer group hover:border-primary/50"
              onClick={() => handleCategoryClick(category.searchTerm, category.name)}
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
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
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
};