import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, Star, Download, Plus } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Podcast {
  id: string;
  title: string;
  creator: string;
  description: string;
  thumbnail: string;
  duration: string;
  episodeNumber?: number;
  seasonNumber?: number;
  releaseDate: string;
  category: string;
  rating?: number;
  isPlaying?: boolean;
  isPro?: boolean;
  tags?: string[];
}

interface PodcastCardProps {
  podcast: Podcast;
  onPlay: (podcastId: string) => void;
  onAddToLibrary?: (podcastId: string) => void;
  onDownload?: (podcastId: string) => void;
  size?: 'small' | 'medium' | 'large';
  showEpisodeInfo?: boolean;
}

export const PodcastCard = ({ 
  podcast, 
  onPlay, 
  onAddToLibrary,
  onDownload,
  size = 'medium',
  showEpisodeInfo = true 
}: PodcastCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          card: 'w-32',
          image: 'h-32',
          title: 'text-sm',
          creator: 'text-xs',
          description: 'text-xs line-clamp-2'
        };
      case 'large':
        return {
          card: 'w-80',
          image: 'h-80',
          title: 'text-lg',
          creator: 'text-sm',
          description: 'text-sm line-clamp-3'
        };
      default:
        return {
          card: 'w-48',
          image: 'h-48',
          title: 'text-base',
          creator: 'text-sm',
          description: 'text-sm line-clamp-2'
        };
    }
  };

  const classes = getSizeClasses();

  return (
    <Card 
      className={`${classes.card} overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Podcast Cover Art */}
      <div className="relative">
        <AspectRatio ratio={1}>
          <img 
            src={podcast.thumbnail} 
            alt={podcast.title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </AspectRatio>
        
        {/* Play/Pause Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-black shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(podcast.id);
            }}
          >
            {podcast.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Pro Badge */}
        {podcast.isPro && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1">
            PRO
          </Badge>
        )}

        {/* Episode Info Badge */}
        {showEpisodeInfo && podcast.episodeNumber && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {podcast.seasonNumber && `S${podcast.seasonNumber} `}E{podcast.episodeNumber}
          </div>
        )}
      </div>

      {/* Podcast Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className={`font-semibold text-foreground line-clamp-2 ${classes.title}`}>
            {podcast.title}
          </h3>
          <p className={`text-muted-foreground ${classes.creator}`}>
            {podcast.creator}
          </p>
        </div>

        {size !== 'small' && (
          <p className={`text-muted-foreground ${classes.description}`}>
            {podcast.description}
          </p>
        )}

        {/* Duration and Rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{podcast.duration}</span>
          </div>
          {podcast.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{podcast.rating}</span>
            </div>
          )}
        </div>

        {/* Release Date */}
        <p className="text-xs text-muted-foreground">
          {new Date(podcast.releaseDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}
        </p>

        {/* Action Buttons */}
        {size !== 'small' && (
          <div className="flex gap-2 pt-2">
            {onAddToLibrary && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToLibrary(podcast.id);
                }}
              >
                <Plus className="w-3 h-3" />
                Add
              </Button>
            )}
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(podcast.id);
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Tags */}
        {podcast.tags && podcast.tags.length > 0 && size === 'large' && (
          <div className="flex flex-wrap gap-1 pt-2">
            {podcast.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};