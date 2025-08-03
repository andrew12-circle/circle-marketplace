import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useDebounce } from '@/hooks/useOptimizedHooks';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Heart } from 'lucide-react';

interface VirtualizedItem {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  image_url?: string;
  category: string;
  tags: string[];
}

interface VirtualizedListProps {
  items: VirtualizedItem[];
  onItemClick?: (item: VirtualizedItem) => void;
  onItemSave?: (itemId: string) => void;
  savedItems?: Set<string>;
  loading?: boolean;
  height?: number;
  itemSize?: number;
}

// Optimized list item component with memoization
const ListItem = React.memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: {
    items: VirtualizedItem[];
    onItemClick?: (item: VirtualizedItem) => void;
    onItemSave?: (itemId: string) => void;
    savedItems?: Set<string>;
  };
}) => {
  const { items, onItemClick, onItemSave, savedItems } = data;
  const item = items[index];
  
  if (!item) return null;

  const isSaved = savedItems?.has(item.id);

  const handleClick = useCallback(() => {
    onItemClick?.(item);
  }, [item, onItemClick]);

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onItemSave?.(item.id);
  }, [item.id, onItemSave]);

  // Memoize rating stars
  const ratingStars = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(item.rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300"
        }`}
      />
    )),
    [item.rating]
  );

  // Memoize price formatting
  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(item.price),
    [item.price]
  );

  return (
    <div style={style} className="p-2">
      <Card 
        className="group hover:shadow-md transition-all duration-200 cursor-pointer h-full"
        onClick={handleClick}
      >
        <CardContent className="p-4 h-full flex">
          {/* Image */}
          {item.image_url && (
            <div className="flex-shrink-0 w-20 h-20 mr-4">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm font-bold text-primary whitespace-nowrap">
                  {formattedPrice}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6"
                  onClick={handleSave}
                >
                  <Heart 
                    className={`h-3 w-3 ${
                      isSaved ? "fill-red-500 text-red-500" : "text-gray-400"
                    }`} 
                  />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {item.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {ratingStars}
              </div>
              
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {item.category}
                </Badge>
                {item.tags?.slice(0, 1).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ListItem.displayName = 'ListItem';

// Enhanced virtualized list with search and filtering
const VirtualizedServiceList: React.FC<VirtualizedListProps> = ({
  items,
  onItemClick,
  onItemSave,
  savedItems,
  loading = false,
  height = 600,
  itemSize = 120
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !debouncedSearch || 
        item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [items, debouncedSearch, selectedCategory]);

  // Memoized categories
  const categories = useMemo(() => 
    Array.from(new Set(items.map(item => item.category))),
    [items]
  );

  // Memoized list data
  const listData = useMemo(() => ({
    items: filteredItems,
    onItemClick,
    onItemSave,
    savedItems
  }), [filteredItems, onItemClick, onItemSave, savedItems]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex space-x-4 animate-pulse">
                <div className="w-20 h-20 bg-muted rounded-md"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
              >
                All
              </Button>
              {categories.slice(0, 5).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} services
          </div>
        </CardContent>
      </Card>

      {/* Virtualized List */}
      <Card>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No services found matching your criteria.</p>
            </div>
          ) : (
            <List
              height={height}
              itemCount={filteredItems.length}
              itemSize={itemSize}
              itemData={listData}
              overscanCount={5} // Render 5 extra items for smooth scrolling
            >
              {ListItem}
            </List>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualizedServiceList;