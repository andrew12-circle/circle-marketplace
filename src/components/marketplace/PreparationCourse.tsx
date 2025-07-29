import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Play, 
  FileText, 
  Clock, 
  BookOpen, 
  Award,
  ChevronRight,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PreparationCourseProps {
  consultationId: string;
  serviceTitle: string;
  onClose: () => void;
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'article' | 'checklist' | 'quiz';
  content: string;
  isCompleted: boolean;
}

export const PreparationCourse = ({ consultationId, serviceTitle, onClose }: PreparationCourseProps) => {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  // Sample course content - in a real app, this would come from your database
  const courseContent: CourseModule[] = [
    {
      id: '1',
      title: 'Understanding Your Project Scope',
      description: 'Learn how to clearly define your project requirements and goals.',
      duration: '5 min read',
      type: 'article',
      content: `
        <h3>Defining Your Project Scope</h3>
        <p>Before your consultation, it's important to have a clear understanding of what you're trying to achieve. This helps ensure we can provide the most accurate quote and timeline.</p>
        
        <h4>Key Questions to Consider:</h4>
        <ul>
          <li>What is the primary goal of this project?</li>
          <li>What does success look like to you?</li>
          <li>Are there any specific requirements or constraints?</li>
          <li>What is your timeline for completion?</li>
        </ul>
        
        <h4>Preparing Your Information</h4>
        <p>Gather any relevant documents, photos, or examples that help illustrate your vision. The more context you can provide, the better we can tailor our recommendations.</p>
      `,
      isCompleted: false
    },
    {
      id: '2',
      title: 'Budget Planning & Expectations',
      description: 'Set realistic expectations for your investment and timeline.',
      duration: '7 min read',
      type: 'article',
      content: `
        <h3>Understanding Investment Levels</h3>
        <p>Different project scopes require different investment levels. Understanding these ranges helps set proper expectations.</p>
        
        <h4>Factors That Affect Pricing:</h4>
        <ul>
          <li>Project complexity and scope</li>
          <li>Timeline and urgency</li>
          <li>Quality and premium features</li>
          <li>Market conditions</li>
        </ul>
        
        <h4>Getting the Best Value</h4>
        <p>Focus on outcomes rather than just price. A higher initial investment often leads to better long-term results and lower total cost of ownership.</p>
      `,
      isCompleted: false
    },
    {
      id: '3',
      title: 'Pre-Consultation Checklist',
      description: 'Ensure you have everything ready for a productive consultation.',
      duration: '3 min',
      type: 'checklist',
      content: `
        <h3>Before Your Consultation</h3>
        <p>Complete this checklist to make the most of your consultation time:</p>
        
        <div class="checklist">
          <label><input type="checkbox"> Review your project goals and requirements</label>
          <label><input type="checkbox"> Gather relevant documents and examples</label>
          <label><input type="checkbox"> Prepare your budget range</label>
          <label><input type="checkbox"> List any specific questions or concerns</label>
          <label><input type="checkbox"> Review your timeline and any deadlines</label>
          <label><input type="checkbox"> Test your video call setup (if virtual)</label>
        </div>
        
        <p><strong>Pro Tip:</strong> Write down your top 3 questions to ensure they get answered during the consultation.</p>
      `,
      isCompleted: false
    },
    {
      id: '4',
      title: 'Maximizing Your Consultation',
      description: 'Tips for getting the most value from your consultation session.',
      duration: '4 min read',
      type: 'article',
      content: `
        <h3>Making Every Minute Count</h3>
        <p>Your consultation is designed to be a collaborative discussion. Here's how to make it as productive as possible.</p>
        
        <h4>During the Consultation:</h4>
        <ul>
          <li>Be specific about your goals and constraints</li>
          <li>Ask about different approach options</li>
          <li>Discuss timeline flexibility</li>
          <li>Understand the next steps in the process</li>
        </ul>
        
        <h4>Questions to Ask:</h4>
        <ul>
          <li>What's included in the proposed scope?</li>
          <li>How do you handle changes or additions?</li>
          <li>What's the typical project timeline?</li>
          <li>How will we communicate throughout the project?</li>
        </ul>
      `,
      isCompleted: false
    }
  ];

  useEffect(() => {
    setModules(courseContent);
    loadProgress();
  }, []);

  const loadProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_progress')
        .select('completed_modules')
        .eq('user_id', user.id)
        .eq('consultation_id', consultationId)
        .single();

      if (data && data.completed_modules) {
        const completed = new Set(data.completed_modules);
        setCompletedModules(completed);
        setProgress((completed.size / courseContent.length) * 100);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const markModuleComplete = async (moduleId: string) => {
    if (!user) return;

    const newCompleted = new Set([...completedModules, moduleId]);
    setCompletedModules(newCompleted);
    
    const newProgress = (newCompleted.size / courseContent.length) * 100;
    setProgress(newProgress);

    // Save progress to database
    try {
      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          consultation_id: consultationId,
          completed_modules: Array.from(newCompleted),
          progress_percentage: newProgress,
          updated_at: new Date().toISOString()
        });

      toast({
        title: "Progress Saved",
        description: "Module marked as complete!",
      });

      if (newProgress === 100) {
        toast({
          title: "Course Complete! 🎉",
          description: "You're ready for your consultation. We'll send you a reminder 24 hours before your scheduled time.",
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'checklist': return <CheckCircle className="w-4 h-4" />;
      case 'quiz': return <Award className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (currentModule) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getModuleIcon(currentModule.type)}
                {currentModule.title}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentModule.duration}
                </span>
                <Badge variant="outline">{currentModule.type}</Badge>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setCurrentModule(null)}>
              Back to Course
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="prose max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: currentModule.content }}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentModule(null)}>
              Back to Course
            </Button>
            {!completedModules.has(currentModule.id) && (
              <Button onClick={() => markModuleComplete(currentModule.id)}>
                Mark as Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Consultation Preparation Course
        </CardTitle>
        <p className="text-muted-foreground">
          Complete this course to prepare for your <strong>{serviceTitle}</strong> consultation
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {modules.map((module, index) => (
            <Card 
              key={module.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                completedModules.has(module.id) ? 'bg-green-50 border-green-200' : ''
              }`}
              onClick={() => setCurrentModule(module)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      completedModules.has(module.id) 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {completedModules.has(module.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        getModuleIcon(module.type)
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {module.duration}
                        </span>
                        <Badge variant="outline" className="text-xs">{module.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Continue Later
          </Button>
          {progress === 100 && (
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Download Consultation Guide
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};