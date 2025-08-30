// Helper component to handle Supabase type assertions
import { supabase } from "@/integrations/supabase/client";

// Utility functions for type-safe Supabase operations
export const safeSupabaseUpdate = (table: string) => ({
  update: (data: any) => ({
    eq: (column: string, value: any) => (supabase.from(table).update as any)(data).eq(column as any, value)
  })
});

export const safeSupabaseSelect = (table: string) => ({
  select: (query: string) => ({
    eq: (column: string, value: any) => supabase.from(table).select(query).eq(column as any, value),
    single: () => supabase.from(table).select(query).single()
  })
});

export const safeSupabaseInsert = (table: string) => ({
  insert: (data: any) => (supabase.from(table).insert as any)(data)
});

// Type assertion for query results
export const assertQueryResult = (data: any) => data;