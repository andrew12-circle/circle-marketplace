import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Duplicate the recommendation engine logic for server-side use
interface AdvisorSignal {
  signal: string;
  value: string;
  weight: number;
}

interface PlaybookRecommendation {
  playbook_key: string;
  title: string;
  description: string;
  score: number;
}

interface ServiceRecommendation {
  service_id: string;
  category: string;
  title: string;
  priority: number;
  reasons: {
    peer_usage: string;
    expected_delta: string;
    fit_reason: string;
  };
}

const PLAYBOOKS = [
  {
    playbook_key: 'sphere_36_touch',
    title: 'Sphere 36-Touch System',
    description: 'Systematic approach to nurturing your sphere of influence with consistent touchpoints',
    triggers: {
      lead_sources: ['referrals'],
      follow_up_system: ['none', 'basic'],
      biggest_blocker: ['consistency', 'systems']
    }
  },
  {
    playbook_key: 'listing_led_farm',
    title: 'Listing-Led Geographic Farm',
    description: 'Dominate a specific area through consistent listing presence and market expertise',
    triggers: {
      side_focus: ['sellers', 'both'],
      market_density: ['suburban', 'urban'],
      niche_interest: ['general', 'move_up_sellers']
    }
  },
  {
    playbook_key: 'video_plus_gbp',
    title: 'Video Content + Google Business Profile',
    description: 'Build authority through video content and local search optimization',
    triggers: {
      lead_sources: ['online_leads', 'other'],
      market_density: ['urban', 'suburban'],
      time_commitment: ['5_to_8', '9_plus']
    }
  },
  {
    playbook_key: 'ppc_plus_isa',
    title: 'PPC Leads + ISA Follow-up',
    description: 'Generate online leads through paid advertising with dedicated inside sales support',
    triggers: {
      budget_band: ['750_to_1500', '1500_plus'],
      diy_vs_dfy: ['dfy', 'hybrid'],
      biggest_blocker: ['time']
    }
  }
];

const SERVICE_CATEGORIES = {
  crm: {
    title: 'CRM & Follow-up',
    services: [
      { id: 'crm_chime', title: 'Chime CRM', budget_gates: ['250_to_750', '750_to_1500', '1500_plus'], style: 'diy' },
      { id: 'crm_wise_agent', title: 'Wise Agent', budget_gates: ['under_250', '250_to_750'], style: 'diy' }
    ]
  },
  lead_gen: {
    title: 'Lead Generation',
    services: [
      { id: 'ppc_google', title: 'Google Ads Management', budget_gates: ['750_to_1500', '1500_plus'], style: 'dfy' },
      { id: 'facebook_ads', title: 'Facebook Lead Ads', budget_gates: ['250_to_750', '750_to_1500'], style: 'dfy' },
      { id: 'sphere_system', title: 'Sphere Nurture System', budget_gates: ['under_250', '250_to_750'], style: 'hybrid' }
    ]
  },
  marketing: {
    title: 'Marketing & Content',
    services: [
      { id: 'video_production', title: 'Monthly Video Package', budget_gates: ['750_to_1500', '1500_plus'], style: 'dfy' },
      { id: 'social_content', title: 'Social Media Content', budget_gates: ['250_to_750', '750_to_1500'], style: 'dfy' },
      { id: 'listing_marketing', title: 'Listing Marketing Suite', budget_gates: ['250_to_750', '750_to_1500'], style: 'hybrid' }
    ]
  },
  systems: {
    title: 'Systems & Automation',
    services: [
      { id: 'transaction_coord', title: 'Transaction Coordinator', budget_gates: ['750_to_1500', '1500_plus'], style: 'dfy' },
      { id: 'automation_setup', title: 'Automation Setup', budget_gates: ['250_to_750', '750_to_1500'], style: 'hybrid' },
      { id: 'virtual_assistant', title: 'Virtual Assistant', budget_gates: ['750_to_1500', '1500_plus'], style: 'dfy' }
    ]
  }
};

const selectPlaybook = (signals: Record<string, string>): PlaybookRecommendation => {
  let bestPlaybook = PLAYBOOKS[0];
  let bestScore = 0;

  for (const playbook of PLAYBOOKS) {
    let score = 0;
    
    for (const [signalKey, triggerValues] of Object.entries(playbook.triggers)) {
      const signalValue = signals[signalKey];
      if (signalValue && triggerValues.includes(signalValue)) {
        score += 10;
      }
    }

    if (playbook.playbook_key === 'sphere_36_touch' && signals.lead_sources === 'referrals') {
      score += 15;
    }
    if (playbook.playbook_key === 'ppc_plus_isa' && signals.budget_band === '1500_plus') {
      score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPlaybook = playbook;
    }
  }

  return { ...bestPlaybook, score: bestScore };
};

