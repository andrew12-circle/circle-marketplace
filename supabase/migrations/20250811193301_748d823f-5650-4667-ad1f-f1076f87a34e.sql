
-- Rank services 1..N by predicted Realtor demand and conversion likelihood,
-- then set sort_order = rank (1 = top).
-- Safe to re-run; it recalculates scores and reorders all services.

WITH
-- 60-day engagement signals
eng AS (
  SELECT
    ste.service_id,
    SUM(CASE WHEN ste.event_type = 'view' THEN 1 ELSE 0 END) AS views_60d,
    SUM(CASE WHEN ste.event_type = 'click' THEN 1 ELSE 0 END) AS clicks_60d,
    SUM(CASE WHEN ste.event_type = 'booking' THEN 1 ELSE 0 END) AS bookings_60d,
    SUM(CASE WHEN ste.event_type = 'purchase' THEN 1 ELSE 0 END) AS purchases_60d
  FROM public.service_tracking_events ste
  WHERE ste.created_at >= now() - interval '60 days'
  GROUP BY ste.service_id
),
-- Social proof from service reviews (optional if you also use vendor reviews)
srv_reviews AS (
  SELECT
    sr.service_id,
    COALESCE(ROUND(AVG(sr.rating)::numeric, 2), 0) AS service_avg_rating,
    COUNT(*)::int AS service_review_count
  FROM public.service_reviews sr
  GROUP BY sr.service_id
),
-- Saved counts (intent proxy)
saves AS (
  SELECT
    ss.service_id,
    COUNT(*)::int AS saved_count
  FROM public.saved_services ss
  GROUP BY ss.service_id
),
-- Price parsing (favor $99–$299)
priced AS (
  SELECT
    s.id,
    COALESCE(
      NULLIF(REGEXP_REPLACE(s.pro_price,    '[^0-9.]', '', 'g'), '')::numeric,
      NULLIF(REGEXP_REPLACE(s.retail_price, '[^0-9.]', '', 'g'), '')::numeric
    ) AS price_num
  FROM public.services s
),
-- Vendor lens
vend AS (
  SELECT
    v.id,
    v.rating           AS vendor_rating,
    v.review_count     AS vendor_review_count,
    v.is_verified      AS vendor_verified,
    COALESCE(v.circle_commission_percentage, 0) AS vendor_commission_pct
  FROM public.vendors v
),
-- Build features and scoring
scored AS (
  SELECT
    s.id,
    s.title,
    s.category,
    s.description,
    s.copay_allowed,
    s.direct_purchase_enabled,
    s.requires_quote,
    s.is_featured,
    s.is_top_pick,
    s.is_verified AS service_verified,
    s.estimated_roi,

    -- Join signals
    COALESCE(v.vendor_rating, s.rating, 0)                       AS rating_raw,
    COALESCE(v.vendor_review_count, 0) + COALESCE(sr.service_review_count, 0) AS total_reviews,
    COALESCE(sr.service_avg_rating, 0)                           AS service_avg_rating,
    COALESCE(e.views_60d, 0)       AS views_60d,
    COALESCE(e.clicks_60d, 0)      AS clicks_60d,
    COALESCE(e.bookings_60d, 0)    AS bookings_60d,
    COALESCE(e.purchases_60d, 0)   AS purchases_60d,
    COALESCE(sa.saved_count, 0)    AS saved_count,
    COALESCE(p.price_num, NULL)    AS price_num,
    COALESCE(v.vendor_commission_pct, 0) AS vendor_commission_pct,
    COALESCE(v.vendor_verified, false)    AS vendor_verified,

    -- Normalize key features
    -- Rating 0..1
    LEAST(GREATEST(COALESCE(v.vendor_rating, s.rating, 0) / 5.0, 0), 1) AS rating_score,

    -- Review volume saturation to 300 reviews
    LEAST((COALESCE(v.vendor_review_count, 0) + COALESCE(sr.service_review_count, 0))::numeric / 300.0, 1) AS reviews_score,

    -- 60d engagement: weighted events, then log-normalized
    CASE
      WHEN (COALESCE(e.views_60d,0)
          + 4*COALESCE(e.clicks_60d,0)
          + 12*COALESCE(e.bookings_60d,0)
          + 20*COALESCE(e.purchases_60d,0)) > 0
      THEN
        LEAST(
          LN(1 + (COALESCE(e.views_60d,0)
                + 4*COALESCE(e.clicks_60d,0)
                + 12*COALESCE(e.bookings_60d,0)
                + 20*COALESCE(e.purchases_60d,0))) / LN(1 + 100.0)
          , 1
        )
      ELSE 0
    END AS engagement_score,

    -- Saved intent (log-normalized to 50)
    CASE
      WHEN COALESCE(sa.saved_count,0) > 0
      THEN LEAST(LN(1 + COALESCE(sa.saved_count,0)) / LN(1 + 50.0), 1)
      ELSE 0
    END AS saved_score,

    -- Price desirability
    CASE
      WHEN p.price_num IS NULL THEN 0.6
      WHEN p.price_num BETWEEN 99 AND 299 THEN 1.0     -- sweet spot
      WHEN p.price_num BETWEEN 300 AND 699 THEN 0.85
      WHEN p.price_num BETWEEN 700 AND 1499 THEN 0.70
      WHEN p.price_num < 99 THEN 0.90
      ELSE 0.50
    END AS price_score,

    -- ROI normalized to 0..1 @ 300% cap
    LEAST(GREATEST(COALESCE(s.estimated_roi,0) / 300.0, 0), 1) AS roi_score,

    -- Commission normalized to 0..1 @ 20% cap
    LEAST(GREATEST(COALESCE(v.vendor_commission_pct,0) / 20.0, 0), 1) AS commission_score,

    -- Binary boosters
    CASE WHEN COALESCE(s.copay_allowed,false) THEN 1 ELSE 0 END AS copay_flag,
    CASE WHEN COALESCE(s.direct_purchase_enabled,false) THEN 1 ELSE 0 END AS direct_flag,
    CASE WHEN COALESCE(s.requires_quote,false) THEN 1 ELSE 0 END AS quote_flag,
    CASE WHEN COALESCE(s.is_featured,false) THEN 1 ELSE 0 END AS featured_flag,
    CASE WHEN COALESCE(s.is_top_pick,false) THEN 1 ELSE 0 END AS toppick_flag,
    CASE WHEN COALESCE(s.is_verified,false) OR COALESCE(v.vendor_verified,false) THEN 1 ELSE 0 END AS verified_flag,

    -- Topic multiplier based on current Realtor focus (category/title/description)
    (
      CASE
        -- Seller lead/listing acquisition, home valuation
        WHEN s.category ILIKE '%seller%' OR s.category ILIKE '%listing%' OR s.title ILIKE '%seller%' OR s.title ILIKE '%listing%' OR s.description ILIKE '%home valuation%' THEN 1.30
        -- Google LSA/PPC/SEO
        WHEN s.category ILIKE '%google%' OR s.title ILIKE '%google%' OR s.category ILIKE '%seo%' OR s.title ILIKE '%seo%' OR s.title ILIKE '%ppc%' OR s.description ILIKE '%lsa%' THEN 1.25
        -- Lead gen general
        WHEN s.category ILIKE '%lead%' OR s.title ILIKE '%lead%' THEN 1.20
        -- Social/video content
        WHEN s.category ILIKE '%social%' OR s.title ILIKE '%social%' OR s.title ILIKE '%video%' OR s.category ILIKE '%video%' THEN 1.15
        -- CRM/follow-up automation, ISA
        WHEN s.title ILIKE '%crm%' OR s.description ILIKE '%follow up%' OR s.title ILIKE '%follow up%' OR s.title ILIKE '%isa%' THEN 1.15
        -- Open house/showings/events
        WHEN s.title ILIKE '%open house%' OR s.description ILIKE '%open house%' THEN 1.10
        -- Listing media (photo/video/3D)
        WHEN s.category ILIKE '%photo%' OR s.category ILIKE '%media%' OR s.title ILIKE '%photo%' OR s.title ILIKE '%3d%' OR s.description ILIKE '%matterport%' THEN 1.08
        -- Direct mail / print
        WHEN s.category ILIKE '%direct mail%' OR s.title ILIKE '%direct mail%' OR s.title ILIKE '%postcard%' THEN 1.06
        -- Branding/long-tail
        WHEN s.category ILIKE '%brand%' OR s.title ILIKE '%brand%' THEN 0.95
        ELSE 1.00
      END
    ) AS topic_multiplier
  FROM public.services s
  LEFT JOIN vend v ON v.id = s.vendor_id
  LEFT JOIN eng e ON e.service_id = s.id
  LEFT JOIN saves sa ON sa.service_id = s.id
  LEFT JOIN priced p ON p.id = s.id
  LEFT JOIN srv_reviews sr ON sr.service_id = s.id
),
weighted AS (
  SELECT
    id,
    title,
    category,
    -- Weighted sum. Tuneable weights below:
    (
      0.18 * rating_score
    + 0.12 * reviews_score
    + 0.20 * engagement_score
    + 0.10 * saved_score
    + 0.08 * CASE WHEN copay_flag = 1 THEN 1 ELSE 0 END
    + 0.06 * CASE WHEN direct_flag = 1 THEN 1 ELSE 0 END
    - 0.06 * CASE WHEN quote_flag = 1 THEN 1 ELSE 0 END
    + 0.05 * CASE WHEN featured_flag = 1 THEN 1 ELSE 0 END
    + 0.05 * CASE WHEN toppick_flag = 1 THEN 1 ELSE 0 END
    + 0.03 * CASE WHEN verified_flag = 1 THEN 1 ELSE 0 END
    + 0.08 * roi_score
    + 0.07 * price_score
    + 0.08 * commission_score
    ) * topic_multiplier AS final_score
  FROM scored
),
ranked AS (
  SELECT
    w.id,
    w.title,
    w.category,
    w.final_score,
    ROW_NUMBER() OVER (ORDER BY w.final_score DESC, w.title ASC) AS rn
  FROM weighted w
)
UPDATE public.services s
SET sort_order = r.rn,
    updated_at = now()
FROM ranked r
WHERE s.id = r.id;

-- Optional: preview top 50 (non-destructive). Uncomment to review in SQL editor.
-- SELECT rn AS new_sort_order, final_score, title, category
-- FROM ranked
-- ORDER BY rn
-- LIMIT 50;
