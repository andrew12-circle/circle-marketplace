import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Users, TrendingDown, Mail, MessageSquare } from "lucide-react";

export const CriticalOutcomes = () => {
  // Mock data - will be replaced with AI-generated recommendations based on real business data
  const criticalOutcomes = [
    {
      id: 1,
      title: "Secure a Price Reduction",
      priority: "high",
      property: "123 Main Street",
      context: "15 days on market, 5 days longer than Franklin average",
      action: "Custom market report prepared showing recent price drops in 37064 zip code",
      cta: "View & Send Report",
      icon: TrendingDown,
      urgency: "Today"
    },
    {
      id: 2,
      title: "Re-engage Cold Lead",
      priority: "medium",
      contact: "The Smiths",
      context: "Went quiet 10 days ago, new matching property available",
      action: "4 bed, 3 bath near Moore Elementary just listed - perfect match",
      cta: "Send Property Alert",
      icon: Users,
      urgency: "This Morning"
    },
    {
      id: 3,
      title: "Follow Up on Hot Lead",
      priority: "high",
      contact: "Sarah Johnson",
      context: "Viewed 3 properties last week, showed strong interest",
      action: "Schedule second showing for preferred property",
      cta: "Send Calendar Link",
      icon: Clock,
      urgency: "Within 2 Hours"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'medium':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default:
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    return priority === 'high' ? AlertCircle : Clock;
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <AlertCircle className="h-6 w-6 text-red-500" />
        Your Critical Outcomes for Today
      </h3>
      
      <div className="grid gap-4">
        {criticalOutcomes.map((outcome) => {
          const IconComponent = outcome.icon;
          const PriorityIcon = getPriorityIcon(outcome.priority);
          
          return (
            <Card key={outcome.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-foreground">{outcome.title}</h4>
                        <Badge className={getPriorityColor(outcome.priority)}>
                          <PriorityIcon className="h-3 w-3 mr-1" />
                          {outcome.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {outcome.urgency}
                        </Badge>
                      </div>
                      
                      {outcome.property && (
                        <p className="text-sm font-medium text-foreground mb-1">
                          Property: {outcome.property}
                        </p>
                      )}
                      
                      {outcome.contact && (
                        <p className="text-sm font-medium text-foreground mb-1">
                          Contact: {outcome.contact}
                        </p>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {outcome.context}
                      </p>
                      
                      <p className="text-sm text-foreground mb-4 bg-muted/50 p-3 rounded-lg border border-border/50">
                        <strong>AI Recommendation:</strong> {outcome.action}
                      </p>
                    </div>
                  </div>
                  
                  <Button className="shrink-0 bg-primary hover:bg-primary/90">
                    {outcome.cta}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};