-- Add review source tracking fields to service_reviews table
ALTER TABLE public.service_reviews 
ADD COLUMN review_source text NOT NULL DEFAULT 'agent',
ADD COLUMN verified boolean NOT NULL DEFAULT false,
ADD COLUMN source_url text,
ADD COLUMN admin_notes text;

-- Create check constraint for review_source enum values
ALTER TABLE public.service_reviews
ADD CONSTRAINT service_reviews_review_source_check 
CHECK (review_source IN ('agent', 'vendor_provided', 'google_external', 'admin_assigned'));

-- Create index for efficient filtering by review source
CREATE INDEX idx_service_reviews_source ON public.service_reviews(review_source);
CREATE INDEX idx_service_reviews_verified ON public.service_reviews(verified);

-- Update existing reviews to be marked as agent reviews (since they were created by users)
UPDATE public.service_reviews SET review_source = 'agent' WHERE review_source IS NULL;