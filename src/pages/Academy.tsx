import { useState } from "react";
import { AcademySidebar } from "@/components/academy/AcademySidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  GraduationCap, 
  BookOpen, 
  Video, 
  Headphones, 
  Book
} from "lucide-react";

// Mock data - replace with actual data
const mockCourses = [
  {
    id: "1",
    title: "Lead Generation Mastery: From Zero to Hero",
    creator: "Circle Team",
    duration: "2h 30m",
    thumbnail: "/placeholder.svg",
    isPro: false,
    rating: 4.9,
    progress: 25,
  },
  {
    id: "2",
    title: "Social Media Branding for Real Estate",
    creator: "Sarah Johnson",
    duration: "1h 45m",
    thumbnail: "/placeholder.svg",
    isPro: true,
    rating: 4.8,
    progress: 75,
  },
  {
    id: "3",
    title: "Conversion Psychology: Close More Deals",
    creator: "Mike Chen",
    duration: "3h 15m",
    thumbnail: "/placeholder.svg",
    isPro: true,
    rating: 4.9,
  },
  {
    id: "4",
    title: "Mindset Shift: Think Like a Top Producer",
    creator: "Circle Team",
    duration: "45m",
    thumbnail: "/placeholder.svg",
    isPro: false,
    rating: 4.7,
    progress: 100,
  },
  {
    id: "5",
    title: "Instagram Marketing Masterclass",
    creator: "Emma Wilson",
    duration: "2h 15m",
    thumbnail: "/placeholder.svg",
    isPro: true,
    rating: 4.6,
  },
  {
    id: "6",
    title: "Negotiation Tactics That Win",
    creator: "David Rodriguez",
    duration: "1h 30m",
    thumbnail: "/placeholder.svg",
    isPro: false,
    rating: 4.8,
    progress: 50,
  },
];

const mockPlaylists = [
  { id: "1", name: "Getting Started", courseCount: 5 },
  { id: "2", name: "Advanced Strategies", courseCount: 8 },
  { id: "3", name: "Quick Wins", courseCount: 3 },
  { id: "4", name: "My Favorites", courseCount: 12 },
];

export const Academy = () => {
  const [activeView, setActiveView] = useState("home");
  const { toast } = useToast();

  const categories = [
    { id: "courses", label: "Courses", icon: GraduationCap },
    { id: "playbooks", label: "Playbooks", icon: BookOpen },
    { id: "videos", label: "Videos", icon: Video },
    { id: "podcasts", label: "Podcasts", icon: Headphones },
    { id: "books", label: "Books", icon: Book },
  ];

  const featuredContent = [
    {
      id: "1",
      type: "NEW COURSE",
      title: "The Agent Operating System",
      isNew: true,
      isDark: true,
    },
    {
      id: "2", 
      type: "NEW PLAYBOOK",
      title: "The 30-Day Content Machine",
      isNew: true,
      isDark: false,
    },
  ];

  const renderHomeView = () => (
    <div className="flex-1 p-8 max-w-6xl">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-6xl font-bold text-black mb-4">Academy.</h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Finally, we silenced the noise. Welcome to the Academy. A place you can take a 
          breath, learn, and actually move your career forward.
        </p>
      </div>

      {/* Category Icons */}
      <div className="flex gap-8 mb-16">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveView(category.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Icon className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* The Latest Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-black mb-2">The latest. </h2>
        <p className="text-gray-600 mb-8">Take a look at what's new.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {featuredContent.map((item) => (
            <Card
              key={item.id}
              className={`p-8 cursor-pointer transition-transform hover:scale-105 ${
                item.isDark 
                  ? "bg-gray-900 text-white" 
                  : "bg-blue-50 text-gray-900"
              }`}
            >
              <div className="mb-4">
                <span className={`text-sm font-medium ${
                  item.isDark ? "text-red-400" : "text-blue-600"
                }`}>
                  {item.type}
                </span>
              </div>
              <h3 className="text-2xl font-bold">{item.title}</h3>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bg-gray-900 text-white p-6 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Everything Agents Wish They Knew Sooner.</h3>
          <p className="text-sm text-gray-300">$47/month, Full access. Courses & coaching and reporting.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
          Try It Free
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return renderHomeView();
      default:
        return (
          <div className="flex-1 p-8">
            <h2 className="text-2xl font-bold mb-4">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h2>
            <p className="text-gray-600">Content for {activeView} coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <AcademySidebar
        activeView={activeView}
        onViewChange={setActiveView}
      />
      
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};