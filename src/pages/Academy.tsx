import { useState } from "react";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { VideoSection } from "@/components/academy/VideoSection";
import { VideoPlayerModal } from "@/components/academy/VideoPlayerModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useVideos } from "@/hooks/useVideos";
import { supabase } from "@/integrations/supabase/client";
import { 
  GraduationCap, 
  BookOpen, 
  Video, 
  Headphones, 
  Book,
  Search,
  Filter
} from "lucide-react";

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

// Mock video data
const mockVideos = {
  trending: [
    {
      id: "1",
      title: "The Psychology of Lead Conversion: What Every Agent Needs to Know",
      creator: "Sarah Johnson",
      thumbnail: "/placeholder.svg",
      duration: "12:34",
      category: "Lead Generation",
      rating: 4.9,
      isPro: true,
      views: "24K"
    },
    {
      id: "2", 
      title: "Social Media Branding That Actually Works",
      creator: "Mike Chen",
      thumbnail: "/placeholder.svg",
      duration: "8:45",
      category: "Marketing",
      rating: 4.7,
      isPro: false,
      views: "18K"
    },
    {
      id: "3",
      title: "Objection Handling Masterclass",
      creator: "Tom Ferry",
      thumbnail: "/placeholder.svg", 
      duration: "15:22",
      category: "Sales",
      rating: 4.8,
      isPro: true,
      views: "31K"
    },
    {
      id: "4",
      title: "Instagram Reels for Real Estate",
      creator: "Emma Wilson",
      thumbnail: "/placeholder.svg",
      duration: "6:18",
      category: "Social Media",
      rating: 4.6,
      isPro: false,
      views: "12K"
    },
    {
      id: "5",
      title: "The Mindset of Million Dollar Producers",
      creator: "Ryan Serhant",
      thumbnail: "/placeholder.svg",
      duration: "20:15",
      category: "Mindset",
      rating: 4.9,
      isPro: true,
      views: "45K"
    }
  ],
  forYou: [
    {
      id: "6",
      title: "Local Market Analysis Deep Dive",
      creator: "Maria Rodriguez",
      thumbnail: "/placeholder.svg",
      duration: "14:30",
      category: "Market Analysis", 
      rating: 4.8,
      isPro: true,
      views: "16K"
    },
    {
      id: "7",
      title: "Client Communication Scripts That Work",
      creator: "David Kim",
      thumbnail: "/placeholder.svg", 
      duration: "9:45",
      category: "Communication",
      rating: 4.7,
      isPro: false,
      views: "22K"
    }
  ],
  newReleases: [
    {
      id: "8",
      title: "AI Tools for Real Estate Agents in 2024",
      creator: "Tech Real Estate",
      thumbnail: "/placeholder.svg",
      duration: "11:20",
      category: "Technology",
      rating: 4.5,
      isPro: true,
      views: "8K"
    }
  ]
};

