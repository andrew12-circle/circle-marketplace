import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CourseLayout } from "./CourseLayout";

interface CourseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
}

// Mock course data - in real app, this would come from props or API
const mockCourse = {
  id: "1",
  title: "Complete Real Estate Lead Generation Mastery",
  description: "Master the art of generating high-quality real estate leads through proven strategies, modern technology, and time-tested techniques.",
  creator: {
    name: "Sarah Johnson",
    avatar: "/placeholder.svg",
    title: "Top 1% Real Estate Agent"
  },
  cover_image_url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop",
  progress: 45,
  totalLessons: 24,
  completedLessons: 11,
  students: 1247,
  rating: 4.8,
  duration: "8h 32m",
  level: "Intermediate" as const,
  category: "Lead Generation",
  tags: ["Facebook Ads", "Cold Calling", "CRM", "Marketing"],
  modules: [
    {
      id: "module-1",
      title: "Foundation & Mindset",
      description: "Build the right foundation and mindset for successful lead generation",
      duration: "1h 45m",
      isCompleted: true,
      isLocked: false,
      lessons: [
        {
          id: "lesson-1-1",
          title: "Welcome & Course Overview",
          type: "video" as const,
          duration: "12:30",
          isCompleted: true,
          isLocked: false,
          videoUrl: "/placeholder-video.mp4"
        },
        {
          id: "lesson-1-2",
          title: "The Lead Generation Mindset",
          type: "video" as const,
          duration: "18:45",
          isCompleted: true,
          isLocked: false
        },
        {
          id: "lesson-1-3",
          title: "Setting Up Your System",
          type: "text" as const,
          duration: "15:00",
          isCompleted: true,
          isLocked: false,
          content: "<h3>Setting Up Your Lead Generation System</h3><p>In this lesson, we'll cover the essential components of a successful lead generation system...</p>"
        },
        {
          id: "lesson-1-4",
          title: "Knowledge Check: Foundations",
          type: "quiz" as const,
          duration: "10:00",
          isCompleted: false,
          isLocked: false
        }
      ]
    },
    {
      id: "module-2",
      title: "Digital Marketing Strategies",
      description: "Master online lead generation through social media and digital marketing",
      duration: "2h 15m",
      isCompleted: false,
      isLocked: false,
      lessons: [
        {
          id: "lesson-2-1",
          title: "Facebook Ads for Real Estate",
          type: "video" as const,
          duration: "25:30",
          isCompleted: false,
          isLocked: false
        },
        {
          id: "lesson-2-2",
          title: "Google Ads Setup",
          type: "video" as const,
          duration: "22:15",
          isCompleted: false,
          isLocked: false
        },
        {
          id: "lesson-2-3",
          title: "Social Media Content Strategy",
          type: "text" as const,
          duration: "20:00",
          isCompleted: false,
          isLocked: false
        },
        {
          id: "lesson-2-4",
          title: "Landing Page Optimization",
          type: "video" as const,
          duration: "18:45",
          isCompleted: false,
          isLocked: false
        }
      ]
    },
    {
      id: "module-3",
      title: "Traditional Lead Generation",
      description: "Time-tested methods that still work in today's market",
      duration: "1h 50m",
      isCompleted: false,
      isLocked: false,
      lessons: [
        {
          id: "lesson-3-1",
          title: "Cold Calling Scripts That Work",
          type: "video" as const,
          duration: "20:30",
          isCompleted: false,
          isLocked: false
        },
        {
          id: "lesson-3-2",
          title: "Door Knocking Best Practices",
          type: "video" as const,
          duration: "15:20",
          isCompleted: false,
          isLocked: false
        },
        {
          id: "lesson-3-3",
          title: "Networking & Referrals",
          type: "text" as const,
          duration: "12:30",
          isCompleted: false,
          isLocked: false
        }
      ]
    },
    {
      id: "module-4",
      title: "Advanced Techniques",
      description: "Advanced strategies for scaling your lead generation",
      duration: "2h 30m",
      isCompleted: false,
      isLocked: true,
      lessons: [
        {
          id: "lesson-4-1",
          title: "AI-Powered Lead Generation",
          type: "video" as const,
          duration: "30:00",
          isCompleted: false,
          isLocked: true
        },
        {
          id: "lesson-4-2",
          title: "Building Your Lead Generation Team",
          type: "video" as const,
          duration: "25:15",
          isCompleted: false,
          isLocked: true
        }
      ]
    }
  ]
};

export const CourseViewerModal = ({ isOpen, onClose, courseId }: CourseViewerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] h-[100vh] w-[100vw] p-0 m-0 rounded-none">
        <CourseLayout course={mockCourse} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};