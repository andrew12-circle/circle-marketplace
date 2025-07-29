import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Search, 
  Library, 
  Plus, 
  Heart,
  Clock,
  TrendingUp,
  User,
  BookOpen,
  PlayCircle
} from "lucide-react";

interface AcademySidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  playlists: Array<{ id: string; name: string; courseCount: number }>;
  onCreatePlaylist: () => void;
}

export const AcademySidebar = ({ 
  activeView, 
  onViewChange, 
  playlists, 
  onCreatePlaylist 
}: AcademySidebarProps) => {
  const navigationItems = [
    { id: "browse", label: "Browse", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "library", label: "Library", icon: Library },
  ];

  const quickAccess = [
    { id: "recently-played", label: "Recently Played", icon: Clock },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "trending", label: "Trending Now", icon: TrendingUp },
    { id: "my-courses", label: "My Courses", icon: BookOpen },
  ];

  return (
    <div className="w-64 bg-card border-r flex flex-col h-full">
      {/* Main Navigation */}
      <div className="p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeView === item.id && "bg-circle-primary text-primary-foreground"
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

      <div className="border-t mx-4"></div>

      {/* Quick Access */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Quick Access</h3>
        <div className="space-y-1">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm",
                  activeView === item.id && "bg-circle-primary text-primary-foreground"
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

      <div className="border-t mx-4"></div>

      {/* Playlists */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground px-2">Playlists</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCreatePlaylist}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {playlists.map((playlist) => (
              <Button
                key={playlist.id}
                variant={activeView === `playlist-${playlist.id}` ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm",
                  activeView === `playlist-${playlist.id}` && "bg-circle-primary text-primary-foreground"
                )}
                onClick={() => onViewChange(`playlist-${playlist.id}`)}
              >
                <PlayCircle className="w-4 h-4 mr-3" />
                <div className="flex-1 text-left">
                  <div className="truncate">{playlist.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {playlist.courseCount} courses
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Currently Learning */}
      <div className="border-t p-4">
        <div className="bg-circle-neutral rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-circle-primary rounded-lg flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Lead Generation Mastery</p>
              <p className="text-xs text-muted-foreground">Lesson 3 of 12</p>
              <div className="w-full bg-background rounded-full h-1 mt-1">
                <div className="bg-circle-primary h-1 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};