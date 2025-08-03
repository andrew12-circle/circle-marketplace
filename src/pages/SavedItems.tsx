import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, MessageCircle, ArrowRight, Crown, Loader2, ArrowLeft, Play, Clock, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useVendorActivityTracking } from "@/hooks/useVendorActivityTracking";
import { VideoPlayerModal } from "@/components/academy/VideoPlayerModal";

interface SavedService {
  id: string;
  service_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
  services: {
    id: string;
    title: string;
    description: string;
    category: string;
    retail_price: string;
    pro_price: string;
    co_pay_price: string;
    image_url: string;
    tags: string[];
    vendor: {
      name: string;
      rating: number;
      review_count: number;
      is_verified: boolean;
    };
  };
}

interface SavedVideo {
  id: string;
  content_id: string;
  created_at: string;
  content: {
    id: string;
    title: string;
    description: string;
    category: string;
    duration: string;
    cover_image_url: string;
    content_url: string;
    creator_id: string;
    rating: number;
    total_plays: number;
    tags: string[];
    metadata: any;
  };
}

export const SavedItems = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [notesTimers, setNotesTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const isProMember = profile?.is_pro_member || false;

  useEffect(() => {
    fetchSavedServices();
    fetchSavedVideos();
  }, []);

  const fetchSavedServices = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('saved_services')
        .select(`
          *,
          services (
            id,
            title,
            description,
            category,
            retail_price,
            pro_price,
            co_pay_price,
            image_url,
            tags,
            vendor_id,
            vendors (
              name,
              rating,
              review_count,
              is_verified
            )
          )
        `)
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        ...item,
        services: {
          ...item.services,
          vendor: item.services?.vendors || {
            name: 'Unknown Vendor',
            rating: 0,
            review_count: 0,
            is_verified: false
          }
        }
      })) || [];

      setSavedServices(transformedData);
    } catch (error) {
      console.error('Error fetching saved services:', error);
      toast({
        title: "Error",
        description: "Failed to load saved services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedVideos = async () => {
    if (!profile?.user_id) return;

    try {
      setVideosLoading(true);
      const { data, error } = await supabase
        .from('content_interactions')
        .select(`
          id,
          content_id,
          created_at,
          content (
            id,
            title,
            description,
            category,
            duration,
            cover_image_url,
            content_url,
            creator_id,
            rating,
            total_plays,
            tags,
            metadata
          )
        `)
        .eq('user_id', profile.user_id)
        .eq('interaction_type', 'save')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedVideos(data || []);
    } catch (error) {
      console.error('Error fetching saved videos:', error);
      toast({
        title: "Error",
        description: "Failed to load saved videos",
        variant: "destructive",
      });
    } finally {
      setVideosLoading(false);
    }
  };

  const removeSavedVideo = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content_interactions')
        .delete()
        .eq('content_id', contentId)
        .eq('user_id', profile?.user_id)
        .eq('interaction_type', 'save');

      if (error) throw error;

      setSavedVideos(prev => prev.filter(item => item.content_id !== contentId));
      
      toast({
        title: "Video removed",
        description: "Video has been removed from your saved list",
      });
    } catch (error) {
      console.error('Error removing saved video:', error);
      toast({
        title: "Error",
        description: "Failed to remove video",
        variant: "destructive",
      });
    }
  };

  const playVideo = (video: any) => {
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  };

  const debouncedUpdateNotes = useCallback((savedServiceId: string, notes: string) => {
    // Clear existing timer for this service
    if (notesTimers[savedServiceId]) {
      clearTimeout(notesTimers[savedServiceId]);
    }

    // Update local state immediately for responsive UI
    setSavedServices(prev => 
      prev.map(item => 
        item.id === savedServiceId ? { ...item, notes } : item
      )
    );

    // Set new timer to save to database after user stops typing
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('saved_services')
          .update({ notes })
          .eq('id', savedServiceId);

        if (error) throw error;

        toast({
          title: "Notes saved",
          description: "Your notes have been automatically saved",
        });
      } catch (error) {
        console.error('Error updating notes:', error);
        toast({
          title: "Error",
          description: "Failed to save notes",
          variant: "destructive",
        });
      }
    }, 1000); // Wait 1 second after user stops typing

    setNotesTimers(prev => ({
      ...prev,
      [savedServiceId]: timer
    }));
  }, [notesTimers, toast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(notesTimers).forEach(timer => clearTimeout(timer));
    };
  }, [notesTimers]);

  const removeSavedService = async (savedServiceId: string) => {
    try {
      const { error } = await supabase
        .from('saved_services')
        .delete()
        .eq('id', savedServiceId);

      if (error) throw error;

      setSavedServices(prev => prev.filter(item => item.id !== savedServiceId));
      setSelectedForComparison(prev => prev.filter(id => id !== savedServiceId));
      
      toast({
        title: "Service removed",
        description: "Service has been removed from your saved list",
      });
    } catch (error) {
      console.error('Error removing saved service:', error);
      toast({
        title: "Error",
        description: "Failed to remove service",
        variant: "destructive",
      });
    }
  };

  const toggleComparison = (savedServiceId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(savedServiceId)) {
        return prev.filter(id => id !== savedServiceId);
      } else if (prev.length < 3) {
        return [...prev, savedServiceId];
      } else {
        toast({
          title: "Comparison limit",
          description: "You can compare up to 3 services at once",
          variant: "destructive",
        });
        return prev;
      }
    });
  };

  const analyzeWithAI = async () => {
    if (selectedForComparison.length < 2) {
      toast({
        title: "Select services",
        description: "Please select at least 2 services to compare",
        variant: "destructive",
      });
      return;
    }

    setAnalyzingWithAI(true);
    try {
      const selectedServices = savedServices.filter(item => 
        selectedForComparison.includes(item.id)
      );

      const servicesData = selectedServices.map(item => ({
        title: item.services.title,
        description: item.services.description,
        category: item.services.category,
        retail_price: item.services.retail_price,
        pro_price: item.services.pro_price,
        co_pay_price: item.services.co_pay_price,
        vendor: item.services.vendor.name,
        rating: item.services.vendor.rating,
        tags: item.services.tags,
        notes: item.notes
      }));

      const { data, error } = await supabase.functions.invoke('ask-circle-ai', {
        body: {
          type: 'quick',
          prompt: `Please analyze and compare these services for a real estate agent. Provide insights on pricing differences, value propositions, and which might be best for different scenarios: ${JSON.stringify(servicesData, null, 2)}`
        }
      });

      if (error) throw error;

      setAiAnalysis(data.response);
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze services with AI",
        variant: "destructive",
      });
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  const getComparisonServices = () => {
    return savedServices.filter(item => selectedForComparison.includes(item.id));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="outline" asChild className="flex items-center gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Saved Items</h1>
        <p className="text-muted-foreground mt-2">
          Manage your saved services and videos in one place
        </p>
      </div>

      {/* Tabs for Services and Videos */}
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">
            Saved Services ({savedServices.length})
          </TabsTrigger>
          <TabsTrigger value="videos">
            Saved Videos ({savedVideos.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          {selectedForComparison.length > 0 && (
            <div className="flex items-center justify-end gap-4">
              <Badge variant="secondary">
                {selectedForComparison.length} selected for comparison
              </Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Button disabled={selectedForComparison.length < 2}>
                    Compare Selected
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Service Comparison</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getComparisonServices().map((item) => (
                        <Card key={item.id} className="h-full">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <img 
                                src={item.services.image_url || "/placeholder.svg"} 
                                alt={item.services.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm leading-tight">
                                  {item.services.title}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {item.services.vendor.name}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-3 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Retail:</span>
                                <span>{item.services.retail_price}</span>
                              </div>
                              {isProMember && item.services.pro_price && (
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1">
                                    <span className="text-circle-primary">Pro:</span>
                                    <Crown className="w-3 h-3 text-circle-primary" />
                                  </div>
                                  <span className="font-semibold text-circle-primary">
                                    {item.services.pro_price}
                                  </span>
                                </div>
                              )}
                              {item.services.co_pay_price && (
                                <div className="flex justify-between">
                                  <span className="text-green-600">Co-Pay:</span>
                                  <span className="font-semibold text-green-600">
                                    {item.services.co_pay_price}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                {item.services.description}
                              </p>
                            </div>
                            
                            {item.notes && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium mb-1">Your Notes:</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.notes}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* AI Analysis Section */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">AI Analysis</h3>
                        <Button 
                          onClick={analyzeWithAI}
                          disabled={analyzingWithAI || selectedForComparison.length < 2}
                          className="flex items-center gap-2"
                        >
                          {analyzingWithAI ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MessageCircle className="w-4 h-4" />
                          )}
                          {analyzingWithAI ? "Analyzing..." : "Analyze with AI"}
                        </Button>
                      </div>
                      
                      {aiAnalysis && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{aiAnalysis}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : savedServices.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h2 className="text-xl font-semibold mb-2">No saved services yet</h2>
                <p className="text-muted-foreground mb-4">
                  Start saving services from the marketplace to compare them here
                </p>
                <Button asChild>
                  <Link to="/">
                    Browse Marketplace <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedServices.map((item) => (
                <Card key={item.id} className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={selectedForComparison.includes(item.id)}
                          onCheckedChange={() => toggleComparison(item.id)}
                          className="mt-1"
                        />
                        <img 
                          src={item.services.image_url || "/placeholder.svg"} 
                          alt={item.services.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">
                            {item.services.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {item.services.vendor.name}
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.services.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSavedService(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.services.description}
                    </p>
                    
                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Retail Price:</span>
                        <span className="text-sm">{item.services.retail_price}</span>
                      </div>
                      
                      {isProMember && item.services.pro_price && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-circle-primary">Circle Pro:</span>
                            <Crown className="w-4 h-4 text-circle-primary" />
                          </div>
                          <span className="text-lg font-bold text-circle-primary">
                            {item.services.pro_price}
                          </span>
                        </div>
                      )}
                      
                      {item.services.co_pay_price && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-600">Co-Pay Price:</span>
                          <span className="text-lg font-bold text-green-600">
                            {item.services.co_pay_price}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {item.services.tags && item.services.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.services.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.services.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{item.services.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Notes Section */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Notes:</label>
                      <Textarea
                        placeholder="Add your thoughts about this service..."
                        value={item.notes || ""}
                        onChange={(e) => debouncedUpdateNotes(item.id, e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          {videosLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : savedVideos.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h2 className="text-xl font-semibold mb-2">No saved videos yet</h2>
                <p className="text-muted-foreground mb-4">
                  Start saving videos from the academy to build your learning library
                </p>
                <Button asChild>
                  <Link to="/academy">
                    Browse Academy <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedVideos.map((item) => (
                <Card key={item.id} className="h-full flex flex-col group hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="relative">
                      <img 
                        src={item.content.cover_image_url || "/placeholder.svg"} 
                        alt={item.content.title}
                        className="w-full h-48 rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          size="lg"
                          onClick={() => playVideo(item.content)}
                          className="bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Play className="w-6 h-6 mr-2" />
                          Play Video
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSavedVideo(item.content_id)}
                        className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-3">
                    <div>
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {item.content.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.content.metadata?.channel_title || 'Unknown Creator'}
                      </p>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.content.description}
                    </p>
                    
                    {/* Video Metadata */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {item.content.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {item.content.duration}
                        </div>
                      )}
                      {item.content.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {item.content.rating.toFixed(1)}
                        </div>
                      )}
                      <div>
                        {item.content.total_plays} views
                      </div>
                    </div>
                    
                    {/* Category and Tags */}
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {item.content.category}
                      </Badge>
                      {item.content.tags && item.content.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.content.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.content.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{item.content.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Saved {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        isOpen={isVideoPlayerOpen}
        onClose={() => {
          setIsVideoPlayerOpen(false);
          setSelectedVideo(null);
        }}
        videoUrl={selectedVideo?.content_url}
      />
    </div>
  );
};