-- Create web_vitals table for Core Web Vitals tracking
CREATE TABLE public.web_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metric_name TEXT NOT NULL CHECK (metric_name IN ('LCP', 'CLS', 'INP', 'FID', 'TTFB', 'TBT')),
  value NUMERIC NOT NULL CHECK (value >= 0),
  path TEXT NOT NULL,
  session_id TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  rating TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN metric_name = 'LCP' THEN 
        CASE WHEN value <= 2500 THEN 'good' WHEN value <= 4000 THEN 'needs-improvement' ELSE 'poor' END
      WHEN metric_name = 'CLS' THEN 
        CASE WHEN value <= 0.1 THEN 'good' WHEN value <= 0.25 THEN 'needs-improvement' ELSE 'poor' END
      WHEN metric_name IN ('INP', 'FID') THEN 
        CASE WHEN value <= 200 THEN 'good' WHEN value <= 500 THEN 'needs-improvement' ELSE 'poor' END
      WHEN metric_name = 'TTFB' THEN 
        CASE WHEN value <= 800 THEN 'good' WHEN value <= 1800 THEN 'needs-improvement' ELSE 'poor' END
      ELSE 'unknown'
    END
  ) STORED
);

-- Enable RLS
ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY;

-- Allow inserts from any user (anon or authenticated) for metrics collection
CREATE POLICY "Allow metrics collection from any user" 
ON public.web_vitals 
FOR INSERT 
WITH CHECK (true);

-- Only admins can read the metrics
CREATE POLICY "Only admins can view web vitals" 
ON public.web_vitals 
FOR SELECT 
USING (get_user_admin_status() = true);

-- Create index for performance queries
CREATE INDEX idx_web_vitals_metric_created ON public.web_vitals(metric_name, created_at DESC);
CREATE INDEX idx_web_vitals_path_created ON public.web_vitals(path, created_at DESC);
CREATE INDEX idx_web_vitals_session ON public.web_vitals(session_id);

-- Create a view for latest metrics summary
CREATE VIEW public.web_vitals_summary AS
SELECT 
  metric_name,
  path,
  COUNT(*) as sample_count,
  (AVG(value)::numeric(10,2)) as avg_value,
  (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)::numeric(10,2)) as p50_value,
  (PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value)::numeric(10,2)) as p75_value,
  (PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value)::numeric(10,2)) as p95_value,
  (COUNT(CASE WHEN rating = 'good' THEN 1 END)::FLOAT / COUNT(*) * 100) as good_percentage,
  DATE_TRUNC('day', created_at) as date_collected
FROM public.web_vitals 
WHERE created_at >= now() - interval '30 days'
GROUP BY metric_name, path, DATE_TRUNC('day', created_at)
ORDER BY date_collected DESC, metric_name, path;