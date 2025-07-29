import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Plus, MoreHorizontal, Clock, User } from "lucide-react";

interface Course {
  id: string;
  title: string;
  creator: string;
  duration: string;
  thumbnail?: string;
  isPro: boolean;
  progress?: number;
}

interface PlaylistCardProps {
  title: string;
  subtitle?: string;
  courses: Course[];
  onPlayAll: () => void;
  onAddCourse: () => void;
  onPlayCourse: (courseId: string) => void;
  showProgress?: boolean;
}

export const PlaylistCard = ({ 
  title, 
  subtitle, 
  courses, 
  onPlayAll, 
  onAddCourse, 
  onPlayCourse,
  showProgress = false 
}: PlaylistCardProps) => {
  return (
    <div className="bg-card rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onPlayAll} className="bg-circle-primary hover:bg-circle-primary-light">
            <PlayCircle className="w-4 h-4 mr-2" />
            Play All
          </Button>
          <Button variant="outline" size="icon" onClick={onAddCourse}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-2">
        {courses.map((course, index) => (
          <div 
            key={course.id}
            className="group flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onPlayCourse(course.id)}
          >
            {/* Track Number / Play Button */}
            <div className="w-8 h-8 flex items-center justify-center">
              <span className="text-sm text-muted-foreground group-hover:hidden">
                {index + 1}
              </span>
              <PlayCircle className="w-5 h-5 text-circle-primary hidden group-hover:block" />
            </div>

            {/* Thumbnail */}
            <div className="relative">
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-circle-primary to-circle-primary-light rounded flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              {course.isPro && (
                <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0 bg-circle-accent text-foreground">
                  Pro
                </Badge>
              )}
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{course.title}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-3 h-3" />
                <span>{course.creator}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{course.duration}</span>
              </div>
              {showProgress && course.progress !== undefined && (
                <div className="w-full bg-background rounded-full h-1 mt-2">
                  <div 
                    className="bg-circle-primary h-1 rounded-full transition-all" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="text-sm text-muted-foreground">
              {course.duration}
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No courses in this playlist yet.</p>
          <Button variant="outline" onClick={onAddCourse} className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Courses
          </Button>
        </div>
      )}
    </div>
  );
};