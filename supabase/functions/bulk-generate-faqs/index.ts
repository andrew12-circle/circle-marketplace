import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface BulkRequest {
  mode?: 'overwrite' | 'missing-only'
  limit?: number
  offset?: number
  dryRun?: boolean
}

interface ServiceRecord {
  id: string
  title: string
  description: string | null
  category?: string | null
  pricing_tiers?: any[] | null
  funnel_content?: Record<string, any> | null
}

function buildFaqs(svc: ServiceRecord) {
  const title = svc.title || 'this service'
  const category = svc.category || 'your goals'

  // Derive simple package list if pricing tiers exist
  const tiers = Array.isArray(svc.pricing_tiers) ? svc.pricing_tiers : []
  const tierNames = tiers
    .map((t: any) => t?.name || t?.title)
    .filter(Boolean)
    .slice(0, 5)

  const included = tiers.length
    ? `Packages typically include deliverables aligned to each tier${tierNames.length ? ` (e.g., ${tierNames.join(', ')})` : ''}. Specific inclusions depend on the package selected.`
    : `Engagements usually include discovery, a clear plan, execution, and performance tracking. Exact scope is tailored to your needs.`

  const packageCopy = tiers.length
    ? `Choose a package based on your priorities and timeline${tierNames.length ? ` — ${tierNames.join(', ')}` : ''}. We’ll confirm scope and next steps on kickoff.`
    : `Pick a package that fits your goals and timeline. We’ll align on scope, milestones, and budget during kickoff.`

  return [
    {
      question: 'Why Should I Care?',
      answer:
        `(${title}) helps you focus resources where they have the most impact. Expect clearer priorities, fewer wasted cycles, and progress that maps directly to business outcomes.`,
    },
    {
      question: "What's My ROI Potential?",
      answer:
        `ROI varies by market, channel mix, and execution. Teams using ${title} often see meaningful gains by focusing on high-leverage work first; your outcomes depend on inputs and consistency.`,
    },
    {
      question: 'How Soon Will I See Results?',
      answer:
        `Early signals can appear within 2–4 weeks; durable results typically build over 6–12 weeks as ${category} initiatives compound. Timelines vary by baseline and budget.`,
    },
    {
      question: "What's Included?",
      answer: included,
    },
    {
      question: 'Proof It Works',
      answer:
        `Success depends on execution quality and fit. We recommend starting with a pilot, reviewing leading indicators, and expanding once traction is clear. Results may vary by market.`,
    },
    {
      question: 'How Do I Get Started?',
      answer:
        `1) Book a quick consult. 2) Align on goals, budget, and timeline. 3) Select a package. 4) Kick off with a 30–60 day plan and weekly checkpoints.`,
    },
    {
      question: 'Choose Your Package',
      answer: packageCopy,
    },
  ]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userRes?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userRes.user.id)
      .maybeSingle()

    if (profErr || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { mode = 'overwrite', limit = 50, offset = 0, dryRun = false } = (await req.json()) as BulkRequest

    // Fetch services batch
    const { data: services, error: svcErr } = await supabaseAdmin
      .from('services')
      .select('id,title,description,category,pricing_tiers,funnel_content')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (svcErr) {
      console.error('Fetch services error:', svcErr)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch services' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const batch = (services || []) as ServiceRecord[]

    let processed = 0
    let updated = 0
    let skipped = 0
    const errors: Array<{ id: string; message: string }> = []

    for (const svc of batch) {
      processed += 1

      // If missing-only mode, skip those that already have 7 FAQs
      if (mode === 'missing-only') {
        const faq = (svc.funnel_content as any)?.faqSections
        if (Array.isArray(faq) && faq.length >= 7) {
          skipped += 1
          continue
        }
      }

      const newFaq = buildFaqs(svc)
      const newFunnel = {
        ...(svc.funnel_content || {}),
        faqSections: newFaq,
      }

      if (dryRun) {
        updated += 1
        continue
      }

      const { error: upErr } = await supabaseAdmin
        .from('services')
        .update({ funnel_content: newFunnel })
        .eq('id', svc.id)

      if (upErr) {
        errors.push({ id: svc.id, message: upErr.message })
      } else {
        updated += 1
      }
    }

    const hasMore = batch.length === limit

    return new Response(
      JSON.stringify({ processed, updated, skipped, nextOffset: offset + limit, hasMore, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('bulk-generate-faqs error:', e)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
