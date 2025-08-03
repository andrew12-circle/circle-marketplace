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
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AI Concierge</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Your personalized business intelligence</p>
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {getTimeOfDayGreeting()}, {profile?.display_name || "Agent"}. Welcome back.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Here is your business briefing for {formatDate(currentTime)}.
            </p>
          </div>
        </div>

        {/* Dashboard Content - Mobile Optimized */}
        <div className="grid gap-4 sm:gap-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Dashboard Loading...</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm sm:text-base text-muted-foreground">
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