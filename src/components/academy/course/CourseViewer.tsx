import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  Play, 
  Pause, 
  Volume2, 
  Maximize, 
  CheckCircle, 
  ChevronRight,
  FileText,
  Clock,
  BookOpen
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  content?: string;
  videoUrl?: string;
}

interface CourseViewerProps {
  lesson: Lesson | undefined;
  course: any;
  onMarkComplete: (lessonId: string) => void;
  onNextLesson: () => void;
}

export const CourseViewer = ({ 
  lesson, 
  course, 
  onMarkComplete, 
  onNextLesson 
}: CourseViewerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a lesson to begin</h3>
          <p className="text-muted-foreground">
            Choose a lesson from the sidebar to start learning
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (lesson.type) {
      case 'video':
        return (
          <Card className="mb-6">
            <CardContent className="p-0">
              <AspectRatio ratio={16/9}>
                <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
                  {lesson.videoUrl ? (
                    <video
                      src={lesson.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                      poster="/placeholder.svg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </AspectRatio>
            </CardContent>
          </Card>
        );
      
      case 'text':
        return (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none">
                {lesson.content ? (
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                ) : (
                  <div>
                    <h3>Lesson Content</h3>
                    <p>This is a text-based lesson covering important concepts and information.</p>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
                    <h4>Key Points:</h4>
                    <ul>
                      <li>Important concept #1</li>
                      <li>Important concept #2</li>
                      <li>Important concept #3</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      
      case 'quiz':
        return (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Knowledge Check</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">Question 1: What is the main topic of this lesson?</p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      A) Option 1
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      B) Option 2
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      C) Option 3
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-5 h-5" />
                <span>Content not available</span>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Lesson Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{lesson.type}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {lesson.duration}
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
        </div>

        {/* Lesson Content */}
        {renderContent()}

        {/* Lesson Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!lesson.isCompleted && (
              <Button onClick={() => onMarkComplete(lesson.id)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            )}
            {lesson.isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>

          <Button onClick={onNextLesson} className="ml-auto">
            Next Lesson
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Additional Resources */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Resources</h3>
            <div className="text-sm text-muted-foreground">
              Additional materials and links will appear here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};