export const Academy = () => {
  const [activeView, setActiveView] = useState("home");
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
  const { toast } = useToast();
  
  // Fetch videos using the custom hook
  const { videos: allVideos, loading, incrementView } = useVideos();
  const { videos: featuredVideos } = useVideos({ featured: true, limit: 10 });
  const { videos: trendingVideos } = useVideos({ limit: 10 });

  const categories = [
    { id: "courses", label: "Courses", icon: GraduationCap },
    { id: "playbooks", label: "Playbooks", icon: BookOpen },
    { id: "videos", label: "Videos", icon: Video },
    { id: "podcasts", label: "Podcasts", icon: Headphones },
    { id: "books", label: "Books", icon: Book },
  ];

  const featuredContent = [
    {
      id: "1",
      type: "NEW COURSE",
      title: "The Agent Operating System",
      isNew: true,
      isDark: true,
    },
    {
      id: "2", 
      type: "NEW PLAYBOOK",
      title: "The 30-Day Content Machine",
      isNew: true,
      isDark: false,
    },
  ];

  const renderHomeView = () => (
    <div className="flex-1 p-8 max-w-6xl">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-6xl font-bold text-black mb-4">Academy.</h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Finally, we silenced the noise. Welcome to the Academy. A place you can take a 
          breath, learn, and actually move your career forward.
        </p>
      </div>

      {/* Category Icons */}
      <div className="flex gap-8 mb-16">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveView(category.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Icon className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* The Latest Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-black mb-2">The latest. </h2>
        <p className="text-gray-600 mb-8">Take a look at what's new.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {featuredContent.map((item) => (
            <Card
              key={item.id}
              className={`p-8 cursor-pointer transition-transform hover:scale-105 ${
                item.isDark 
                  ? "bg-gray-900 text-white" 
                  : "bg-blue-50 text-gray-900"
              }`}
            >
              <div className="mb-4">
                <span className={`text-sm font-medium ${
                  item.isDark ? "text-red-400" : "text-blue-600"
                }`}>
                  {item.type}
                </span>
              </div>
              <h3 className="text-2xl font-bold">{item.title}</h3>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bg-gray-900 text-white p-6 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Everything Agents Wish They Knew Sooner.</h3>
          <p className="text-sm text-gray-300">$47/month, Full access. Courses & coaching and reporting.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
          Try It Free
        </Button>
      </div>
    </div>
  );

  const handlePlayVideo = (videoId: string) => {
    // Find the video in our data
    const video = allVideos.find(v => v.id === videoId) || 
                  trendingVideos.find(v => v.id === videoId) || 
                  featuredVideos.find(v => v.id === videoId);
    
    if (video) {
      // Increment view count
      incrementView(videoId);
      
      // Get the content URL from Supabase and play in modal
      supabase
        .from('content')
        .select('content_url')
        .eq('id', videoId)
        .single()
        .then(({ data, error }) => {
          if (data?.content_url && !error) {
            setSelectedVideo(video);
            setCurrentVideoUrl(data.content_url);
            setIsVideoModalOpen(true);
            
            toast({
              title: "Playing Video",
              description: `Now playing: ${video.title}`,
            });
          } else {
            toast({
              title: "Error",
              description: "Could not load video",
              variant: "destructive",
            });
          }
        });
    } else {
      toast({
        title: "Error", 
        description: "Video not found",
        variant: "destructive",
      });
    }
  };

  const renderVideosView = () => (
    <div className="flex-1 p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Videos</h1>
        <p className="text-muted-foreground">
          Curated content from top coaches, influencers, and marketing experts
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text"
            placeholder="Search videos..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Video Sections */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Loading videos...</div>
        </div>
      ) : (
        <>
          <VideoSection
            title="Trending Now"
            subtitle="Most watched videos this week"
            videos={trendingVideos}
            onPlayVideo={handlePlayVideo}
            showSeeAll={true}
            onSeeAll={() => toast({ title: "See All", description: "Show all trending videos" })}
            size="large"
          />

          <VideoSection
            title="Featured Content"
            subtitle="Hand-picked by our team"
            videos={featuredVideos}
            onPlayVideo={handlePlayVideo}
            showSeeAll={true}
            onSeeAll={() => toast({ title: "See All", description: "Show all featured videos" })}
            size="medium"
          />

          <VideoSection
            title="All Videos"
            subtitle="Browse our complete library"
            videos={allVideos.slice(0, 8)}
            onPlayVideo={handlePlayVideo}
            showSeeAll={true}
            onSeeAll={() => toast({ title: "See All", description: "Show all videos" })}
            size="medium"
          />
        </>
      )}

      {/* Categories Grid */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            "Lead Generation", "Marketing", "Sales", "Social Media", 
            "Mindset", "Technology", "Market Analysis", "Communication",
            "Negotiation", "Listing Presentation", "Buyer Consultation", "Closing"
          ].map((category) => (
            <Card 
              key={category}
              className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <h3 className="font-medium text-sm">{category}</h3>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return renderHomeView();
      case "videos":
        return renderVideosView();
      default:
        return (
          <div className="flex-1 p-8">
            <h2 className="text-2xl font-bold mb-4">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h2>
            <p className="text-gray-600">Content for {activeView} coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <AcademySidebar
        activeView={activeView}
        onViewChange={setActiveView}
      />
      
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>

      <VideoPlayerModal
        video={selectedVideo}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={currentVideoUrl}
      />
    </div>
  );
};