import { Play, Clock, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  duration: string;
  category: string;
  rating?: number;
  isPro?: boolean;
  views?: string;
  description?: string;
}

interface VideoCardProps {
  video: Video;
  size?: "small" | "medium" | "large";
  onPlay: (videoId: string) => void;
  className?: string;
}

export const VideoCard = ({ 
  video, 
  size = "medium", 
  onPlay, 
  className 
}: VideoCardProps) => {
  const sizeClasses = {
    small: "w-64 h-36",
    medium: "w-80 h-45", 
    large: "w-96 h-54"
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg",
        sizeClasses[size],
        className
      )}
      onClick={() => onPlay(video.id)}
    >
      <div className="relative h-full">
        {/* Thumbnail */}
        <div className="relative h-2/3 bg-gray-100 overflow-hidden">
          <img 
            src={video.thumbnail || "/placeholder.svg"} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-900 ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.duration}
          </div>

          {/* Pro badge */}
          {video.isPro && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
              PRO
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3 h-1/3 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
              {video.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {video.creator}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {video.category}
            </span>
            {video.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs">{video.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};