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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AcademySidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const AcademySidebar = ({ 
  activeView, 
  onViewChange
}: AcademySidebarProps) => {
  const { state } = useSidebar();
  
  const navigationItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "videos", label: "Videos", icon: Video },
    { id: "channels", label: "Channels", icon: Radio },
    { id: "podcasts", label: "Podcasts", icon: Headphones },
    { id: "books", label: "Books", icon: BookOpen },
    { id: "courses", label: "Courses", icon: GraduationCap },
  ];

  const specialItems = [
    { id: "masterclass", label: "Masterclass", icon: Award },
    { id: "playbooks", label: "Playbooks", icon: BookOpen },
    { id: "tech-marketing", label: "Tech & Marketing", icon: TrendingUp },
    { id: "coaching", label: "Coaching", icon: Users },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "schools", label: "Schools", icon: Building },
  ];

  const mindsetItems = [
    { id: "faith-purpose", label: "Faith & Purpose", icon: Heart },
    { id: "mindset", label: "Mindset", icon: Sparkles },
  ];

  const isActive = (viewId: string) => activeView === viewId;
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      className="transition-all duration-300 z-10 pt-20" 
      collapsible="icon"
    >
      <SidebarContent className="pt-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Academy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                        "w-full justify-start",
                        isActive(item.id) ? "bg-red-100 text-red-600 hover:bg-red-100 hover:text-red-600" : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Special Features */}
        <SidebarGroup>
          <SidebarGroupLabel>Special Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {specialItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                        "w-full justify-start",
                        isActive(item.id) ? "bg-red-100 text-red-600 hover:bg-red-100 hover:text-red-600" : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mindset & Growth */}
        <SidebarGroup>
          <SidebarGroupLabel>Growth</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mindsetItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                        "w-full justify-start",
                        isActive(item.id) ? "bg-red-100 text-red-600 hover:bg-red-100 hover:text-red-600" : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};