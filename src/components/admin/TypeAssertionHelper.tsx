// Helper component to handle Supabase type assertions
import { supabase } from "@/integrations/supabase/client";

// Utility functions for type-safe Supabase operations
export const safeSupabaseUpdate = (table: string) => ({
  update: (data: any) => ({
    eq: (column: string, value: any) => (supabase.from(table).update as any)(data).eq(column as any, value),
    in: (column: string, values: any) => (supabase.from(table).update as any)(data).in(column as any, values)
  })
});

export const safeSupabaseSelect = (table: string) => ({
  select: (query: string) => ({
    eq: (column: string, value: any) => supabase.from(table).select(query).eq(column as any, value),
    in: (column: string, values: any) => supabase.from(table).select(query).in(column as any, values),
    single: () => supabase.from(table).select(query).single(),
    maybeSingle: () => supabase.from(table).select(query).maybeSingle()
  })
});

export const safeSupabaseInsert = (table: string) => ({
  insert: (data: any) => (supabase.from(table).insert as any)(data)
});

export const safeSupabaseDelete = (table: string) => ({
  delete: () => ({
    eq: (column: string, value: any) => supabase.from(table).delete().eq(column as any, value)
  })
});

// Type assertion for query results
export const assertQueryResult = (data: any) => data;