import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, Video, Crown, DollarSign } from 'lucide-react';

interface OnboardingAcademyStepProps {
  onNext: () => void;
}

export function OnboardingAcademyStep({ onNext }: OnboardingAcademyStepProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Academy & Creator Hub</CardTitle>
        <p className="text-sm text-muted-foreground">
          Learn, teach, and earn on our platform
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Learning Academy</h4>
              <p className="text-xs text-muted-foreground">
                Courses, videos, podcasts from top-performing agents
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Creator Monetization</h4>
              <p className="text-xs text-muted-foreground">
                Upload content and earn revenue from views and engagement
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-amber-800">Agent Playbooks</h4>
              <p className="text-xs text-amber-700">
                High-performing agents can create and sell detailed playbooks
              </p>
              <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-700 text-xs">
                Premium Feature
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Ready to learn and earn?</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Explore academy content or become a creator to start earning.
          </p>
          <div className="flex gap-2">
            <Badge variant="outline">Learn</Badge>
            <Badge variant="outline">Create</Badge>
            <Badge variant="outline">Earn</Badge>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={onNext} className="w-full">
            Complete Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}