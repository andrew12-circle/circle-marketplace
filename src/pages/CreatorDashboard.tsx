import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Users
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
  const [stats, setStats] = useState<ContentStats>({
    totalPlays: 0,
    totalRevenue: 0,
    totalContent: 0,
    avgRating: 0
  });
  const [recentContent, setRecentContent] = useState<RecentContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCreatorData();
  }, []);

  const fetchCreatorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    { type: 'video', label: 'Video', icon: Video, color: 'bg-red-500' },
    { type: 'podcast', label: 'Podcast', icon: Headphones, color: 'bg-purple-500' },
    { type: 'book', label: 'Book', icon: Book, color: 'bg-blue-500' },
    { type: 'course', label: 'Course', icon: GraduationCap, color: 'bg-green-500' },
    { type: 'playbook', label: 'Playbook', icon: BookOpen, color: 'bg-orange-500' },
  ];

  const getContentTypeIcon = (type: string) => {
    const contentType = contentTypes.find(ct => ct.type === type);
    if (!contentType) return null;
    const Icon = contentType.icon;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your content and track your earnings</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Content
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Play className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlays.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">25% revenue share</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContent}</div>
            <p className="text-xs text-muted-foreground">Across all types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}/5</div>
            <p className="text-xs text-muted-foreground">From user reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {contentTypes.map((contentType) => {
              const Icon = contentType.icon;
              return (
                <Button
                  key={contentType.type}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-24"
                  onClick={() => toast({ title: "Upload", description: `Upload new ${contentType.label}` })}
                >
                  <div className={`w-8 h-8 rounded-lg ${contentType.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">Upload {contentType.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Content</CardTitle>
        </CardHeader>
        <CardContent>
          {recentContent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No content uploaded yet</p>
              <p className="text-sm">Start creating content to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getContentTypeIcon(content.content_type)}
                    <div>
                      <h3 className="font-medium">{content.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(content.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      {content.total_plays} plays
                    </Badge>
                    <Badge variant="outline">
                      ★ {content.rating || 0}
                    </Badge>
                    <Button variant="ghost" size="sm">
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
  );
};