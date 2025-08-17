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
    description: "Customer Management"
  },
  {
    name: "Marketing", 
    icon: TrendingUp,
    searchTerm: "marketing",
    description: "Lead Generation"
  },
  {
    name: "SEO",
    icon: Search,
    searchTerm: "seo",
    description: "Search Optimization"
  },
  {
    name: "Coaching",
    icon: GraduationCap,
    searchTerm: "coaching",
    description: "Professional Training"
  },
  {
    name: "Insurance",
    icon: Shield,
    searchTerm: "insurance",
    description: "Protection & Coverage"
  },
  {
    name: "Photography",
    icon: Camera,
    searchTerm: "photography",
    description: "Visual Content"
  },
  {
    name: "Video",
    icon: Video,
    searchTerm: "video",
    description: "Video Production"
  },
  {
    name: "Direct Mail",
    icon: Mail,
    searchTerm: "direct mail",
    description: "Physical Marketing"
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
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {categoryCounts.get(category.name) && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {categoryCounts.get(category.name)}
                        </Badge>
                      )}
                    </div>
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