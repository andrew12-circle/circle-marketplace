import { useState } from "react";
import { CourseCard } from "@/components/academy/CourseCard";
import { AcademyFilters } from "@/components/academy/AcademyFilters";
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with actual data from Google Sheets/Supabase
const mockCourses = [
  {
    id: "1",
    title: "Lead Generation Mastery: From Zero to Hero",
    creator: "Circle Team",
    topic: "lead-generation",
    duration: "2h 30m",
    thumbnail: "/placeholder.svg",
    description: "Learn proven strategies to generate high-quality leads consistently",
    isPro: false,
    rating: 4.9,
    lessonCount: 12,
  },
  {
    id: "2",
    title: "Social Media Branding for Real Estate",
    creator: "Top Agents",
    topic: "branding",
    duration: "1h 45m",
    thumbnail: "/placeholder.svg",
    description: "Build a powerful personal brand that attracts clients",
    isPro: true,
    rating: 4.8,
    lessonCount: 8,
    price: 97,
  },
  {
    id: "3",
    title: "Conversion Psychology: Close More Deals",
    creator: "Industry Experts",
    topic: "conversions",
    duration: "3h 15m",
    thumbnail: "/placeholder.svg",
    description: "Understand buyer psychology and improve your conversion rates",
    isPro: true,
    rating: 4.9,
    lessonCount: 15,
    price: 147,
  },
  {
    id: "4",
    title: "Mindset Shift: Think Like a Top Producer",
    creator: "Circle Team",
    topic: "mindset",
    duration: "45m",
    thumbnail: "/placeholder.svg",
    description: "Develop the mindset and habits of successful real estate agents",
    isPro: false,
    rating: 4.7,
    lessonCount: 6,
  },
];

export const Academy = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedCreator, setSelectedCreator] = useState("all");
  const [duration, setDuration] = useState("all");
  const [showProOnly, setShowProOnly] = useState(false);
  const { toast } = useToast();

  // Mock user state - replace with actual auth
  const isProUser = false;

  const handlePreview = (courseId: string) => {
    const course = mockCourses.find(c => c.id === courseId);
    toast({
      title: "Course Preview",
      description: `Opening preview for "${course?.title}"`,
    });
  };

  const handleEnroll = (courseId: string) => {
    const course = mockCourses.find(c => c.id === courseId);
    if (course?.isPro && !isProUser) {
      toast({
        title: "Upgrade Required",
        description: "Please upgrade to Circle Pro to access this course.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Enrolled Successfully",
        description: `You've enrolled in "${course?.title}"`,
      });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedTopic("all");
    setSelectedCreator("all");
    setDuration("all");
    setShowProOnly(false);
  };

  // Filter courses based on current filters
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === "all" || course.topic === selectedTopic;
    const matchesCreator = selectedCreator === "all" || 
                          course.creator.toLowerCase().replace(" ", "-") === selectedCreator;
    
    let matchesDuration = true;
    if (duration !== "all") {
      const courseDurationMinutes = parseDuration(course.duration);
      const [min, max] = duration.split("-").map(d => d.replace("+", ""));
      if (max) {
        matchesDuration = courseDurationMinutes >= parseInt(min) && courseDurationMinutes <= parseInt(max);
      } else {
        matchesDuration = courseDurationMinutes >= parseInt(min);
      }
    }
    
    const matchesProFilter = !showProOnly || course.isPro;
    
    return matchesSearch && matchesTopic && matchesCreator && matchesDuration && matchesProFilter;
  });

  const parseDuration = (duration: string): number => {
    const matches = duration.match(/(\d+)h?\s*(\d+)?m?/);
    if (!matches) return 0;
    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    return hours * 60 + minutes;
  };

  // Group courses for carousel display
  const featuredCourses = mockCourses.filter(course => course.rating && course.rating >= 4.8);
  const newCourses = mockCourses.slice(0, 4);
  const quickWins = mockCourses.filter(course => parseDuration(course.duration) <= 60);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Circle Academy</h1>
        <p className="text-xl text-muted-foreground">
          On-demand courses, playbooks, and content to accelerate your real estate success
        </p>
      </div>

      {/* Featured Sections */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Top Rated</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {featuredCourses.slice(0, 4).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPreview={handlePreview}
              onEnroll={handleEnroll}
              isProUser={isProUser}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4">Quick Wins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {quickWins.slice(0, 4).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPreview={handlePreview}
              onEnroll={handleEnroll}
              isProUser={isProUser}
            />
          ))}
        </div>
      </div>

      <AcademyFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedTopic={selectedTopic}
        onTopicChange={setSelectedTopic}
        selectedCreator={selectedCreator}
        onCreatorChange={setSelectedCreator}
        duration={duration}
        onDurationChange={setDuration}
        showProOnly={showProOnly}
        onProOnlyChange={setShowProOnly}
        onClearFilters={handleClearFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onPreview={handlePreview}
            onEnroll={handleEnroll}
            isProUser={isProUser}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No courses found matching your criteria.</p>
          <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};