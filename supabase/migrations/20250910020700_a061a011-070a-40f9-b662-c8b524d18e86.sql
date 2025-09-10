-- Fix nested aggregate function calls in get_web_analytics_enhanced
CREATE OR REPLACE FUNCTION get_web_analytics_enhanced(p_period TEXT DEFAULT '30d')
RETURNS JSON AS $$
DECLARE
    start_date TIMESTAMPTZ;
    result JSON;
    total_sessions_count INTEGER := 0;
    unique_visitors_count INTEGER := 0;
    new_visitors_count INTEGER := 0;
    returning_visitors_count INTEGER := 0;
    avg_session_duration NUMERIC := 0;
    bounce_rate NUMERIC := 0;
    total_conversions_count INTEGER := 0;
    conversion_rate NUMERIC := 0;
    avg_scroll_depth_value NUMERIC := 0;
BEGIN
    -- Calculate start date based on period
    start_date := CASE
        WHEN p_period = '7d' THEN NOW() - INTERVAL '7 days'
        WHEN p_period = '30d' THEN NOW() - INTERVAL '30 days'
        WHEN p_period = '90d' THEN NOW() - INTERVAL '90 days'
        ELSE NOW() - INTERVAL '30 days'
    END;

    -- Get basic session metrics with individual queries to avoid nested aggregates
    SELECT COUNT(*) INTO total_sessions_count
    FROM web_analytics_sessions s
    WHERE s.created_at >= start_date;

    SELECT COUNT(DISTINCT s.anonymous_id) INTO unique_visitors_count
    FROM web_analytics_sessions s
    WHERE s.created_at >= start_date;

    SELECT COUNT(*) INTO new_visitors_count
    FROM web_analytics_sessions s
    WHERE s.created_at >= start_date 
    AND s.is_new_visitor = true;

    SELECT COUNT(*) INTO returning_visitors_count
    FROM web_analytics_sessions s
    WHERE s.created_at >= start_date 
    AND s.is_new_visitor = false;

    -- Calculate average session duration (avoiding nested aggregates)
    SELECT COALESCE(AVG(duration_minutes), 0) INTO avg_session_duration
    FROM (
        SELECT EXTRACT(EPOCH FROM (s.ended_at - s.created_at)) / 60.0 as duration_minutes
        FROM web_analytics_sessions s
        WHERE s.created_at >= start_date AND s.ended_at IS NOT NULL
    ) duration_calc;

    -- Calculate bounce rate
    SELECT CASE 
        WHEN total_sessions_count > 0 THEN 
            (COUNT(*) * 100.0 / total_sessions_count)
        ELSE 0 
    END INTO bounce_rate
    FROM web_analytics_sessions s
    WHERE s.created_at >= start_date
    AND NOT EXISTS (
        SELECT 1 FROM web_analytics_page_views pv 
        WHERE pv.session_id = s.id 
        AND pv.id != (
            SELECT MIN(pv2.id) FROM web_analytics_page_views pv2 
            WHERE pv2.session_id = s.id
        )
    );

    -- Get conversion metrics
    SELECT COUNT(*) INTO total_conversions_count
    FROM web_analytics_conversions c
    JOIN web_analytics_sessions s ON c.session_id = s.id
    WHERE s.created_at >= start_date;

    -- Calculate conversion rate
    SELECT CASE 
        WHEN total_sessions_count > 0 THEN 
            (total_conversions_count * 100.0 / total_sessions_count)
        ELSE 0 
    END INTO conversion_rate;

    -- Calculate average scroll depth
    SELECT COALESCE(AVG(scroll_depth), 0) INTO avg_scroll_depth_value
    FROM web_analytics_scroll_events se
    JOIN web_analytics_sessions s ON se.session_id = s.id
    WHERE s.created_at >= start_date;

    -- Build the final JSON result
    result := json_build_object(
        'period', p_period,
        'session_metrics', json_build_object(
            'total_sessions', total_sessions_count,
            'unique_visitors', unique_visitors_count,
            'new_visitors', new_visitors_count,
            'returning_visitors', returning_visitors_count,
            'avg_session_duration_minutes', ROUND(avg_session_duration, 1),
            'bounce_rate_percent', ROUND(bounce_rate, 1)
        ),
        'traffic_sources', json_build_object(
            'by_source_type', COALESCE((
                SELECT json_agg(json_build_object(
                    'source_type', source_type,
                    'sessions', session_count,
                    'percentage', ROUND((session_count * 100.0 / GREATEST(total_sessions_count, 1)), 1)
                ))
                FROM (
                    SELECT 
                        COALESCE(ts.source_type, 'direct') as source_type,
                        COUNT(*) as session_count
                    FROM web_analytics_sessions s
                    LEFT JOIN web_analytics_traffic_sources ts ON s.id = ts.session_id
                    WHERE s.created_at >= start_date
                    GROUP BY ts.source_type
                    ORDER BY session_count DESC
                ) traffic_breakdown
            ), '[]'::json),
            'top_referrers', COALESCE((
                SELECT json_agg(json_build_object(
                    'domain', referrer_domain,
                    'sessions', session_count
                ))
                FROM (
                    SELECT 
                        ts.referrer_domain,
                        COUNT(*) as session_count
                    FROM web_analytics_sessions s
                    JOIN web_analytics_traffic_sources ts ON s.id = ts.session_id
                    WHERE s.created_at >= start_date
                    AND ts.referrer_domain IS NOT NULL
                    AND ts.referrer_domain != ''
                    GROUP BY ts.referrer_domain
                    ORDER BY session_count DESC
                    LIMIT 10
                ) referrers
            ), '[]'::json)
        ),
        'device_breakdown', json_build_object(
            'device_types', COALESCE((
                SELECT json_agg(json_build_object(
                    'device_type', device_type,
                    'sessions', session_count,
                    'percentage', ROUND((session_count * 100.0 / GREATEST(total_sessions_count, 1)), 1)
                ))
                FROM (
                    SELECT 
                        device_type,
                        COUNT(*) as session_count
                    FROM web_analytics_sessions s
                    WHERE s.created_at >= start_date
                    GROUP BY device_type
                    ORDER BY session_count DESC
                ) devices
            ), '[]'::json),
            'browsers', COALESCE((
                SELECT json_agg(json_build_object(
                    'browser', browser_name,
                    'sessions', session_count
                ))
                FROM (
                    SELECT 
                        browser_name,
                        COUNT(*) as session_count
                    FROM web_analytics_sessions s
                    WHERE s.created_at >= start_date
                    GROUP BY browser_name
                    ORDER BY session_count DESC
                    LIMIT 10
                ) browsers
            ), '[]'::json),
            'operating_systems', COALESCE((
                SELECT json_agg(json_build_object(
                    'os', operating_system,
                    'sessions', session_count
                ))
                FROM (
                    SELECT 
                        operating_system,
                        COUNT(*) as session_count
                    FROM web_analytics_sessions s
                    WHERE s.created_at >= start_date
                    GROUP BY operating_system
                    ORDER BY session_count DESC
                    LIMIT 10
                ) os_data
            ), '[]'::json)
        ),
        'geographic_data', json_build_object(
            'countries', COALESCE((
                SELECT json_agg(json_build_object(
                    'country', country,
                    'sessions', session_count,
                    'percentage', ROUND((session_count * 100.0 / GREATEST(total_sessions_count, 1)), 1)
                ))
                FROM (
                    SELECT 
                        COALESCE(country, 'Unknown') as country,
                        COUNT(*) as session_count
                    FROM web_analytics_sessions s
                    WHERE s.created_at >= start_date
                    GROUP BY country
                    ORDER BY session_count DESC
                    LIMIT 15
                ) countries
            ), '[]'::json),
            'cities', COALESCE((
                SELECT json_agg(json_build_object(
                    'city', city,
                    'sessions', session_count
                ))
                FROM (
                    SELECT 
                        COALESCE(city, 'Unknown') as city,
                        COUNT(*) as session_count
                    FROM web_analytics_sessions s
                    WHERE s.created_at >= start_date
                    GROUP BY city
                    ORDER BY session_count DESC
                    LIMIT 15
                ) cities
            ), '[]'::json)
        ),
        'conversions', json_build_object(
            'total_conversions', total_conversions_count,
            'conversion_rate_percent', ROUND(conversion_rate, 2),
            'by_event_type', COALESCE((
                SELECT json_agg(json_build_object(
                    'event_type', event_type,
                    'count', conversion_count,
                    'total_value', total_value
                ))
                FROM (
                    SELECT 
                        c.event_type,
                        COUNT(*) as conversion_count,
                        COALESCE(SUM(c.value), 0) as total_value
                    FROM web_analytics_conversions c
                    JOIN web_analytics_sessions s ON c.session_id = s.id
                    WHERE s.created_at >= start_date
                    GROUP BY c.event_type
                    ORDER BY conversion_count DESC
                ) conversions
            ), '[]'::json)
        ),
        'behavior_metrics', json_build_object(
            'top_exit_pages', COALESCE((
                SELECT json_agg(json_build_object(
                    'page_url', page_url,
                    'exits', exit_count,
                    'avg_time_on_page', avg_time
                ))
                FROM (
                    SELECT 
                        pv.page_url,
                        COUNT(*) as exit_count,
                        ROUND(AVG(EXTRACT(EPOCH FROM (pv.ended_at - pv.created_at))), 0) as avg_time
                    FROM web_analytics_page_views pv
                    JOIN web_analytics_sessions s ON pv.session_id = s.id
                    WHERE s.created_at >= start_date
                    AND pv.is_exit = true
                    AND pv.ended_at IS NOT NULL
                    GROUP BY pv.page_url
                    ORDER BY exit_count DESC
                    LIMIT 10
                ) exits
            ), '[]'::json),
            'avg_scroll_depth', ROUND(avg_scroll_depth_value, 1)
        ),
        'generated_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;