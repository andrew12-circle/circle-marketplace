import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Clock, 
  CheckCircle, 
  Lock,
  FileText,
  HelpCircle
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
}

interface ModuleCardProps {
  module: {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
    duration: string;
    isCompleted: boolean;
    isLocked: boolean;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onLessonSelect: (lessonId: string) => void;
  selectedLessonId?: string;
}

export const ModuleCard = ({ 
  module, 
  isExpanded, 
  onToggle, 
  onLessonSelect,
  selectedLessonId 
}: ModuleCardProps) => {
  const completedLessons = module.lessons.filter(l => l.isCompleted).length;
  const totalLessons = module.lessons.length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const getLessonIcon = (type: string, isCompleted: boolean, isLocked: boolean) => {
    if (isLocked) return <Lock className="w-4 h-4 text-muted-foreground" />;
    if (isCompleted) return <CheckCircle className="w-4 h-4 text-green-600" />;
    
    switch (type) {
      case 'video': return <Play className="w-4 h-4 text-blue-600" />;
      case 'text': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'quiz': return <HelpCircle className="w-4 h-4 text-orange-600" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'text': return 'bg-purple-100 text-purple-800';
      case 'quiz': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden animate-fade-in">
      {/* Module Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              {module.isCompleted && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {module.isLocked && (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{module.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {module.description}
              </p>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {module.duration}
                </span>
                <span>{totalLessons} lessons</span>
                <span>{completedLessons}/{totalLessons} completed</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {module.isCompleted && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Complete
              </Badge>
            )}
            {module.isLocked && (
              <Badge variant="outline">Locked</Badge>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Module Content */}
      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          <div className="border-t border-border pt-4">
            <div className="space-y-2">
              {module.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                    selectedLessonId === lesson.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  } ${lesson.isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => !lesson.isLocked && onLessonSelect(lesson.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      {getLessonIcon(lesson.type, lesson.isCompleted, lesson.isLocked)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{lesson.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTypeColor(lesson.type)}`}
                        >
                          {lesson.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {lesson.isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {lesson.isLocked && (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};