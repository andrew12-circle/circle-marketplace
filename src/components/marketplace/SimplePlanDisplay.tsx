
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle } from "lucide-react";

interface SimplePlanDisplayProps {
  plan: {
    goal_title: string;
    summary: string;
    confidence?: number;
    current_performance?: {
      transactions: number;
      gap_to_close: number;
    };
    timeframe_weeks: number;
    phases?: Array<{
      name: string;
      weeks: number;
      steps?: Array<{ expected_impact: string }>;
    }>;
  };
}

export function SimplePlanDisplay({ plan }: SimplePlanDisplayProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {plan.goal_title}
            </CardTitle>
            <CardDescription>{plan.summary}</CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {plan.confidence ? `${Math.round(plan.confidence * 100)}% Match` : 'Generated'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {plan.current_performance && (
          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-background/50 rounded-lg">
            <div>
              <div className="text-2xl font-bold text-primary">{plan.current_performance.transactions}</div>
              <div className="text-sm text-muted-foreground">Current Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{plan.current_performance.gap_to_close}</div>
              <div className="text-sm text-muted-foreground">Gap to Close</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{plan.timeframe_weeks}w</div>
              <div className="text-sm text-muted-foreground">Timeline</div>
            </div>
          </div>
        )}

        {plan.phases && plan.phases.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Growth Phases</h4>
            {plan.phases.slice(0, 3).map((phase, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-background/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{phase.name}</div>
                  <div className="text-sm text-muted-foreground">{phase.steps?.[0]?.expected_impact}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{phase.weeks} weeks</div>
                  <div className="text-sm text-muted-foreground">{phase.steps?.length || 0} steps</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
