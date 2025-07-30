import { BookCard } from "./BookCard";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

interface BookSectionProps {
  title: string;
  subtitle?: string;
  books: Book[];
  onRead: (bookId: string) => void;
  onAddToLibrary?: (bookId: string) => void;
  onDownload?: (bookId: string) => void;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  layout?: 'horizontal' | 'grid';
  cardLayout?: 'vertical' | 'horizontal';
}

export const BookSection = ({
  title,
  subtitle,
  books,
  onRead,
  onAddToLibrary,
  onDownload,
  showSeeAll = false,
  onSeeAll,
  size = 'medium',
  showProgress = true,
  layout = 'horizontal',
  cardLayout = 'vertical'
}: BookSectionProps) => {
  if (books.length === 0) {
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
          <p className="text-muted-foreground">No books available yet</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (layout === 'grid') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onRead={onRead}
              onAddToLibrary={onAddToLibrary}
              onDownload={onDownload}
              size={size}
              showProgress={showProgress}
              layout={cardLayout}
            />
          ))}
        </div>
      );
    }

    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <div className={`flex space-x-4 pb-4 ${cardLayout === 'horizontal' ? 'flex-col space-x-0 space-y-4' : ''}`}>
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onRead={onRead}
              onAddToLibrary={onAddToLibrary}
              onDownload={onDownload}
              size={size}
              showProgress={showProgress}
              layout={cardLayout}
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