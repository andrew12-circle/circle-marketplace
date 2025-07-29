import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, User, Lock } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    creator: string;
    topic: string;
    duration: string;
    thumbnail?: string;
    description?: string;
    isPro: boolean;
    rating?: number;
    lessonCount?: number;
    price?: number;
  };
  onPreview: (courseId: string) => void;
  onEnroll: (courseId: string) => void;
  isProUser?: boolean;
}

export const CourseCard = ({ course, onPreview, onEnroll, isProUser = false }: CourseCardProps) => {
  const canAccess = !course.isPro || isProUser;

  return (
    <Card className={`h-full flex flex-col hover:shadow-lg transition-shadow ${!canAccess ? 'opacity-75' : ''}`}>
      <div className="relative">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-circle-primary to-circle-primary-light rounded-t-lg flex items-center justify-center">
            <Play className="w-12 h-12 text-primary-foreground" />
          </div>
        )}
        
        {course.isPro && (
          <Badge className="absolute top-2 right-2 bg-circle-accent text-foreground">
            <Lock className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        )}
        
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {course.duration}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex-1">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs mb-2">
            {course.topic}
          </Badge>
          <h3 className="font-semibold text-lg leading-tight mb-2">{course.title}</h3>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{course.creator}</span>
        </div>

        {course.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {course.lessonCount && (
            <span>{course.lessonCount} lessons</span>
          )}
          {course.rating && (
            <span>⭐ {course.rating}</span>
          )}
        </div>

        {course.price && course.isPro && !isProUser && (
          <div className="mt-3">
            <span className="text-lg font-bold text-circle-primary">${course.price}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => onPreview(course.id)}
          className="flex-1"
          disabled={!canAccess}
        >
          <Play className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button 
          onClick={() => onEnroll(course.id)}
          className="flex-1 bg-circle-primary hover:bg-circle-primary-light"
          disabled={!canAccess}
        >
          {course.isPro && !isProUser ? 'Upgrade to Access' : 'Start Course'}
        </Button>
      </CardFooter>
    </Card>
  );
};