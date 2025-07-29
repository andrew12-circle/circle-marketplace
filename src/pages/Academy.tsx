import { useState } from "react";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { CourseSection } from "@/components/academy/CourseSection";
import { PlaylistCard } from "@/components/academy/PlaylistCard";
import { CourseAlbumCard } from "@/components/academy/CourseAlbumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Play, Shuffle } from "lucide-react";

// Mock data - replace with actual data
const mockCourses = [
  {
    id: "1",
    title: "Lead Generation Mastery: From Zero to Hero",
    creator: "Circle Team",
    duration: "2h 30m",
    thumbnail: "/placeholder.svg",
    isPro: false,
    rating: 4.9,
    progress: 25,
  },
  {
    id: "2",
    title: "Social Media Branding for Real Estate",
    creator: "Sarah Johnson",
    duration: "1h 45m",
    thumbnail: "/placeholder.svg",
    isPro: true,
    rating: 4.8,
    progress: 75,
  },
  {
    id: "3",
    title: "Conversion Psychology: Close More Deals",
    creator: "Mike Chen",
    duration: "3h 15m",
    thumbnail: "/placeholder.svg",
    isPro: true,
    rating: 4.9,
  },
  {
    id: "4",
    title: "Mindset Shift: Think Like a Top Producer",
    creator: "Circle Team",
    duration: "45m",
    thumbnail: "/placeholder.svg",
    isPro: false,
    rating: 4.7,
    progress: 100,
  },
  {
    id: "5",
    title: "Instagram Marketing Masterclass",
    creator: "Emma Wilson",
    duration: "2h 15m",
    thumbnail: "/placeholder.svg",
    isPro: true,
    rating: 4.6,
  },
  {
    id: "6",
    title: "Negotiation Tactics That Win",
    creator: "David Rodriguez",
    duration: "1h 30m",
    thumbnail: "/placeholder.svg",
    isPro: false,
    rating: 4.8,
    progress: 50,
  },
];

const mockPlaylists = [
  { id: "1", name: "Getting Started", courseCount: 5 },
  { id: "2", name: "Advanced Strategies", courseCount: 8 },
  { id: "3", name: "Quick Wins", courseCount: 3 },
  { id: "4", name: "My Favorites", courseCount: 12 },
];

export const Academy = () => {
  const [activeView, setActiveView] = useState("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handlePlayCourse = (courseId: string) => {
    const course = mockCourses.find(c => c.id === courseId);
    toast({
      title: "Playing Course",
      description: `Now playing: "${course?.title}"`,
    });
  };

  const handlePlayAll = () => {
    toast({
      title: "Playing All",
      description: "Starting playlist from the beginning",
    });
  };

  const handleCreatePlaylist = () => {
    toast({
      title: "Create Playlist",
      description: "Playlist creation feature coming soon!",
    });
  };

  const handleAddCourse = () => {
    toast({
      title: "Add Course",
      description: "Course selection feature coming soon!",
    });
  };

  // Filter data based on view
  const recentlyPlayed = mockCourses.filter(course => course.progress !== undefined);
  const trending = mockCourses.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const newReleases = mockCourses.slice(0, 4);
  const forYou = mockCourses.filter(course => !course.isPro || Math.random() > 0.5);
  const topCharts = mockCourses.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const renderBrowseView = () => (
    <div className="p-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-circle-primary to-circle-accent rounded-lg p-8 mb-8 text-primary-foreground">
        <h1 className="text-4xl font-bold mb-2">Good morning!</h1>
        <p className="text-lg opacity-90 mb-6">Ready to continue your learning journey?</p>
        <div className="flex gap-3">
          <Button className="bg-white/20 hover:bg-white/30 backdrop-blur">
            <Play className="w-4 h-4 mr-2" />
            Resume Learning
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle Play
          </Button>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {recentlyPlayed.slice(0, 6).map((course) => (
          <div
            key={course.id}
            className="bg-card rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors group flex items-center gap-4"
            onClick={() => handlePlayCourse(course.id)}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-circle-primary to-circle-primary-light rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold truncate">{course.title}</h3>
              <p className="text-sm text-muted-foreground">{course.creator}</p>
              {course.progress !== undefined && (
                <div className="w-full bg-background rounded-full h-1 mt-2">
                  <div 
                    className="bg-circle-primary h-1 rounded-full" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Course Sections */}
      <CourseSection
        title="Made for You"
        subtitle="Courses picked just for you"
        courses={forYou}
        onPlayCourse={handlePlayCourse}
      />

      <CourseSection
        title="Top Charts"
        subtitle="Most popular courses this week"
        courses={topCharts}
        onPlayCourse={handlePlayCourse}
      />

      <CourseSection
        title="New Releases"
        subtitle="Latest courses from top creators"
        courses={newReleases}
        onPlayCourse={handlePlayCourse}
      />

      <CourseSection
        title="Trending Now"
        subtitle="What everyone's watching"
        courses={trending}
        onPlayCourse={handlePlayCourse}
      />
    </div>
  );

  const renderSearchView = () => (
    <div className="p-6">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search courses, creators, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 text-lg py-6"
          />
        </div>
      </div>

      {searchTerm ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Search Results for "{searchTerm}"</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockCourses
              .filter(course => 
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.creator.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((course) => (
                <CourseAlbumCard
                  key={course.id}
                  course={course}
                  onPlay={handlePlayCourse}
                />
              ))}
          </div>
        </div>
      ) : (
        <div>
          <CourseSection
            title="Browse by Topic"
            subtitle="Explore courses by category"
            courses={mockCourses.slice(0, 6)}
            onPlayCourse={handlePlayCourse}
          />
        </div>
      )}
    </div>
  );

  const renderLibraryView = () => (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Your Library</h1>
      
      <PlaylistCard
        title="Recently Played"
        subtitle="Pick up where you left off"
        courses={recentlyPlayed}
        onPlayAll={handlePlayAll}
        onAddCourse={handleAddCourse}
        onPlayCourse={handlePlayCourse}
        showProgress={true}
      />
    </div>
  );

  const renderRecentlyPlayed = () => (
    <div className="p-6">
      <PlaylistCard
        title="Recently Played"
        subtitle="Continue your learning journey"
        courses={recentlyPlayed}
        onPlayAll={handlePlayAll}
        onAddCourse={handleAddCourse}
        onPlayCourse={handlePlayCourse}
        showProgress={true}
      />
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "search":
        return renderSearchView();
      case "library":
        return renderLibraryView();
      case "recently-played":
        return renderRecentlyPlayed();
      case "favorites":
        return renderLibraryView();
      case "trending":
        return (
          <div className="p-6">
            <CourseSection
              title="Trending Now"
              subtitle="Most popular courses this week"
              courses={trending}
              onPlayCourse={handlePlayCourse}
              showSeeAll={false}
              size="large"
            />
          </div>
        );
      case "my-courses":
        return renderLibraryView();
      default:
        return renderBrowseView();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AcademySidebar
        activeView={activeView}
        onViewChange={setActiveView}
        playlists={mockPlaylists}
        onCreatePlaylist={handleCreatePlaylist}
      />
      
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};