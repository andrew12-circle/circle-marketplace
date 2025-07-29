import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Lock } from "lucide-react";

interface Course {
  id: string;
  title: string;
  creator: string;
  duration: string;
  thumbnail?: string;
  isPro: boolean;
  rating?: number;
}

interface CourseAlbumCardProps {
  course: Course;
  size?: "small" | "medium" | "large";
  onPlay: (courseId: string) => void;
  showCreator?: boolean;
  className?: string;
}

export const CourseAlbumCard = ({ 
  course, 
  size = "medium", 
  onPlay, 
  showCreator = true,
  className = ""
}: CourseAlbumCardProps) => {
  const sizeClasses = {
    small: "w-32",
    medium: "w-48",
    large: "w-64"
  };

  const imageSizes = {
    small: "h-32",
    medium: "h-48", 
    large: "h-64"
  };

  return (
    <Card className={`group cursor-pointer transition-all hover:shadow-lg ${sizeClasses[size]} ${className}`}>
      <div className="relative">
        {/* Album Cover */}
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className={`w-full ${imageSizes[size]} object-cover rounded-t-lg`}
          />
        ) : (
          <div className={`w-full ${imageSizes[size]} bg-gradient-to-br from-circle-primary via-circle-primary-light to-circle-accent rounded-t-lg flex items-center justify-center`}>
            <PlayCircle className="w-16 h-16 text-primary-foreground opacity-80" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div 
          className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center"
          onClick={() => onPlay(course.id)}
        >
          <div className="w-16 h-16 bg-circle-primary rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
            <PlayCircle className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        {/* Pro Badge */}
        {course.isPro && (
          <Badge className="absolute top-2 right-2 bg-circle-accent text-foreground">
            <Lock className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        )}
      </div>

      {/* Course Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
          {course.title}
        </h3>
        {showCreator && (
          <p className="text-sm text-muted-foreground truncate">
            {course.creator}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {course.duration}
          </span>
          {course.rating && (
            <span className="text-xs text-muted-foreground">
              ⭐ {course.rating}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};