export interface AdvisorSignal {
  signal: string;
  value: string;
  weight: number;
}

export interface PlaybookRecommendation {
  playbook_key: string;
  title: string;
  description: string;
  score: number;
}

export interface ServiceRecommendation {
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

export interface RecommendationResult {
  playbook: PlaybookRecommendation;
  services: ServiceRecommendation[];
  confidence_score: number;
}

// Define available playbooks
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

// Define service categories and their SKUs (simplified for demo)
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

export const recommend = (signals: AdvisorSignal[]): RecommendationResult => {
  // Convert signals to lookup object
  const signalMap: Record<string, string> = {};
  signals.forEach(signal => {
    signalMap[signal.signal] = signal.value;
  });

  // Score and select playbook
  const playbook = selectPlaybook(signalMap);
  
  // Select services based on signals and playbook
  const services = selectServices(signalMap, playbook.playbook_key);
  
  // Calculate confidence score
  const confidence_score = calculateConfidence(signals, playbook, services);

  return {
    playbook,
    services,
    confidence_score
  };
};

const selectPlaybook = (signals: Record<string, string>): PlaybookRecommendation => {
  let bestPlaybook = PLAYBOOKS[0];
  let bestScore = 0;

  for (const playbook of PLAYBOOKS) {
    let score = 0;
    
    // Score based on trigger matches
    for (const [signalKey, triggerValues] of Object.entries(playbook.triggers)) {
      const signalValue = signals[signalKey];
      if (signalValue && triggerValues.includes(signalValue)) {
        score += 10;
      }
    }

    // Bonus scoring based on specific combinations
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

  return {
    ...bestPlaybook,
    score: bestScore
  };
};

const selectServices = (signals: Record<string, string>, playbookKey: string): ServiceRecommendation[] => {
  const budgetBand = signals.budget_band || 'under_250';
  const style = signals.diy_vs_dfy || 'hybrid';
  const blocker = signals.biggest_blocker || 'time';
  const avgPrice = parseInt(signals.avg_price_point) || 300000;
  
  const selectedServices: ServiceRecommendation[] = [];
  
  // Select 1 service per category, max 4 total
  const categoriesToInclude = getCategoriesForPlaybook(playbookKey, blocker);
  
  for (const categoryKey of categoriesToInclude.slice(0, 4)) {
    const category = SERVICE_CATEGORIES[categoryKey as keyof typeof SERVICE_CATEGORIES];
    if (!category) continue;
    
    // Find best service in this category
    const eligibleServices = category.services.filter(service => 
      service.budget_gates.includes(budgetBand) && 
      (style === 'hybrid' || service.style === style || service.style === 'hybrid')
    );
    
    if (eligibleServices.length > 0) {
      const service = eligibleServices[0]; // Take first eligible
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
  
  // Adjust based on blocker
  if (blocker === 'time') {
    categories = ['systems', ...categories.filter(c => c !== 'systems')];
  } else if (blocker === 'money') {
    categories = categories.filter(c => c !== 'lead_gen');
  }

  return categories;
};

const generateReasons = (service: any, signals: Record<string, string>, avgPrice: number) => {
  const volumeLevel = parseInt(signals.current_volume) || 5;
  const budgetBand = signals.budget_band || 'under_250';
  
  return {
    peer_usage: `Agents at your volume (${volumeLevel} deals/year) commonly adopt this`,
    expected_delta: `Expected: +${Math.floor(volumeLevel * 0.2)} appointments per month`,
    fit_reason: `Addresses your main blocker: ${signals.biggest_blocker || 'systems'}`
  };
};

const calculateConfidence = (signals: AdvisorSignal[], playbook: PlaybookRecommendation, services: ServiceRecommendation[]): number => {
  let confidence = 50; // Base confidence
  
  // Higher confidence with more signals
  confidence += Math.min(signals.length * 5, 30);
  
  // Higher confidence with better playbook match
  confidence += Math.min(playbook.score * 2, 20);
  
  // Cap at 95
  return Math.min(confidence, 95);
};