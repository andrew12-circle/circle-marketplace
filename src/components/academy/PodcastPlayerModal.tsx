import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  Download,
  Share,
  MoreHorizontal,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  isPro?: boolean;
  tags?: string[];
}

interface PodcastPlayerModalProps {
  podcast: Podcast | null;
  isOpen: boolean;
  onClose: () => void;
  audioUrl?: string;
}

export const PodcastPlayerModal = ({ 
  podcast, 
  isOpen, 
  onClose, 
  audioUrl 
}: PodcastPlayerModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioUrl]);

  // Play/Pause control
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Seek to position
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  // Volume control
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setVolume(value);
    audio.volume = value[0] / 100;
    setIsMuted(value[0] === 0);
  };

  // Mute toggle
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume[0] / 100;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Skip forward/backward
  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 15, audio.duration);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  };

  // Playback speed control
  const handlePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    
    setPlaybackRate(nextRate);
    audio.playbackRate = nextRate;
  };

  if (!podcast || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 bg-gradient-to-b from-background to-muted/30">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Audio Element */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} preload="metadata" />
        )}

        <div className="p-8">
          {/* Top Section - Cover Art & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Cover Art */}
            <div className="flex justify-center">
              <div className="relative w-80 h-80 rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={podcast.thumbnail} 
                  alt={podcast.title}
                  className="w-full h-full object-cover"
                />
                {podcast.isPro && (
                  <Badge className="absolute top-4 right-4 bg-yellow-500 text-black">
                    PRO
                  </Badge>
                )}
              </div>
            </div>

            {/* Podcast Info */}
            <div className="space-y-6">
              <div>
                {podcast.episodeNumber && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {podcast.seasonNumber && `Season ${podcast.seasonNumber}, `}Episode {podcast.episodeNumber}
                  </p>
                )}
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {podcast.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  {podcast.creator}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {podcast.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{podcast.duration}</span>
                <span>•</span>
                <span>{new Date(podcast.releaseDate).toLocaleDateString()}</span>
                <span>•</span>
                <span>{podcast.category}</span>
              </div>

              {/* Tags */}
              {podcast.tags && podcast.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {podcast.tags.slice(0, 5).map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Save
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share className="w-4 h-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Player Controls */}
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            {/* Progress Bar */}
            <div className="mb-6">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <Button
                variant="ghost"
                size="icon"
                className={isShuffle ? "text-primary" : "text-muted-foreground"}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <Shuffle className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={skipBackward}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipBack className="w-6 h-6" />
              </Button>

              <Button
                size="icon"
                className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-primary-foreground" />
                ) : (
                  <Play className="w-7 h-7 text-primary-foreground ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={skipForward}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="w-6 h-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={isRepeat ? "text-primary" : "text-muted-foreground"}
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <Repeat className="w-5 h-5" />
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
              {/* Volume Control */}
              <div className="flex items-center gap-3 w-48">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={isMuted ? [0] : volume}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
              </div>

              {/* Playback Speed */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlaybackRate}
                className="text-xs min-w-16"
              >
                {playbackRate}x
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};