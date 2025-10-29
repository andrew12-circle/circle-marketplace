import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaybookAsset {
  id: string;
  coverPath: string;
  headshotPath: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Mapping of playbook IDs to their asset paths
    const assetMappings: PlaybookAsset[] = [
      {
        id: '1', // Update with actual playbook ID
        coverPath: '/playbook-covers/luxury-listing-mastery.jpg',
        headshotPath: '/agent-headshots/agent-1.jpg'
      },
      {
        id: '2',
        coverPath: '/playbook-covers/first-time-buyer-blueprint.jpg',
        headshotPath: '/agent-headshots/agent-2.jpg'
      },
      {
        id: '3',
        coverPath: '/playbook-covers/sphere-domination.jpg',
        headshotPath: '/agent-headshots/agent-3.jpg'
      },
      {
        id: '4',
        coverPath: '/playbook-covers/open-house-mastery.jpg',
        headshotPath: '/agent-headshots/agent-4.jpg'
      },
      {
        id: '5',
        coverPath: '/playbook-covers/negotiation-tactics.jpg',
        headshotPath: '/agent-headshots/agent-5.jpg'
      },
      {
        id: '6',
        coverPath: '/playbook-covers/social-media-secrets.jpg',
        headshotPath: '/agent-headshots/agent-6.jpg'
      },
      {
        id: '7',
        coverPath: '/playbook-covers/listing-presentation.jpg',
        headshotPath: '/agent-headshots/agent-7.jpg'
      },
      {
        id: '8',
        coverPath: '/playbook-covers/expired-listing-conversion.jpg',
        headshotPath: '/agent-headshots/agent-8.jpg'
      },
      {
        id: '9',
        coverPath: '/playbook-covers/buyer-agent-excellence.jpg',
        headshotPath: '/agent-headshots/agent-9.jpg'
      },
      {
        id: '10',
        coverPath: '/playbook-covers/team-building-blueprint.jpg',
        headshotPath: '/agent-headshots/agent-10.jpg'
      }
    ];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.replace('https://', '');
    const results = [];

    for (const asset of assetMappings) {
      const coverUrl = `https://${supabaseUrl}/storage/v1/object/public/playbook-covers${asset.coverPath}`;
      const headshotUrl = `https://${supabaseUrl}/storage/v1/object/public/agent-headshots${asset.headshotPath}`;

      // Update playbook with image URLs
      const { error } = await supabase
        .from('playbooks')
        .update({
          cover_url: coverUrl,
          agent_headshot_url: headshotUrl
        })
        .eq('id', asset.id);

      if (error) {
        console.error(`Error updating playbook ${asset.id}:`, error);
        results.push({ id: asset.id, success: false, error: error.message });
      } else {
        results.push({ id: asset.id, success: true });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in upload-playbook-assets:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
