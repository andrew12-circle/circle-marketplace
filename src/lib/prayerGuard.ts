// Prayer Guard Module for Spiritual Dedication System
import { supabase } from "@/integrations/supabase/client";

const DECLARATIONS = [
  'We plead the blood of Jesus over this company and every line of code.',
  'No weapon formed against us shall prosper.',
  'The Lord is our refuge and fortress. In Him will we trust.',
  'We overcome by the blood of the Lamb and the word of our testimony.',
  'He shall give his angels charge over us, to keep us in all our ways.',
];

export async function dedicateBuild(meta: Record<string, any> = {}) {
  const body = `Dedication
${DECLARATIONS.join('\n')}

Numbers 6:24-26 — The Lord bless thee and keep thee.
The Lord make his face shine upon thee, and be gracious unto thee.
The Lord lift up his countenance upon thee, and give thee peace.`;

  try {
    await supabase.from('prayers').insert({ 
      kind: 'dedication', 
      body, 
      meta: { ...meta, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Prayer guard dedication error:', error);
  }
}

export async function deployBlessing(meta: Record<string, any> = {}) {
  const body = `Deploy Blessing
We cover this release in the blood of Jesus.
No weapon formed against this deploy shall prosper.
Psalm 91 — He is our refuge and fortress.
We welcome the Holy Spirit to lead every decision.

Isaiah 54:17 — No weapon that is formed against thee shall prosper.`;

  try {
    await supabase.from('prayers').insert({ 
      kind: 'deploy', 
      body, 
      meta: { ...meta, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Prayer guard deploy blessing error:', error);
  }
}

/**
 * Call this anywhere you want a lightweight spiritual check and record.
 * For example before payment runs, cron jobs, or vendor onboarding.
 */
export async function applyPrayerGuard(event: string, meta: Record<string, any> = {}) {
  const body = `Prayer Guard
Event: ${event}
Declaration: The Lord surrounds us as a shield.
Psalm 91:11 — For he shall give his angels charge over thee, to keep thee in all thy ways.
We plead the blood of Jesus over this operation.`;

  try {
    await supabase.from('prayers').insert({ 
      kind: 'manual', 
      body, 
      meta: { ...meta, event, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Prayer guard application error:', error);
  }
}

/**
 * Get a random scripture for blessing display
 */
export async function getDailyScripture(tags: string[] = []) {
  try {
    let query = supabase.from('scriptures').select('*');
    
    if (tags.length > 0) {
      query = query.overlaps('tags', tags);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching daily scripture:', error);
    return null;
  }
}

/**
 * Manual declaration function for team use
 */
export function speakDeclaration() {
  const declaration = `I plead the blood of Jesus over Circle Network.
No weapon formed against this work will prosper.
The Lord blesses this house and all who enter.
We welcome the Holy Spirit to lead every decision.

Numbers 6:24-26 — The Lord bless thee, and keep thee. 
The Lord make his face shine upon thee, and be gracious unto thee. 
The Lord lift up his countenance upon thee, and give thee peace.`;

  console.log('🙏 SPEAK THIS DECLARATION:', declaration);
  return declaration;
}

export const SPIRITUAL_COVERAGE = {
  CHECKOUT: 'checkout_protection',
  VENDOR_ONBOARDING: 'vendor_onboarding_blessing',
  CO_PAY_REQUEST: 'co_pay_spiritual_covering',
  PAYMENT_PROCESSING: 'payment_protection',
  USER_REGISTRATION: 'new_user_blessing',
  ADMIN_OPERATIONS: 'admin_spiritual_armor',
} as const;