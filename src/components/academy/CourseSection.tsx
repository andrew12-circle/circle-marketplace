import { CourseAlbumCard } from "./CourseAlbumCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Course {
  id: string;
  title: string;
  creator: string;
  duration: string;
  thumbnail?: string;
  isPro: boolean;
  rating?: number;
}

interface CourseSectionProps {
  title: string;
  subtitle?: string;
  courses: Course[];
  onPlayCourse: (courseId: string) => void;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  size?: "small" | "medium" | "large";
}

export const CourseSection = ({ 
  title, 
  subtitle, 
  courses, 
  onPlayCourse, 
  showSeeAll = true,
  onSeeAll,
  size = "medium"
}: CourseSectionProps) => {
  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {showSeeAll && (
          <Button variant="ghost" onClick={onSeeAll}>
            See All
          </Button>
        )}
      </div>

      {/* Horizontal Scrolling Container */}
      <div className="relative group">
        {/* Scroll Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-lg"
          onClick={() => {
            const container = document.getElementById(`section-${title}`);
            if (container) {
              container.scrollBy({ left: -300, behavior: 'smooth' });
            }
          }}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-lg"
          onClick={() => {
            const container = document.getElementById(`section-${title}`);
            if (container) {
              container.scrollBy({ left: 300, behavior: 'smooth' });
            }
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Course Grid */}
        <div 
          id={`section-${title}`}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {courses.map((course) => (
            <CourseAlbumCard
              key={course.id}
              course={course}
              size={size}
              onPlay={onPlayCourse}
              className="flex-shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
};