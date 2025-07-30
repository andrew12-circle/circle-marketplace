import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  content_url?: string;
  cover_image_url?: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
  is_featured?: boolean;
  total_plays?: number;
}

interface UseBooksOptions {
  featured?: boolean;
  category?: string;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export const useBooks = (options: UseBooksOptions = {}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    featured,
    category,
    limit,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;

  useEffect(() => {
    fetchBooks();
  }, [featured, category, limit, orderBy, orderDirection]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('content')
        .select(`
          id,
          title,
          description,
          category,
          page_count,
          cover_image_url,
          content_url,
          tags,
          creator_id,
          is_featured,
          is_pro,
          rating,
          total_plays,
          created_at,
          updated_at,
          published_at,
          metadata
        `)
        .eq('content_type', 'book')
        .eq('is_published', true);

      // Apply filters
      if (featured) {
        query = query.eq('is_featured', true);
      }

      if (category) {
        query = query.eq('category', category);
      }

      // Apply ordering
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match Book interface
      const transformedBooks: Book[] = (data || []).map(item => {
        // Safely parse metadata
        const metadata = item.metadata as any || {};
        
        return {
          id: item.id,
          title: item.title,
          author: metadata.author || 'Unknown Author',
          description: item.description || '',
          cover: item.cover_image_url || '/placeholder.svg',
          pageCount: item.page_count || metadata.pageCount,
          category: item.category,
          rating: item.rating || undefined,
          releaseDate: item.published_at || item.created_at,
          isPro: item.is_pro || false,
          tags: item.tags || [],
          progress: metadata.progress || 0,
          isFinished: metadata.isFinished || false,
          estimatedReadTime: metadata.estimatedReadTime,
          content_url: item.content_url,
          cover_image_url: item.cover_image_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
          creator_id: item.creator_id,
          is_featured: item.is_featured,
          total_plays: item.total_plays
        };
      });

      setBooks(transformedBooks);
      setError(null);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const incrementRead = async (bookId: string) => {
    try {
      const { error } = await supabase.rpc('increment_content_plays', {
        content_uuid: bookId
      });

      if (error) {
        console.error('Error incrementing book read count:', error);
      }
    } catch (err) {
      console.error('Error incrementing book read count:', err);
    }
  };

  const updateProgress = async (bookId: string, progress: number) => {
    try {
      // In a real app, you'd update user's reading progress in a separate table
      // For now, we'll just update the local state
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === bookId 
            ? { ...book, progress, isFinished: progress >= 100 }
            : book
        )
      );
    } catch (err) {
      console.error('Error updating reading progress:', err);
    }
  };

  return {
    books,
    loading,
    error,
    refetch: fetchBooks,
    incrementRead,
    updateProgress
  };
};