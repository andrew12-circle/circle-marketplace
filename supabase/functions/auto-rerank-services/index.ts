import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch services
    const { data: services, error: sErr } = await supabase
      .from('services')
      .select('id,title,sort_order,is_verified,copay_allowed,retail_price,pro_price,created_at')

    if (sErr) throw sErr

    const getMetrics = async (id: string) => {
      const { data, error } = await supabase.rpc('get_service_tracking_metrics', { p_service_id: id, p_time_period: '30d' })
      if (error) throw error
      return data || {}
    }

    const getRating = async (id: string) => {
      const { data, error } = await supabase.rpc('get_service_rating_stats', { service_id: id }).single()
      if (error) return { average_rating: 0, total_reviews: 0 }
      return { average_rating: Number(data.average_rating || 0), total_reviews: Number(data.total_reviews || 0) }
    }

    const parsePrice = (p?: string | null) => {
      if (!p) return 0
      const n = Number(String(p).replace(/[^0-9.]/g, ''))
      return isFinite(n) ? n : 0
    }

    const scored: Array<{ id: string; score: number }> = []

    for (const s of services || []) {
      const [m, r] = await Promise.all([getMetrics(s.id), getRating(s.id)])
      const views = Number(m.total_views || 0)
      const clicks = Number(m.total_clicks || 0)
      const purchases = Number(m.total_purchases || 0)
      const revenue = Number(m.revenue_attributed || 0)
      const convRate = Number(m.conversion_rate || 0)
      const rating = Number(r.average_rating || 0)
      const verifiedBoost = s.is_verified ? 0.5 : 0
      const copayBoost = s.copay_allowed ? 0.3 : 0
      const price = parsePrice(s.pro_price) || parsePrice(s.retail_price)
      const priceAttractiveness = price > 0 ? Math.min(1, 500 / price) : 0.2

      const score = (
        purchases * 5 + clicks * 0.5 + views * 0.05 + revenue * 0.01 + convRate * 0.5 + rating * 0.4 + verifiedBoost + copayBoost + priceAttractiveness
      )

      scored.push({ id: s.id, score })
    }

    scored.sort((a, b) => b.score - a.score)

    // Update sort_order sequentially
    let rank = 1
    for (const item of scored) {
      const { error } = await supabase.from('services').update({ sort_order: rank }).eq('id', item.id)
      if (error) throw error
      rank++
    }

    return new Response(
      JSON.stringify({ success: true, updated: scored.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e?.message || 'Failed to re-rank' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