const selectServices = (signals: Record<string, string>, playbookKey: string): ServiceRecommendation[] => {
  const budgetBand = signals.budget_band || 'under_250';
  const style = signals.diy_vs_dfy || 'hybrid';
  const blocker = signals.biggest_blocker || 'time';
  const avgPrice = parseInt(signals.avg_price_point) || 300000;
  
  const selectedServices: ServiceRecommendation[] = [];
  
  const categoriesToInclude = getCategoriesForPlaybook(playbookKey, blocker);
  
  for (const categoryKey of categoriesToInclude.slice(0, 4)) {
    const category = SERVICE_CATEGORIES[categoryKey as keyof typeof SERVICE_CATEGORIES];
    if (!category) continue;
    
    const eligibleServices = category.services.filter(service => 
      service.budget_gates.includes(budgetBand) && 
      (style === 'hybrid' || service.style === style || service.style === 'hybrid')
    );
    
    if (eligibleServices.length > 0) {
      const service = eligibleServices[0];
      selectedServices.push({
        service_id: service.id,
        category: category.title,
        title: service.title,
        priority: selectedServices.length + 1,
        reasons: generateReasons(service, signals, avgPrice)
      });
    }
  }

  return selectedServices;
};

const getCategoriesForPlaybook = (playbookKey: string, blocker: string): string[] => {
  const baseCategories: Record<string, string[]> = {
    'sphere_36_touch': ['crm', 'marketing', 'systems'],
    'listing_led_farm': ['marketing', 'crm', 'systems'],
    'video_plus_gbp': ['marketing', 'lead_gen', 'systems'],
    'ppc_plus_isa': ['lead_gen', 'crm', 'systems']
  };

  let categories = baseCategories[playbookKey] || ['crm', 'marketing'];
  
  if (blocker === 'time') {
    categories = ['systems', ...categories.filter(c => c !== 'systems')];
  } else if (blocker === 'money') {
    categories = categories.filter(c => c !== 'lead_gen');
  }

  return categories;
};

const generateReasons = (service: any, signals: Record<string, string>, avgPrice: number) => {
  const volumeLevel = parseInt(signals.current_volume) || 5;
  
  return {
    peer_usage: `Agents at your volume (${volumeLevel} deals/year) commonly adopt this`,
    expected_delta: `Expected: +${Math.floor(volumeLevel * 0.2)} appointments per month`,
    fit_reason: `Addresses your main blocker: ${signals.biggest_blocker || 'systems'}`
  };
};

const calculateROI = (signals: Record<string, string>) => {
  const currentVolume = parseInt(signals.current_volume) || 5;
  const targetVolume = parseInt(signals.target_volume) || currentVolume + 5;
  const avgPrice = parseInt(signals.avg_price_point) || 300000;
  
  const goalGap = targetVolume - currentVolume;
  const appointmentLift = Math.max(goalGap * 6, 3); // Rough estimate
  const contractLift = Math.round(appointmentLift * 0.15);
  const gciDelta = contractLift * avgPrice * 0.025;
  
  return {
    appointments_est: appointmentLift,
    contracts_est: contractLift,
    gci_delta_est: Math.round(gciDelta),
    timeframe_months: 12
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get advisor signals for this user
    const { data: signals, error: signalsError } = await supabase
      .from('advisor_signals')
      .select('signal, value, weight')
      .eq('user_id', user.id);

    if (signalsError) {
      console.error('Error fetching signals:', signalsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch signals' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Convert signals to lookup object
    const signalMap: Record<string, string> = {};
    signals?.forEach(signal => {
      signalMap[signal.signal] = signal.value;
    });

    // Generate deterministic recommendations
    const playbook = selectPlaybook(signalMap);
    const services = selectServices(signalMap, playbook.playbook_key);
    const roi = calculateROI(signalMap);
    
    // Calculate confidence score
    const confidenceScore = Math.min(50 + (signals?.length || 0) * 5 + Math.min(playbook.score * 2, 20), 95);

    // Create reasons object for services
    const reasons: Record<string, any> = {};
    services.forEach(service => {
      reasons[service.service_id] = service.reasons;
    });

    // Persist the plan
    const { data: plan, error: planError } = await supabase
      .from('goal_based_recommendations')
      .insert({
        user_id: user.id,
        playbook_key: playbook.playbook_key,
        rec_skus: services.map(s => s.service_id),
        reasons,
        roi,
        confidence_score: confidenceScore,
        plan_data: {
          playbook,
          services,
          generated_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (planError) {
      console.error('Error saving plan:', planError);
      return new Response(JSON.stringify({ error: 'Failed to save plan' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      plan_id: plan.id,
      playbook,
      services,
      roi,
      confidence_score: confidenceScore,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in build-plan-from-signals:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});