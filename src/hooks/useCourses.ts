import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Course {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  creator: string;
  cover_image_url?: string;
  content_url?: string;
  duration?: string;
  lesson_count?: number;
  category: string;
  rating?: number;
  price: number;
  is_pro?: boolean;
  is_featured?: boolean;
  is_published?: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
  total_plays?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  progress?: number;
  isEnrolled?: boolean;
  totalStudents?: number;
  rank?: number; // For course ranking
  members?: number; // Member count for community-style display
}

interface UseCoursesOptions {
  featured?: boolean;
  category?: string;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  free?: boolean;
  paid?: boolean;
}

export const useCourses = (options: UseCoursesOptions = {}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('content')
        .select(`
          id,
          title,
          description,
          creator_id,
          cover_image_url,
          content_url,
          duration,
          lesson_count,
          category,
          rating,
          price,
          is_pro,
          is_featured,
          is_published,
          tags,
          created_at,
          updated_at,
          total_plays,
          metadata
        `)
        .eq('content_type', 'course')
        .eq('is_published', true);

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.free) {
        query = query.eq('price', 0);
      }

      if (options.paid) {
        query = query.gt('price', 0);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Get creator names from profiles
      const creatorIds = [...new Set(data?.map(course => course.creator_id) || [])];
      const { data: creators } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', creatorIds);

      const creatorMap = new Map(creators?.map(creator => [creator.user_id, creator.display_name]) || []);

      const coursesData: Course[] = (data || []).map((course, index) => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        creator_id: course.creator_id,
        creator: creatorMap.get(course.creator_id) || 'Unknown Creator',
        cover_image_url: course.cover_image_url,
        content_url: course.content_url,
        duration: course.duration,
        lesson_count: course.lesson_count,
        category: course.category,
        rating: course.rating,
        price: course.price || 0,
        is_pro: course.is_pro,
        is_featured: course.is_featured,
        is_published: course.is_published,
        tags: course.tags,
        created_at: course.created_at,
        updated_at: course.updated_at,
        total_plays: course.total_plays,
        level: (course.metadata as any)?.level || 'Beginner',
        totalStudents: Math.floor(Math.random() * 1000) + 50, // Mock data for demo
        members: Math.floor(Math.random() * 50000) + 1000, // Mock member count
        rank: index + 1, // Assign ranking based on order
        progress: undefined, // Will be populated if user is enrolled
        isEnrolled: false // Will be populated based on user enrollment
      }));

      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [JSON.stringify(options)]);

  const enrollInCourse = async (courseId: string): Promise<void> => {
    try {
      // In a real implementation, you would:
      // 1. Create enrollment record
      // 2. Update course progress table
      // 3. Handle payment if it's a paid course
      
      console.log('Enrolling in course:', courseId);
      
      // Update local state to reflect enrollment
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, isEnrolled: true, progress: 0 }
          : course
      ));
    } catch (err) {
      console.error('Error enrolling in course:', err);
      throw err;
    }
  };

  const updateProgress = async (courseId: string, progress: number): Promise<void> => {
    try {
      // In a real implementation, you would update the course_progress table
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, progress }
          : course
      ));
    } catch (err) {
      console.error('Error updating course progress:', err);
      throw err;
    }
  };

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
    enrollInCourse,
    updateProgress
  };
};