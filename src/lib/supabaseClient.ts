import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ihzyuyfawapweamqzzlj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0KB5vcex_xqO-YoTfcaU95HtX9nyl_s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});