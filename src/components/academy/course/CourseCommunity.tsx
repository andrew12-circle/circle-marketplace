import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Heart, 
  Share2, 
  MoreVertical,
  Pin,
  Users,
  Plus,
  Search,
  Filter,
  TrendingUp
} from "lucide-react";

interface CourseCommunityProps {
  courseId: string;
  courseName: string;
}

// Mock data for community posts
const mockPosts = [
  {
    id: "1",
    author: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg",
      title: "Real Estate Agent"
    },
    content: "Just completed the first module! The strategies for lead generation are incredible. Already implementing the Facebook ads approach.",
    timestamp: "2 hours ago",
    likes: 12,
    replies: 5,
    isPinned: true,
    tags: ["Module 1", "Lead Gen"]
  },
  {
    id: "2",
    author: {
      name: "Mike Chen",
      avatar: "/placeholder.svg",
      title: "Team Lead"
    },
    content: "Quick question about the CRM integration covered in lesson 3. Has anyone successfully connected with Chime? Would love to hear your experience!",
    timestamp: "4 hours ago",
    likes: 8,
    replies: 12,
    isPinned: false,
    tags: ["CRM", "Tech"]
  },
  {
    id: "3",
    author: {
      name: "Jennifer Martinez",
      avatar: "/placeholder.svg",
      title: "New Agent"
    },
    content: "Huge win! Applied the consultation script from module 2 and just closed my first deal this month. This course is paying for itself already! 🎉",
    timestamp: "1 day ago",
    likes: 24,
    replies: 18,
    isPinned: false,
    tags: ["Success Story", "Module 2"]
  }
];

export const CourseCommunity = ({ courseId, courseName }: CourseCommunityProps) => {
  const [newPost, setNewPost] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);

  const handleSubmitPost = () => {
    if (newPost.trim()) {
      // Handle post submission
      setNewPost("");
      setShowNewPost(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-muted/30">
      <div className="max-w-2xl mx-auto p-6">
        {/* Community Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Community</h1>
              <p className="text-muted-foreground">Connect with fellow students</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>142 members</span>
            </div>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">142</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">89%</div>
                <div className="text-sm text-muted-foreground">Completion</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-muted-foreground">Discussions</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search discussions..." className="pl-10" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* New Post Button */}
        {!showNewPost && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowNewPost(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Start a discussion...
              </Button>
            </CardContent>
          </Card>
        )}

        {/* New Post Form */}
        {showNewPost && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">New Discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What would you like to discuss?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={4}
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setShowNewPost(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitPost}>
                  Post Discussion
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Community Posts */}
        <div className="space-y-4">
          {mockPosts.map((post) => (
            <Card key={post.id} className="animate-fade-in">
              <CardContent className="p-4">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.author.name}</span>
                        {post.isPinned && (
                          <Pin className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {post.author.title} • {post.timestamp}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="mb-3">
                  <p className="text-sm leading-relaxed">{post.content}</p>
                </div>

                {/* Post Tags */}
                {post.tags.length > 0 && (
                  <div className="flex gap-1 mb-3">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Heart className="w-4 h-4 mr-1" />
                      {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {post.replies}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                  
                  {post.isPinned && (
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-6">
          <Button variant="outline">Load More Discussions</Button>
        </div>
      </div>
    </div>
  );
};