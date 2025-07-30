import { PodcastCard } from "./PodcastCard";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

interface PodcastSectionProps {
  title: string;
  subtitle?: string;
  podcasts: Podcast[];
  onPlayPodcast: (podcastId: string) => void;
  onAddToLibrary?: (podcastId: string) => void;
  onDownload?: (podcastId: string) => void;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  size?: 'small' | 'medium' | 'large';
  showEpisodeInfo?: boolean;
  layout?: 'horizontal' | 'grid';
}

export const PodcastSection = ({
  title,
  subtitle,
  podcasts,
  onPlayPodcast,
  onAddToLibrary,
  onDownload,
  showSeeAll = false,
  onSeeAll,
  size = 'medium',
  showEpisodeInfo = true,
  layout = 'horizontal'
}: PodcastSectionProps) => {
  if (podcasts.length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">No podcasts available yet</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (layout === 'grid') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {podcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              onPlay={onPlayPodcast}
              onAddToLibrary={onAddToLibrary}
              onDownload={onDownload}
              size={size}
              showEpisodeInfo={showEpisodeInfo}
            />
          ))}
        </div>
      );
    }

    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {podcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              onPlay={onPlayPodcast}
              onAddToLibrary={onAddToLibrary}
              onDownload={onDownload}
              size={size}
              showEpisodeInfo={showEpisodeInfo}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  };

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        
        {showSeeAll && onSeeAll && (
          <Button
            variant="ghost"
            onClick={onSeeAll}
            className="text-primary hover:text-primary/80 gap-1"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};