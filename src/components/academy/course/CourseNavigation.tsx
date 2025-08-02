import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  HelpCircle,
  CheckCircle,
  Clock,
  Lock,
  Menu
} from "lucide-react";

interface CourseNavigationProps {
  course: any;
  selectedLesson: string | null;
  onLessonSelect: (lessonId: string) => void;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const CourseNavigation = ({ 
  course, 
  selectedLesson, 
  onLessonSelect, 
  onClose,
  collapsed,
  onToggleCollapse
}: CourseNavigationProps) => {
  const [expandedModules, setExpandedModules] = useState<string[]>(
    course.modules.map((m: any) => m.id)
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getLessonIcon = (type: string, isCompleted: boolean, isLocked: boolean) => {
    if (isLocked) return <Lock className="w-4 h-4 text-muted-foreground" />;
    if (isCompleted) return <CheckCircle className="w-4 h-4 text-green-600" />;
    
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'quiz': return <HelpCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (collapsed) {
    return (
      <div className="w-full h-full flex flex-col border-r border-border bg-card">
        <div className="p-2 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Academy
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="md:hidden">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <h2 className="font-semibold text-lg leading-tight mb-2">{course.title}</h2>
        
        {/* Course Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {course.completedLessons}/{course.totalLessons} lessons
            </span>
          </div>
          <Progress 
            value={(course.completedLessons / course.totalLessons) * 100} 
            className="h-2"
          />
        </div>
      </div>

      {/* Course Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {course.modules.map((module: any) => (
            <Collapsible
              key={module.id}
              open={expandedModules.includes(module.id)}
              onOpenChange={() => toggleModule(module.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {expandedModules.includes(module.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{module.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{module.lessons.length} lessons</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {module.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {module.isCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {module.isLocked && (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="ml-4">
                <div className="space-y-1">
                  {module.lessons.map((lesson: any) => (
                    <Button
                      key={lesson.id}
                      variant={selectedLesson === lesson.id ? "secondary" : "ghost"}
                      className="w-full justify-start p-2 h-auto text-left"
                      onClick={() => !lesson.isLocked && onLessonSelect(lesson.id)}
                      disabled={lesson.isLocked}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getLessonIcon(lesson.type, lesson.isCompleted, lesson.isLocked)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {lesson.title}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration}
                          </div>
                        </div>
                        {lesson.isCompleted && (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <Badge variant="secondary">{course.level}</Badge>
          <div className="text-muted-foreground">
            {course.category}
          </div>
        </div>
      </div>
    </div>
  );
};