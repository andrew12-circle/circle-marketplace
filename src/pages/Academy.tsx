import { useState, useEffect } from "react";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { VideoSection } from "@/components/academy/VideoSection";
import { VideoPlayerModal } from "@/components/academy/VideoPlayerModal";
import { PodcastSection } from "@/components/academy/PodcastSection";
import { PodcastPlayerModal } from "@/components/academy/PodcastPlayerModal";
import { BookSection } from "@/components/academy/BookSection";
import { BookReaderModal } from "@/components/academy/BookReaderModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useVideos } from "@/hooks/useVideos";
import { useChannels } from "@/hooks/useChannels";
import { usePodcasts } from "@/hooks/usePodcasts";
import { useBooks } from "@/hooks/useBooks";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  GraduationCap, 
  BookOpen, 
  Video, 
  Headphones, 
  Book,
  Search,
  Filter,
  Users,
  TrendingUp,
  Sparkles,
  Heart,
  Award,
  ChevronRight,
  Play
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
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);
  const [currentPodcastUrl, setCurrentPodcastUrl] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [currentBookUrl, setCurrentBookUrl] = useState<string>("");
  const { toast } = useToast();
  
  // Fetch videos using the custom hook
  const { videos: allVideos, loading, incrementView } = useVideos();
  const { videos: featuredVideos } = useVideos({ featured: true, limit: 10 });
  const { videos: trendingVideos } = useVideos({ limit: 10 });
  const { videos: shortsVideos } = useVideos({ category: 'shorts', limit: 15 });
  
  // Fetch channels using the custom hook
  const { channels: featuredChannels } = useChannels({ verified: true, limit: 6 });
  const { channels: newChannels } = useChannels({ orderBy: 'created_at', orderDirection: 'desc', limit: 8 });
  const { channels: allChannels, loading: channelsLoading } = useChannels();
  
  // Fetch podcasts using the custom hook
  const { podcasts: featuredPodcasts } = usePodcasts({ featured: true, limit: 10 });
  const { podcasts: newPodcasts } = usePodcasts({ orderBy: 'created_at', orderDirection: 'desc', limit: 8 });
  const { podcasts: allPodcasts, loading: podcastsLoading, incrementPlay } = usePodcasts();
  
  // Fetch books using the custom hook
  const { books: featuredBooks } = useBooks({ featured: true, limit: 10 });
  const { books: newBooks } = useBooks({ orderBy: 'created_at', orderDirection: 'desc', limit: 8 });
  const { books: allBooks, loading: booksLoading, incrementRead, updateProgress } = useBooks();

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
    console.log("handlePlayVideo called with videoId:", videoId);
    
    // Find the video in our data
    const video = allVideos.find(v => v.id === videoId) || 
                  trendingVideos.find(v => v.id === videoId) || 
                  featuredVideos.find(v => v.id === videoId);
    
    console.log("Found video:", video);
    
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
          console.log("Supabase response:", { data, error });
          
          if (data?.content_url && !error) {
            console.log("Setting video modal state");
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

  const handlePlayPodcast = (podcastId: string) => {
    console.log("handlePlayPodcast called with podcastId:", podcastId);
    
    // Find the podcast in our data
    const podcast = allPodcasts.find(p => p.id === podcastId) || 
                    featuredPodcasts.find(p => p.id === podcastId) || 
                    newPodcasts.find(p => p.id === podcastId);
    
    console.log("Found podcast:", podcast);
    
    if (podcast) {
      // Increment play count
      incrementPlay(podcastId);
      
      // Get the content URL from Supabase and play in modal
      supabase
        .from('content')
        .select('content_url')
        .eq('id', podcastId)
        .single()
        .then(({ data, error }) => {
          console.log("Supabase response:", { data, error });
          
          if (data?.content_url && !error) {
            console.log("Setting podcast modal state");
            setSelectedPodcast(podcast);
            setCurrentPodcastUrl(data.content_url);
            setIsPodcastModalOpen(true);
            
            toast({
              title: "Playing Podcast",
              description: `Now playing: ${podcast.title}`,
            });
          } else {
            toast({
              title: "Error",
              description: "Could not load podcast",
              variant: "destructive",
            });
          }
        });
    } else {
      toast({
        title: "Error", 
        description: "Podcast not found",
        variant: "destructive",
      });
    }
  };

  const handleAddToLibrary = (podcastId: string) => {
    toast({
      title: "Added to Library",
      description: "Podcast saved to your library",
    });
  };

  const handleDownloadPodcast = (podcastId: string) => {
    toast({
      title: "Download Started",
      description: "Podcast download has begun",
    });
  };

  const handleReadBook = (bookId: string) => {
    console.log("handleReadBook called with bookId:", bookId);
    
    // Find the book in our data
    const book = allBooks.find(b => b.id === bookId) || 
                 featuredBooks.find(b => b.id === bookId) || 
                 newBooks.find(b => b.id === bookId);
    
    console.log("Found book:", book);
    
    if (book) {
      // Increment read count
      incrementRead(bookId);
      
      // Get the content URL from Supabase and open in reader modal
      supabase
        .from('content')
        .select('content_url')
        .eq('id', bookId)
        .single()
        .then(({ data, error }) => {
          console.log("Supabase response:", { data, error });
          
          if (data?.content_url && !error) {
            console.log("Setting book modal state");
            setSelectedBook(book);
            setCurrentBookUrl(data.content_url);
            setIsBookModalOpen(true);
            
            toast({
              title: "Opening Book",
              description: `Now reading: ${book.title}`,
            });
          } else {
            toast({
              title: "Error",
              description: "Could not load book",
              variant: "destructive",
            });
          }
        });
    } else {
      toast({
        title: "Error", 
        description: "Book not found",
        variant: "destructive",
      });
    }
  };

  const handleAddBookToLibrary = (bookId: string) => {
    toast({
      title: "Added to Library",
      description: "Book saved to your library",
    });
  };

  const handleDownloadBook = (bookId: string) => {
    toast({
      title: "Download Started",
      description: "Book download has begun",
    });
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
            title="🚀 Quick Wins (Shorts)"
            subtitle="Bite-sized tips you can implement today"
            videos={shortsVideos}
            onPlayVideo={handlePlayVideo}
            showSeeAll={true}
            onSeeAll={() => toast({ title: "See All", description: "Show all real estate shorts" })}
            size="small"
          />

          <VideoSection
            title="Trending Now"
            subtitle="Most watched real estate training this week"
            videos={trendingVideos}
            onPlayVideo={handlePlayVideo}
            showSeeAll={true}
            onSeeAll={() => toast({ title: "See All", description: "Show all trending videos" })}
            size="large"
          />

          <VideoSection
            title="Featured Training"
            subtitle="Hand-picked by real estate experts"
            videos={featuredVideos}
            onPlayVideo={handlePlayVideo}
            showSeeAll={true}
            onSeeAll={() => toast({ title: "See All", description: "Show all featured videos" })}
            size="medium"
          />

          <VideoSection
            title="All Training Videos"
            subtitle="Browse our complete library of real estate education"
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

  const renderChannelsView = () => (
    <div className="flex-1 p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Channels</h1>
        <p className="text-muted-foreground">
          Discover top real estate educators and creators
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text"
            placeholder="Search channels..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {channelsLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Loading channels...</div>
        </div>
      ) : (
        <>
          {/* Featured Channels */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Featured Channels</h2>
            {featuredChannels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredChannels.map((channel) => (
                  <Card key={channel.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    {/* Cover Image */}
                    <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                      {channel.cover_image_url ? (
                        <img 
                          src={channel.cover_image_url} 
                          alt={`${channel.name} cover`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Education
                        </span>
                      </div>
                    </div>
                    
                    {/* Channel Info */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{channel.name}</h3>
                            {channel.is_verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {channel.description || 'Real estate education and training content'}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>{channel.subscriber_count?.toLocaleString() || '0'} subscribers</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
                        Subscribe
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Featured Channels Yet</h3>
                <p className="text-muted-foreground mb-4">Import some YouTube channels to get started!</p>
                <Button onClick={() => toast({ title: "Import Channels", description: "Use the YouTube import feature in Admin Dashboard" })}>
                  Import YouTube Channels
                </Button>
              </div>
            )}
          </div>

          {/* Channel Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: "Coaching", count: 15, icon: Users },
                { name: "Sales Training", count: 23, icon: TrendingUp },
                { name: "Marketing", count: 18, icon: Sparkles },
                { name: "Technology", count: 12, icon: Video },
                { name: "Mindset", count: 9, icon: Heart },
                { name: "Lead Generation", count: 21, icon: Award }
              ].map((category) => {
                const Icon = category.icon;
                return (
                  <Card 
                    key={category.name}
                    className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.count} channels</p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* New Channels */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Recently Added Channels</h2>
            {newChannels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {newChannels.map((channel) => (
                  <Card key={channel.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Video className="w-8 h-8 text-gray-500" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{channel.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {channel.description || 'Real estate education content'}
                      </p>
                      <div className="text-xs text-muted-foreground mb-3">
                        <div>{channel.subscriber_count?.toLocaleString() || '0'} subscribers</div>
                        <div className="text-green-600">
                          Added {channel.created_at ? new Date(channel.created_at).toLocaleDateString() : 'recently'}
                        </div>
                      </div>
                      <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white">
                        Subscribe
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Channels Added Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {allChannels.length === 0 
                    ? "Import YouTube channels to populate this section!"
                    : "All channels have been here for a while. Check back later for new additions!"
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderPodcastsView = () => (
    <div className="flex-1 p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Browse</h1>
        <p className="text-muted-foreground">
          Discover podcasts for real estate professionals
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text"
            placeholder="Search podcasts..."
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Always show the layout, handle loading within sections */}
      <>
        {/* Featured Hero Cards */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Featured Show 1 */}
              <Card className="relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-200">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-6 text-white flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-medium opacity-80 mb-2">NEW SHOW</p>
                    <h3 className="text-lg font-bold leading-tight">
                      The Real Estate Revolution: AI and the Future of Property
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <span className="text-sm opacity-90">Listen Now</span>
                  </div>
                </div>
              </Card>

              {/* Featured Show 2 */}
              <Card className="relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-200">
                <div className="aspect-[4/3] bg-gradient-to-br from-green-600 via-teal-600 to-blue-500 p-6 text-white flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-medium opacity-80 mb-2">NEW SHOW</p>
                    <h3 className="text-lg font-bold leading-tight">
                      Million Dollar Mindset: Psychology of Top Producers
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <span className="text-sm opacity-90">Listen Now</span>
                  </div>
                </div>
              </Card>

              {/* Featured Collection */}
              <Card className="relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-200">
                <div className="aspect-[4/3] bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-6 text-white flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-medium opacity-80 mb-2">FEATURED COLLECTION</p>
                    <h3 className="text-lg font-bold leading-tight">
                      Essential podcasts for new agents starting their journey
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge className="bg-orange-400 text-orange-900 text-xs px-2 py-1">
                      Featured Collection
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Top Shows */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Top Shows</h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                See All <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {podcastsLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="text-center">
                  <Card className="overflow-hidden mb-3">
                    <AspectRatio ratio={1}>
                      <div className="w-full h-full bg-muted animate-pulse" />
                    </AspectRatio>
                  </Card>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : featuredPodcasts.length > 0 ? (
              featuredPodcasts.slice(0, 6).map((podcast, index) => (
                <div key={podcast.id} className="text-center">
                  <Card 
                    className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group mb-3"
                    onClick={() => handlePlayPodcast(podcast.id)}
                  >
                    <AspectRatio ratio={1}>
                      <img 
                        src={podcast.thumbnail} 
                        alt={podcast.title}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </AspectRatio>
                  </Card>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground text-center">{index + 1}</p>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">{podcast.title}</h3>
                    <p className="text-xs text-muted-foreground">{podcast.creator}</p>
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="text-center">
                  <Card className="overflow-hidden mb-3 border-dashed border-2">
                    <AspectRatio ratio={1}>
                      <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                        <Headphones className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </AspectRatio>
                  </Card>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground text-center">{index + 1}</p>
                    <h3 className="text-sm text-muted-foreground">Coming Soon</h3>
                    <p className="text-xs text-muted-foreground">Real Estate Show</p>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>

          {/* New Shows */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">New Shows</h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                See All <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {podcastsLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index}>
                  <Card className="overflow-hidden mb-3">
                    <AspectRatio ratio={1}>
                      <div className="w-full h-full bg-muted animate-pulse" />
                    </AspectRatio>
                  </Card>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : newPodcasts.length > 0 ? (
              newPodcasts.map((podcast) => (
                <div key={podcast.id}>
                  <Card 
                    className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group mb-3"
                    onClick={() => handlePlayPodcast(podcast.id)}
                  >
                    <AspectRatio ratio={1}>
                      <img 
                        src={podcast.thumbnail} 
                        alt={podcast.title}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </AspectRatio>
                  </Card>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">{podcast.title}</h3>
                    <p className="text-xs text-muted-foreground">{podcast.category}</p>
                    <p className="text-xs text-muted-foreground">Updated Weekly</p>
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index}>
                  <Card className="overflow-hidden mb-3 border-dashed border-2">
                    <AspectRatio ratio={1}>
                      <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                        <Headphones className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </AspectRatio>
                  </Card>
                  <div className="space-y-1">
                    <h3 className="text-sm text-muted-foreground">New Show</h3>
                    <p className="text-xs text-muted-foreground">Real Estate</p>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>

          {/* Categories Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: "Lead Generation", color: "from-blue-500 to-blue-600" },
                { name: "Marketing", color: "from-green-500 to-green-600" },
                { name: "Sales Training", color: "from-purple-500 to-purple-600" },
                { name: "Mindset", color: "from-orange-500 to-orange-600" },
                { name: "Technology", color: "from-teal-500 to-teal-600" },
                { name: "Success Stories", color: "from-pink-500 to-pink-600" },
                { name: "Market Trends", color: "from-indigo-500 to-indigo-600" },
                { name: "Team Building", color: "from-red-500 to-red-600" },
                { name: "Personal Branding", color: "from-yellow-500 to-yellow-600" },
                { name: "Client Relations", color: "from-cyan-500 to-cyan-600" },
                { name: "Investment", color: "from-emerald-500 to-emerald-600" },
                { name: "Coaching", color: "from-violet-500 to-violet-600" }
              ].map((category) => (
                <Card 
                  key={category.name}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
                >
                  <div className={`aspect-square bg-gradient-to-br ${category.color} p-4 text-white flex items-end`}>
                    <h3 className="font-semibold text-sm leading-tight">{category.name}</h3>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Top Episodes */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Top Episodes</h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                See All <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          
          <div className="space-y-4">
            {podcastsLoading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-muted-foreground min-w-[24px]">
                      {index + 1}
                    </div>
                    <div className="w-16 h-16 rounded-lg bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                  </div>
                </Card>
              ))
            ) : allPodcasts.length > 0 ? (
              allPodcasts.slice(0, 8).map((podcast, index) => (
                <Card 
                  key={podcast.id}
                  className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handlePlayPodcast(podcast.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-muted-foreground min-w-[24px]">
                      {index + 1}
                    </div>
                    
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img 
                        src={podcast.thumbnail} 
                        alt={podcast.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                        {podcast.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        By {podcast.creator}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {podcast.duration} • {new Date(podcast.releaseDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-10 h-10 rounded-full shrink-0"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              // Empty state
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="p-4 border-dashed border-2">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-muted-foreground min-w-[24px]">
                      {index + 1}
                    </div>
                    
                    <div className="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                      <Headphones className="w-6 h-6 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-muted-foreground mb-1">
                        Sample Episode {index + 1}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        By Real Estate Expert
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coming Soon • Real Estate Tips
                      </p>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-10 h-10 rounded-full shrink-0"
                      disabled
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </>
    </div>
  );

  const renderBooksView = () => {
    const [activeCategory, setActiveCategory] = useState("All");
    
    const categories = [
      "Biographies & Memoirs",
      "Business & Personal Finance", 
      "Comics & Graphic Novels",
      "Computers & Internet",
      "Genre Charts"
    ];

    // Mock data for demonstration - in a real app, these would come from your API
    const topPaidBooks = [
      { id: "1", title: "Dead Line", author: "Marc Cameron", cover: "/placeholder.svg", ranking: 1 },
      { id: "2", title: "Robert Ludlum's The Bourne Escape", author: "Brian Freeman", cover: "/placeholder.svg", ranking: 2 },
      { id: "3", title: "She Didn't See It Coming", author: "Shari Lapena", cover: "/placeholder.svg", ranking: 3 },
      { id: "4", title: "Shattered Truth (Thrilling FBI...)", author: "Barbara Freethy", cover: "/placeholder.svg", ranking: 4 },
      { id: "5", title: "An Inside Job", author: "Daniel Silva", cover: "/placeholder.svg", ranking: 5 },
      { id: "6", title: "Immortal by Morning", author: "Lynsay Sands", cover: "/placeholder.svg", ranking: 6 },
    ];

    const topFreeBooks = [
      { id: "7", title: "The Bossy Billionaire", author: "Samantha Skye", cover: "/placeholder.svg", ranking: 1 },
      { id: "8", title: "Concrete Angels", author: "Tom Fowler", cover: "/placeholder.svg", ranking: 2 },
      { id: "9", title: "Falling", author: "Noelle Adams", cover: "/placeholder.svg", ranking: 3 },
      { id: "10", title: "Beach Club", author: "Elana Johnson", cover: "/placeholder.svg", ranking: 4 },
      { id: "11", title: "Hiring Mr. Darcy", author: "Valerie Bowman", cover: "/placeholder.svg", ranking: 5 },
      { id: "12", title: "Little Girl Vanished", author: "Denise Grover Swank", cover: "/placeholder.svg", ranking: 6 },
    ];

    return (
      <div className="flex-1 p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-foreground mb-6">Top Books</h1>
          
          {/* Category Tabs */}
          <div className="flex gap-1 bg-muted/30 p-1 rounded-lg w-fit">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {booksLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading books...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Top Paid Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Top Paid</h2>
                <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {topPaidBooks.map((book) => (
                  <Card 
                    key={book.id}
                    className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => handleReadBook(book.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-muted-foreground min-w-[24px]">
                        {book.ranking}
                      </div>
                      
                      <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm">
                        <img 
                          src={book.cover} 
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {book.author}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Top Free Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Top Free</h2>
                <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {topFreeBooks.map((book) => (
                  <Card 
                    key={book.id}
                    className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => handleReadBook(book.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-muted-foreground min-w-[24px]">
                        {book.ranking}
                      </div>
                      
                      <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm">
                        <img 
                          src={book.cover} 
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {book.author}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Featured Collections Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Featured Collections</h2>
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
              See All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Real Estate Classics", subtitle: "Timeless wisdom for agents", bookCount: 25 },
              { title: "Lead Generation Mastery", subtitle: "Convert more prospects", bookCount: 18 },
              { title: "Market Analysis Expert", subtitle: "Data-driven insights", bookCount: 12 },
              { title: "Negotiation Powerhouse", subtitle: "Close deals like a pro", bookCount: 15 },
              { title: "Digital Marketing Edge", subtitle: "Modern marketing strategies", bookCount: 22 },
              { title: "Investment Strategies", subtitle: "Building wealth through real estate", bookCount: 16 }
            ].map((collection, index) => (
              <Card 
                key={index}
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 group border-2 border-transparent hover:border-primary/20"
              >
                <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <Book className="w-12 h-12 text-primary/60" />
                </div>
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {collection.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {collection.subtitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {collection.bookCount} books
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    console.log("Current activeView:", activeView); // Debug log
    switch (activeView) {
      case "home":
        return renderHomeView();
      case "videos":
        return renderVideosView();
      case "channels":
        console.log("Rendering channels view"); // Debug log
        return renderChannelsView();
      case "podcasts":
        console.log("Rendering podcasts view"); // Debug log
        return renderPodcastsView();
      case "books":
        console.log("Rendering books view"); // Debug log
        return renderBooksView();
      default:
        console.log("Rendering default view for:", activeView); // Debug log
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

      <PodcastPlayerModal
        podcast={selectedPodcast}
        isOpen={isPodcastModalOpen}
        onClose={() => setIsPodcastModalOpen(false)}
        audioUrl={currentPodcastUrl}
      />

      <BookReaderModal
        book={selectedBook}
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        contentUrl={currentBookUrl}
      />
    </div>
  );
};