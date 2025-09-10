// Category normalization and mapping utilities

export const DISPLAY_TO_TAG: Record<string, string> = {
  'Data & Analytics': 'cat:data-analytics',
  'Finance & Business Tools': 'cat:finance-business',
  'Finance & Ops': 'cat:finance-business',
  'Marketing Automation & Content': 'cat:marketing-automation',
  'Video & Media Tools': 'cat:video-media',
  'CRMs': 'cat:crms',
  'Ads & Lead Gen': 'cat:ads-lead-gen',
  'Website / IDX': 'cat:website-idx',
  'SEO': 'cat:seo',
  'Coaching': 'cat:coaching',
  'Listing & Showing Tools': 'cat:listing-showing',
  'Productivity & Collaboration': 'cat:productivity',
  'Virtual Assistants & Dialers': 'cat:virtual-assistants',
  'Team & Recruiting Tools': 'cat:team-recruiting',
  'CE & Licensing': 'cat:ce-licensing',
  'Client Event Kits': 'cat:client-events',
  'Print & Mail': 'cat:print-mail',
  'Signage & Branding': 'cat:signage-branding',
  'Presentations': 'cat:presentations',
  'Branding': 'cat:branding',
  'Client Retention': 'cat:client-retention',
  'Transaction Coordinator': 'cat:transaction-coordinator',
};

/**
 * Normalizes a display name or existing tag to a consistent cat: tag format
 */
export function normalizeCategoryToTag(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // If already a cat: tag, return normalized
  if (trimmed.startsWith('cat:')) {
    return trimmed.toLowerCase();
  }
  
  // Check if we have a direct mapping
  const mapped = DISPLAY_TO_TAG[trimmed];
  if (mapped) {
    return mapped;
  }
  
  // Generate slug as fallback
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  return `cat:${slug}`;
}

/**
 * Converts a cat: tag back to display name if possible
 */
export function tagToDisplayName(tag: string): string {
  if (!tag || !tag.startsWith('cat:')) return tag;
  
  // Find display name by tag
  const displayEntry = Object.entries(DISPLAY_TO_TAG).find(([_, value]) => value === tag);
  if (displayEntry) {
    return displayEntry[0];
  }
  
  // Fallback: convert slug to readable name
  return tag
    .replace('cat:', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}