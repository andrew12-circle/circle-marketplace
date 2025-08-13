import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDailyScripture, speakDeclaration, applyPrayerGuard } from "@/lib/prayerGuard";
import { Calendar, Cross, Heart, Shield, Book, Users } from "lucide-react";

interface Scripture {
  id: string;
  ref: string;
  text: string;
  tags: string[];
}

interface Prayer {
  id: string;
  kind: string;
  body: string;
  created_at: string;
  meta: any;
}

export function SpiritualDashboard() {
  const [dailyScripture, setDailyScripture] = useState<Scripture | null>(null);
  const [recentPrayers, setRecentPrayers] = useState<Prayer[]>([]);
  const [prayerRequest, setPrayerRequest] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSpiritualData();
  }, []);

  const loadSpiritualData = async () => {
    try {
      // Get daily scripture
      const scripture = await getDailyScripture(['blessing', 'protection']);
      setDailyScripture(scripture);

      // Get recent prayers
      const { data: prayers, error } = await supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPrayers(prayers || []);
    } catch (error) {
      console.error('Error loading spiritual data:', error);
      toast({
        title: "Error loading spiritual data",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitPrayerRequest = async () => {
    if (!prayerRequest.trim()) return;

    try {
      await applyPrayerGuard('team_prayer_request', { 
        request: prayerRequest,
        submittedBy: 'admin_dashboard'
      });

      toast({
        title: "Prayer request submitted",
        description: "Your prayer has been recorded and covered.",
      });

      setPrayerRequest("");
      loadSpiritualData(); // Refresh the prayers list
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      toast({
        title: "Error submitting prayer request",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const triggerDailyBlessing = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('daily-blessing');
      
      if (error) throw error;
      
      toast({
        title: "Daily blessing triggered",
        description: "Platform has been blessed and covered in prayer.",
      });
      
      loadSpiritualData();
    } catch (error) {
      console.error('Error triggering daily blessing:', error);
      toast({
        title: "Error triggering blessing",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const showDeclaration = () => {
    const declaration = speakDeclaration();
    toast({
      title: "🙏 Speak this declaration over the platform",
      description: "Check the console for the full declaration to speak aloud.",
    });
  };

  if (loading) {
    return (
      <div className="grid gap-6 p-6">
        <div className="flex items-center gap-2">
          <Cross className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Spiritual Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cross className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Spiritual Dashboard</h1>
        </div>
        <Badge variant="outline" className="text-xs">
          Numbers 6:24-26
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Daily Scripture */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Scripture</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dailyScripture ? (
              <div className="space-y-2">
                <div className="text-xs font-medium text-primary">
                  {dailyScripture.ref}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  "{dailyScripture.text}"
                </p>
                <div className="flex gap-1 flex-wrap">
                  {dailyScripture.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No scripture loaded</p>
            )}
          </CardContent>
        </Card>

        {/* Prayer Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prayer Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={triggerDailyBlessing} 
              size="sm" 
              className="w-full"
              variant="outline"
            >
              <Heart className="h-3 w-3 mr-1" />
              Trigger Daily Blessing
            </Button>
            <Button 
              onClick={showDeclaration} 
              size="sm" 
              className="w-full"
              variant="outline"
            >
              <Users className="h-3 w-3 mr-1" />
              Show Declaration
            </Button>
          </CardContent>
        </Card>

        {/* Prayer Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prayer Coverage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">Total Prayers</span>
                <Badge variant="secondary">{recentPrayers.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Platform under spiritual coverage since {new Date().toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prayer Request */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Submit Prayer Request</CardTitle>
          <CardDescription>
            Submit a prayer request for the team and platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your prayer request here..."
            value={prayerRequest}
            onChange={(e) => setPrayerRequest(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={submitPrayerRequest} disabled={!prayerRequest.trim()}>
            Submit Prayer Request
          </Button>
        </CardContent>
      </Card>

      {/* Recent Prayers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Prayers</CardTitle>
          <CardDescription>
            Latest spiritual coverage recorded for the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPrayers.map((prayer) => (
              <div key={prayer.id} className="border-l-2 border-primary/20 pl-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {prayer.kind}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(prayer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {prayer.body.split('\n')[0]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}