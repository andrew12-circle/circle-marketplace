import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  ShoppingCart,
  Lock,
  Crown,
  CheckCircle
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string;
  creator: string;
  cover_image_url?: string;
  duration?: string;
  lesson_count?: number;
  category: string;
  rating?: number;
  price: number;
  is_pro?: boolean;
  is_featured?: boolean;
  tags?: string[];
  progress?: number;
  isEnrolled?: boolean;
  totalStudents?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  onContinue?: (courseId: string) => void;
  size?: 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
}

export const CourseCard = ({ 
  course, 
  onEnroll, 
  onContinue, 
  size = 'medium',
  layout = 'vertical' 
}: CourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const isProMember = profile?.is_pro_member || false;
  const isFree = course.price === 0;
  const canAccess = isFree || isProMember || course.isEnrolled;

  const handleEnroll = () => {
    if (isFree) {
      onEnroll?.(course.id);
      toast({
        title: "Enrolled!",
        description: `You've been enrolled in "${course.title}"`,
      });
    } else if (course.isEnrolled) {
      onContinue?.(course.id);
    } else {
      // Add to cart for paid courses
      addToCart({
        id: course.id,
        title: course.title,
        price: course.price,
        creator: course.creator,
        image_url: course.cover_image_url,
        type: 'course',
        description: course.description,
        duration: course.duration,
        lessonCount: course.lesson_count
      });
    }
  };

  const sizeClasses = {
    small: "w-48",
    medium: "w-64", 
    large: "w-80"
  };

  if (layout === 'horizontal') {
    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => canAccess && (course.isEnrolled ? onContinue?.(course.id) : onEnroll?.(course.id))}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Course Image */}
            <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative">
              <img
                src={course.cover_image_url || "/placeholder.svg"}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              {!canAccess && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm line-clamp-1">{course.title}</h3>
                <div className="flex items-center gap-1">
                  {course.is_featured && (
                    <Badge variant="secondary" className="text-xs">Featured</Badge>
                  )}
                  {course.is_pro && !isFree && (
                    <Crown className="w-3 h-3 text-primary" />
                  )}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mb-1">By {course.creator}</p>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                {course.lesson_count && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {course.lesson_count} lessons
                  </span>
                )}
                {course.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.duration}
                  </span>
                )}
                {course.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {course.rating}
                  </span>
                )}
              </div>
              
              {course.progress !== undefined && course.isEnrolled && (
                <div className="mb-2">
                  <Progress value={course.progress} className="h-1" />
                  <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
                </div>
              )}
            </div>
            
            {/* Action Button */}
            <div className="flex-shrink-0">
              {course.isEnrolled ? (
                <Button size="sm" variant="outline">
                  Continue
                </Button>
              ) : isFree ? (
                <Button size="sm">
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </Button>
              ) : canAccess ? (
                <Button size="sm">
                  <Play className="w-3 h-3 mr-1" />
                  Enroll
                </Button>
              ) : (
                <Button size="sm" variant="outline">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  ${course.price}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${sizeClasses[size]}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        {/* Course Image */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img
            src={course.cover_image_url || "/placeholder.svg"}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          
          {/* Overlay for locked courses */}
          {!canAccess && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Lock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Pro Member Only</p>
              </div>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {course.is_featured && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                Featured
              </Badge>
            )}
            {isFree && (
              <Badge className="bg-green-600 text-white text-xs">
                Free
              </Badge>
            )}
            {course.is_pro && !isFree && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
          </div>
          
          {/* Play button overlay */}
          {canAccess && (
            <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-primary ml-1" />
              </div>
            </div>
          )}
        </div>
        
        {/* Course Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{course.title}</h3>
          </div>
          
          <p className="text-xs text-muted-foreground mb-2">By {course.creator}</p>
          
          {size === 'large' && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {course.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {course.lesson_count && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {course.lesson_count}
              </span>
            )}
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {course.duration}
              </span>
            )}
            {course.level && (
              <Badge variant="outline" className="text-xs">
                {course.level}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {course.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{course.rating}</span>
                </div>
              )}
              {course.totalStudents && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span className="text-xs">{course.totalStudents}</span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              {isFree ? (
                <span className="text-sm font-bold text-green-600">Free</span>
              ) : (
                <span className="text-sm font-bold text-primary">${course.price}</span>
              )}
            </div>
          </div>
          
          {course.progress !== undefined && course.isEnrolled && (
            <div className="mb-3">
              <Progress value={course.progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
            </div>
          )}
          
          {size === 'large' && course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {course.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Action Button */}
          <Button 
            className="w-full" 
            size="sm"
            onClick={handleEnroll}
            disabled={!canAccess && !isFree}
          >
            {course.isEnrolled ? (
              <>
                <Play className="w-3 h-3 mr-2" />
                Continue Learning
              </>
            ) : isFree ? (
              <>
                <Play className="w-3 h-3 mr-2" />
                Start Course
              </>
            ) : canAccess ? (
              <>
                <CheckCircle className="w-3 h-3 mr-2" />
                Enroll Now
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3 mr-2" />
                Add to Cart - ${course.price}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};