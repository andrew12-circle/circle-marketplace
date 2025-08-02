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
  rank?: number; // For numbering the courses
  members?: number; // Member count for community-style display
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

  // Enhanced click handler for better course viewing
  const handleCourseClick = () => {
    if (canAccess && (course.isEnrolled || course.progress !== undefined)) {
      // Open course viewer for enrolled courses or those with progress
      onContinue?.(course.id);
    } else if (canAccess) {
      handleEnroll();
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
        onClick={handleCourseClick}
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
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden hover-scale"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCourseClick}
    >
      <CardContent className="p-0">
        {/* Course Banner Image */}
        <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
          <img
            src={course.cover_image_url || `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop`}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          
          {/* Rank Badge */}
          {course.rank && (
            <div className="absolute top-3 left-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">#{course.rank}</span>
            </div>
          )}
          
          {/* Lock overlay for premium courses */}
          {!canAccess && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Lock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Pro Only</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Course Info */}
        <div className="p-4">
          {/* Course Title */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">{course.title}</h3>
          
          {/* Course Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
            {course.description}
          </p>
          
          {/* Members and Pricing */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {course.members ? `${course.members.toLocaleString()} Members` : `${course.totalStudents || 0} Students`}
              </span>
              <span className="text-muted-foreground">•</span>
              {isFree ? (
                <span className="font-bold text-green-600">Free</span>
              ) : course.price && course.price < 50 ? (
                <span className="font-bold text-blue-600">${course.price}/month</span>
              ) : (
                <span className="font-bold text-purple-600">${course.price}</span>
              )}
            </div>
            
            {/* Status badges */}
            <div className="flex items-center gap-1">
              {course.is_featured && (
                <Badge variant="secondary" className="text-xs">Featured</Badge>
              )}
              {course.is_pro && !isFree && (
                <Crown className="w-4 h-4 text-primary" />
              )}
            </div>
          </div>
          
          {/* Progress bar for enrolled courses */}
          {course.progress !== undefined && course.isEnrolled && (
            <div className="mt-3">
              <Progress value={course.progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};