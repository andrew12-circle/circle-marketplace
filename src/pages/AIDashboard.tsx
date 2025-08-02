import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AIDashboard = () => {
  const { user, profile } = useAuth();
  const [currentTime] = useState(new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Concierge</h1>
              <p className="text-muted-foreground">Your personalized business intelligence</p>
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {getTimeOfDayGreeting()}, {profile?.display_name || "Agent"}. Welcome back.
            </h2>
            <p className="text-muted-foreground">
              Here is your business briefing for {formatDate(currentTime)}.
            </p>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid gap-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Dashboard Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your AI Dashboard is being set up. Advanced features coming soon!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;