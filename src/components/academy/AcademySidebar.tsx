import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Video, 
  Radio,
  Headphones,
  BookOpen,
  GraduationCap,
  Users,
  TrendingUp,
  Heart,
  Award,
  Building,
  Sparkles
} from "lucide-react";

interface AcademySidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const AcademySidebar = ({ 
  activeView, 
  onViewChange
}: AcademySidebarProps) => {
  const navigationItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "videos", label: "Videos", icon: Video },
    { id: "channels", label: "Channels", icon: Radio },
    { id: "podcasts", label: "Podcasts", icon: Headphones },
    { id: "books", label: "Books", icon: BookOpen },
    { id: "courses", label: "Courses", icon: GraduationCap },
    { id: "masterclass", label: "Masterclass", icon: Award },
    { id: "playbooks", label: "Playbooks", icon: BookOpen },
    { id: "tech-marketing", label: "Tech & Marketing", icon: TrendingUp },
    { id: "coaching", label: "Coaching", icon: Users },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "schools", label: "Schools", icon: Building },
    { id: "faith-purpose", label: "Faith & Purpose", icon: Heart },
    { id: "mindset", label: "Mindset", icon: Sparkles },
  ];

  return (
    <div className="w-64 bg-background border-r flex flex-col h-full">
      {/* Main Navigation */}
      <div className="p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sm py-2 px-3 h-auto",
                  activeView === item.id ? "bg-red-100 text-red-600" : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};