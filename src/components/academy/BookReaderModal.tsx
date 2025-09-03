import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings,
  Bookmark,
  Share,
  Download,
  X,
  Type,
  Sun,
  Moon,
  Minus,
  Plus,
  RotateCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface BookReaderModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  contentUrl?: string;
}

export const BookReaderModal = ({ 
  book, 
  isOpen, 
  onClose, 
  contentUrl 
}: BookReaderModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(book?.pageCount || 100);
  const [fontSize, setFontSize] = useState([16]);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [readingProgress, setReadingProgress] = useState(book?.progress || 0);

  // Sample book content - in a real app, this would come from the contentUrl
  const sampleContent = `
    Chapter 1: Getting Started in Real Estate

    Welcome to the world of real estate! This comprehensive guide will take you through everything you need to know to become a successful real estate agent.

    Real estate is more than just buying and selling properties. It's about understanding people, markets, and opportunities. As a real estate professional, you'll be helping families find their dream homes, investors build their portfolios, and communities grow and thrive.

    The Foundation of Success

    Success in real estate starts with understanding the fundamentals. You need to know your market, understand the legal aspects of property transactions, and develop strong communication skills.

    Market Knowledge
    Understanding your local market is crucial. This includes knowing property values, neighborhood trends, school districts, and local amenities. Spend time driving through different areas, studying recent sales, and talking to other professionals in the field.

    Legal Understanding
    Real estate transactions involve complex legal documents and processes. While you don't need to be a lawyer, you should understand contracts, disclosures, and the various laws that govern real estate transactions in your area.

    Communication Skills
    Real estate is a people business. You'll be working with buyers, sellers, other agents, lenders, inspectors, and many other professionals. Strong communication skills will help you build relationships and navigate complex transactions.

    Building Your Business

    Once you understand the fundamentals, you can start building your real estate business. This involves developing a marketing strategy, building a network, and consistently providing excellent service to your clients.

    Remember, success in real estate doesn't happen overnight. It takes time, effort, and persistence. But with the right knowledge and approach, you can build a successful and rewarding career in real estate.
  `;

  const progressPercentage = (currentPage / totalPages) * 100;

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100';
      case 'sepia':
        return 'bg-amber-50 text-amber-900';
      default:
        return 'bg-white text-gray-900';
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      const newProgress = (newPage / totalPages) * 100;
      setReadingProgress(newProgress);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number[]) => {
    setCurrentPage(page[0]);
    const newProgress = (page[0] / totalPages) * 100;
    setReadingProgress(newProgress);
  };

  const toggleBookmark = () => {
    if (bookmarks.includes(currentPage)) {
      setBookmarks(bookmarks.filter(page => page !== currentPage));
    } else {
      setBookmarks([...bookmarks, currentPage]);
    }
  };

  const isBookmarked = bookmarks.includes(currentPage);

  if (!book || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-4">            
            <div className="flex items-center gap-3">
              <img 
                src={book.cover} 
                alt={book.title}
                className="w-8 h-10 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold text-sm">{book.title}</h3>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBookmark}
              className={isBookmarked ? "text-yellow-500" : ""}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button variant="ghost" size="icon">
              <Share className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="icon">
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between gap-8">
              {/* Font Size */}
              <div className="flex items-center gap-3">
                <Type className="w-4 h-4" />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFontSize([Math.max(12, fontSize[0] - 2)])}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm min-w-12 text-center">{fontSize[0]}px</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFontSize([Math.min(24, fontSize[0] + 2)])}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Theme */}
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="gap-1"
                >
                  <Sun className="w-3 h-3" />
                  Light
                </Button>
                <Button
                  variant={theme === 'sepia' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('sepia')}
                  className="gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Sepia
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="gap-1"
                >
                  <Moon className="w-3 h-3" />
                  Dark
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reading Content */}
        <div className={`flex-1 ${getThemeClasses()}`}>
          <ScrollArea className="h-full">
            <div className="max-w-3xl mx-auto p-8">
              <div 
                className="prose prose-lg max-w-none leading-relaxed"
                style={{ fontSize: `${fontSize[0]}px`, lineHeight: 1.6 }}
              >
                <div className="whitespace-pre-line">
                  {sampleContent}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t bg-background">
          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Page {currentPage} of {totalPages}</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <Slider
              value={[currentPage]}
              max={totalPages}
              min={1}
              step={1}
              onValueChange={goToPage}
              className="w-full"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                Chapter 1
              </Badge>
              {book.isPro && (
                <Badge className="bg-yellow-500 text-black text-xs">
                  PRO
                </Badge>
              )}
            </div>

            <Button
              variant="outline"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};