import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Book, 
  BookOpen, 
  Download, 
  Plus, 
  Star, 
  FileText,
  Eye,
  Clock
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover: string;
  pageCount?: number;
  category: string;
  rating?: number;
  releaseDate: string;
  isPro?: boolean;
  tags?: string[];
  progress?: number;
  isFinished?: boolean;
  estimatedReadTime?: string;
}

interface BookCardProps {
  book: Book;
  onRead: (bookId: string) => void;
  onAddToLibrary?: (bookId: string) => void;
  onDownload?: (bookId: string) => void;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export const BookCard = ({ 
  book, 
  onRead, 
  onAddToLibrary,
  onDownload,
  size = 'medium',
  showProgress = true,
  layout = 'vertical'
}: BookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          card: layout === 'horizontal' ? 'w-full h-20' : 'w-28',
          image: layout === 'horizontal' ? 'h-20 w-14' : 'h-36',
          title: 'text-xs',
          author: 'text-xs',
          description: 'text-xs line-clamp-1'
        };
      case 'large':
        return {
          card: layout === 'horizontal' ? 'w-full h-32' : 'w-56',
          image: layout === 'horizontal' ? 'h-32 w-22' : 'h-72',
          title: 'text-lg',
          author: 'text-sm',
          description: 'text-sm line-clamp-3'
        };
      default:
        return {
          card: layout === 'horizontal' ? 'w-full h-24' : 'w-40',
          image: layout === 'horizontal' ? 'h-24 w-16' : 'h-52',
          title: 'text-sm',
          author: 'text-xs',
          description: 'text-xs line-clamp-2'
        };
    }
  };

  const classes = getSizeClasses();

  if (layout === 'horizontal') {
    return (
      <Card 
        className={`${classes.card} overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group flex`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onRead(book.id)}
      >
        {/* Book Cover */}
        <div className="relative shrink-0">
          <div className={`${classes.image} relative`}>
            <img 
              src={book.cover} 
              alt={book.title}
              className="w-full h-full object-cover rounded-l-lg"
            />
            
            {/* Read Progress Overlay */}
            {book.progress !== undefined && book.progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5">
                {book.progress}%
              </div>
            )}

            {/* Pro Badge */}
            {book.isPro && (
              <Badge className="absolute top-1 right-1 bg-yellow-500 text-black text-xs px-1 py-0.5">
                PRO
              </Badge>
            )}
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h3 className={`font-semibold text-foreground line-clamp-2 ${classes.title}`}>
              {book.title}
            </h3>
            <p className={`text-muted-foreground ${classes.author}`}>
              {book.author}
            </p>
            
            {size !== 'small' && (
              <p className={`text-muted-foreground mt-1 ${classes.description}`}>
                {book.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{book.pageCount || 0} pages</span>
            </div>
            {book.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{book.rating}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {showProgress && book.progress !== undefined && book.progress > 0 && (
            <div className="mt-2">
              <Progress value={book.progress} className="h-1" />
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`${classes.card} overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Book Cover */}
      <div className="relative">
        <AspectRatio ratio={2/3}>
          <img 
            src={book.cover} 
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 rounded-t-lg"
          />
        </AspectRatio>
        
        {/* Read Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 rounded-t-lg ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-black shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onRead(book.id);
            }}
          >
            {book.progress && book.progress > 0 ? (
              <BookOpen className="w-6 h-6" />
            ) : (
              <Book className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Pro Badge */}
        {book.isPro && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1">
            PRO
          </Badge>
        )}

        {/* Progress Indicator */}
        {book.progress !== undefined && book.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1">
            {book.isFinished ? 'Finished' : `${book.progress}% read`}
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className={`font-semibold text-foreground line-clamp-2 ${classes.title}`}>
            {book.title}
          </h3>
          <p className={`text-muted-foreground ${classes.author}`}>
            {book.author}
          </p>
        </div>

        {size !== 'small' && (
          <p className={`text-muted-foreground ${classes.description}`}>
            {book.description}
          </p>
        )}

        {/* Book Details */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{book.pageCount || 0} pages</span>
          </div>
          {book.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{book.rating}</span>
            </div>
          )}
        </div>

        {/* Estimated Read Time */}
        {book.estimatedReadTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{book.estimatedReadTime}</span>
          </div>
        )}

        {/* Progress Bar */}
        {showProgress && book.progress !== undefined && book.progress > 0 && (
          <div className="space-y-1">
            <Progress value={book.progress} className="h-1" />
            <p className="text-xs text-muted-foreground">
              {book.isFinished ? 'Completed' : `${book.progress}% complete`}
            </p>
          </div>
        )}

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
                  onAddToLibrary(book.id);
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
                  onDownload(book.id);
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Tags */}
        {book.tags && book.tags.length > 0 && size === 'large' && (
          <div className="flex flex-wrap gap-1 pt-2">
            {book.tags.slice(0, 3).map((tag, index) => (
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