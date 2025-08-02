import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentUploadModal } from "@/components/creator/ContentUploadModal";
import { CreatorPaymentStatusBanner } from "@/components/creator/CreatorPaymentStatusBanner";
import { 
  Upload, 
  Video, 
  Headphones, 
  Book, 
  GraduationCap, 
  BookOpen,
  Plus,
  BarChart3,
  DollarSign,
  Play,
  Users,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";

interface ContentStats {
  totalPlays: number;
  totalRevenue: number;
  totalContent: number;
  avgRating: number;
}

interface RecentContent {
  id: string;
  title: string;
  content_type: string;
  total_plays: number;
  rating: number;
  created_at: string;
}

export const CreatorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ContentStats>({
    totalPlays: 0,
    totalRevenue: 0,
    totalContent: 0,
    avgRating: 0
  });
  const [recentContent, setRecentContent] = useState<RecentContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<string>('video');
  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  const { toast } = useToast();

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchCreatorData();
      checkPaymentSetup();
    }
  }, [user]);

  const checkPaymentSetup = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_payment_info')
        .select('stripe_onboarding_completed, verified, tax_form_completed')
        .eq('creator_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return; // No payment info yet
      }

      const isComplete = data && 
        data.stripe_onboarding_completed && 
        data.verified && 
        data.tax_form_completed;

      setPaymentSetupComplete(!!isComplete);
    } catch (error) {
      console.error('Error checking payment setup:', error);
    }
  };

  const fetchCreatorData = async () => {
    if (!user) return;
    
    try {

      // Fetch content stats
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select('total_plays, rating, total_revenue')
        .eq('creator_id', user.id);

      if (contentError) throw contentError;

      // Calculate stats
      const totalPlays = contentData?.reduce((sum, item) => sum + (item.total_plays || 0), 0) || 0;
      const totalRevenue = contentData?.reduce((sum, item) => sum + (item.total_revenue || 0), 0) || 0;
      const totalContent = contentData?.length || 0;
      const avgRating = totalContent > 0 
        ? contentData.reduce((sum, item) => sum + (item.rating || 0), 0) / totalContent 
        : 0;

      setStats({
        totalPlays,
        totalRevenue,
        totalContent,
        avgRating: Math.round(avgRating * 10) / 10
      });

      // Fetch recent content
      const { data: recentData, error: recentError } = await supabase
        .from('content')
        .select('id, title, content_type, total_plays, rating, created_at')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentContent(recentData || []);

    } catch (error) {
      console.error('Error fetching creator data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const contentTypes = [
    { 
      type: 'video', 
      label: 'Video', 
      icon: Video, 
      gradient: 'from-red-500 to-pink-500',
      description: 'Share video content'
    },
    { 
      type: 'podcast', 
      label: 'Podcast', 
      icon: Headphones, 
      gradient: 'from-purple-500 to-indigo-500',
      description: 'Create audio experiences'
    },
    { 
      type: 'book', 
      label: 'Book', 
      icon: Book, 
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Write and publish books'
    },
    { 
      type: 'course', 
      label: 'Course', 
      icon: GraduationCap, 
      gradient: 'from-green-500 to-emerald-500',
      description: 'Teach through courses'
    },
    { 
      type: 'playbook', 
      label: 'Playbook', 
      icon: BookOpen, 
      gradient: 'from-orange-500 to-red-500',
      description: 'Create step-by-step guides'
    },
  ];

  const getContentTypeIcon = (type: string) => {
    const contentType = contentTypes.find(ct => ct.type === type);
    if (!contentType) return null;
    const Icon = contentType.icon;
    return <Icon className="w-4 h-4" />;
  };

  const handleUploadClick = (contentType: string) => {
    if (!paymentSetupComplete) {
      toast({
        title: 'Payment Setup Required',
        description: 'Complete your payment setup before uploading content.',
        variant: 'destructive'
      });
      navigate('/creator-payment-setup');
      return;
    }
    
    setSelectedContentType(contentType);
    setUploadModalOpen(true);
  };

  const handleUploadComplete = () => {
    fetchCreatorData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px]" />
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 hover:bg-primary/10 text-muted-foreground hover:text-primary mb-4"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Creator Dashboard
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Create. Share. Earn.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Transform your expertise into engaging content and start earning from your passion. 
                Join thousands of creators building their digital empire.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300" 
                onClick={() => setUploadModalOpen(true)}
              >
                <Plus className="w-5 h-5" />
                Create Content
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 border-2 hover:bg-muted/50 transition-all duration-300"
                onClick={() => {
                  console.log('View Analytics button clicked, navigating to /analytics');
                  navigate('/analytics');
                }}
              >
                <BarChart3 className="w-5 h-5" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 space-y-8">
        {/* Payment Setup Banner */}
        <CreatorPaymentStatusBanner />
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Plays</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Play className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {stats.totalPlays.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 font-medium">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">75% revenue share</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Content Items</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <BarChart3 className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {stats.totalContent}
              </div>
              <p className="text-xs text-muted-foreground">Across all types</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                <Users className="w-4 h-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {stats.avgRating}/5
              </div>
              <p className="text-xs text-muted-foreground">From user reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Creation Hub */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Content Creation Hub
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Choose your medium and start creating amazing content
                </p>
              </div>
              <div className="hidden sm:block p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                <Upload className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {contentTypes.map((contentType) => {
                const Icon = contentType.icon;
                return (
                  <div
                    key={contentType.type}
                    className="group cursor-pointer"
                    onClick={() => handleUploadClick(contentType.type)}
                  >
                    <div className="relative p-6 rounded-xl border-2 border-muted hover:border-primary/50 bg-card hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contentType.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {contentType.label}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {contentType.description}
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Content */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Recent Content
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  Your latest creations and their performance
                </p>
              </div>
              <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/50">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentContent.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Upload className="w-12 h-12 text-primary opacity-70" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Import Your Existing Content in Minutes!</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Don't recreate what you've already built. Import from YouTube, Facebook, email campaigns, 
                  call scripts, and more - all in one click!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Quick Import
                  </Button>
                  <Button 
                    variant="outline"
                    className="gap-2 hover:bg-muted/50"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <Upload className="w-4 h-4" />
                    Start Creating
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContent.map((content, index) => (
                  <div 
                    key={content.id} 
                    className="group flex items-center justify-between p-4 rounded-lg border border-muted hover:border-primary/30 bg-card/50 hover:bg-card transition-all duration-300 hover:shadow-md"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        {getContentTypeIcon(content.content_type)}
                      </div>
                      <div>
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {content.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(content.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-200">
                        {content.total_plays} plays
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                        ★ {content.rating || 0}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <ContentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        contentType={selectedContentType}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};