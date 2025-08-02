import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  Users, 
  Star, 
  Clock, 
  BookOpen,
  MessageCircle,
  Share2,
  Heart,
  MoreVertical,
  CheckCircle
} from "lucide-react";
import { CourseNavigation } from "./CourseNavigation";
import { CourseViewer } from "./CourseViewer";
import { CourseCommunity } from "./CourseCommunity";

interface Course {
  id: string;
  title: string;
  description: string;
  creator: {
    name: string;
    avatar?: string;
    title?: string;
  };
  cover_image_url?: string;
  progress?: number;
  totalLessons: number;
  completedLessons: number;
  students: number;
  rating: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  tags: string[];
  modules: CourseModule[];
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
}

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

interface CourseLayoutProps {
  course: Course;
  onClose: () => void;
}

export const CourseLayout = ({ course, onClose }: CourseLayoutProps) => {
  const [activeView, setActiveView] = useState<'content' | 'community'>('content');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentLesson = selectedLesson 
    ? course.modules.flatMap(m => m.lessons).find(l => l.id === selectedLesson)
    : course.modules[0]?.lessons[0];

  const progressPercentage = (course.completedLessons / course.totalLessons) * 100;

  return (
    <div className="flex h-screen bg-background">
      {/* Course Navigation Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 border-r border-border bg-card`}>
        <CourseNavigation
          course={course}
          selectedLesson={selectedLesson}
          onLessonSelect={setSelectedLesson}
          onClose={onClose}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Course Header */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div>
                <h1 className="text-xl font-bold truncate max-w-md">{course.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={course.creator.avatar} />
                      <AvatarFallback>{course.creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{course.creator.name}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Progress Indicator */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {course.completedLessons}/{course.totalLessons} completed
                </span>
                <Progress value={progressPercentage} className="w-24" />
                <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
              </div>

              {/* Action Buttons */}
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar (Mobile) */}
          <div className="md:hidden mt-3">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{course.completedLessons}/{course.totalLessons} lessons</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border bg-card">
          <div className="flex">
            <Button
              variant={activeView === 'content' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              onClick={() => setActiveView('content')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Content
            </Button>
            <Button
              variant={activeView === 'community' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              onClick={() => setActiveView('community')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Community
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'content' ? (
            <CourseViewer
              lesson={currentLesson}
              course={course}
              onMarkComplete={(lessonId) => {
                // Handle lesson completion
                console.log('Mark complete:', lessonId);
              }}
              onNextLesson={() => {
                // Navigate to next lesson
                const allLessons = course.modules.flatMap(m => m.lessons);
                const currentIndex = allLessons.findIndex(l => l.id === selectedLesson);
                if (currentIndex < allLessons.length - 1) {
                  setSelectedLesson(allLessons[currentIndex + 1].id);
                }
              }}
            />
          ) : (
            <CourseCommunity
              courseId={course.id}
              courseName={course.title}
            />
          )}
        </div>
      </div>
    </div>
  );
};