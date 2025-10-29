import { supabase } from '@/integrations/supabase/client';

// Import all cover images
import luxuryListingCover from '@/assets/playbook-covers/luxury-listing-mastery.jpg';
import firstTimeBuyerCover from '@/assets/playbook-covers/first-time-buyer-blueprint.jpg';
import sphereDominationCover from '@/assets/playbook-covers/sphere-domination.jpg';
import openHouseCover from '@/assets/playbook-covers/open-house-mastery.jpg';
import negotiationCover from '@/assets/playbook-covers/negotiation-tactics.jpg';
import socialMediaCover from '@/assets/playbook-covers/social-media-secrets.jpg';
import listingPresentationCover from '@/assets/playbook-covers/listing-presentation.jpg';
import expiredListingCover from '@/assets/playbook-covers/expired-listing-conversion.jpg';
import buyerAgentCover from '@/assets/playbook-covers/buyer-agent-excellence.jpg';
import teamBuildingCover from '@/assets/playbook-covers/team-building-blueprint.jpg';

// Import all agent headshots
import agent1 from '@/assets/agent-headshots/agent-1.jpg';
import agent2 from '@/assets/agent-headshots/agent-2.jpg';
import agent3 from '@/assets/agent-headshots/agent-3.jpg';
import agent4 from '@/assets/agent-headshots/agent-4.jpg';
import agent5 from '@/assets/agent-headshots/agent-5.jpg';
import agent6 from '@/assets/agent-headshots/agent-6.jpg';
import agent7 from '@/assets/agent-headshots/agent-7.jpg';
import agent8 from '@/assets/agent-headshots/agent-8.jpg';
import agent9 from '@/assets/agent-headshots/agent-9.jpg';
import agent10 from '@/assets/agent-headshots/agent-10.jpg';

interface AssetUpload {
  playbookId: string;
  coverImage: string;
  headshotImage: string;
  coverFileName: string;
  headshotFileName: string;
}

const assetMappings: AssetUpload[] = [
  {
    playbookId: '1',
    coverImage: luxuryListingCover,
    headshotImage: agent1,
    coverFileName: 'luxury-listing-mastery.jpg',
    headshotFileName: 'agent-1.jpg'
  },
  {
    playbookId: '2',
    coverImage: firstTimeBuyerCover,
    headshotImage: agent2,
    coverFileName: 'first-time-buyer-blueprint.jpg',
    headshotFileName: 'agent-2.jpg'
  },
  {
    playbookId: '3',
    coverImage: sphereDominationCover,
    headshotImage: agent3,
    coverFileName: 'sphere-domination.jpg',
    headshotFileName: 'agent-3.jpg'
  },
  {
    playbookId: '4',
    coverImage: openHouseCover,
    headshotImage: agent4,
    coverFileName: 'open-house-mastery.jpg',
    headshotFileName: 'agent-4.jpg'
  },
  {
    playbookId: '5',
    coverImage: negotiationCover,
    headshotImage: agent5,
    coverFileName: 'negotiation-tactics.jpg',
    headshotFileName: 'agent-5.jpg'
  },
  {
    playbookId: '6',
    coverImage: socialMediaCover,
    headshotImage: agent6,
    coverFileName: 'social-media-secrets.jpg',
    headshotFileName: 'agent-6.jpg'
  },
  {
    playbookId: '7',
    coverImage: listingPresentationCover,
    headshotImage: agent7,
    coverFileName: 'listing-presentation.jpg',
    headshotFileName: 'agent-7.jpg'
  },
  {
    playbookId: '8',
    coverImage: expiredListingCover,
    headshotImage: agent8,
    coverFileName: 'expired-listing-conversion.jpg',
    headshotFileName: 'agent-8.jpg'
  },
  {
    playbookId: '9',
    coverImage: buyerAgentCover,
    headshotImage: agent9,
    coverFileName: 'buyer-agent-excellence.jpg',
    headshotFileName: 'agent-9.jpg'
  },
  {
    playbookId: '10',
    coverImage: teamBuildingCover,
    headshotImage: agent10,
    coverFileName: 'team-building-blueprint.jpg',
    headshotFileName: 'agent-10.jpg'
  }
];

async function fetchImageAsFile(imageUrl: string, fileName: string): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
}

export async function uploadPlaybookAssets(
  onProgress?: (current: number, total: number, message: string) => void
) {
  const results = [];
  const total = assetMappings.length;

  for (let i = 0; i < assetMappings.length; i++) {
    const asset = assetMappings[i];
    
    try {
      onProgress?.(i + 1, total, `Uploading assets for playbook ${asset.playbookId}...`);

      // Upload cover image
      const coverFile = await fetchImageAsFile(asset.coverImage, asset.coverFileName);
      const { data: coverData, error: coverError } = await supabase.storage
        .from('playbook-covers')
        .upload(asset.coverFileName, coverFile, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (coverError) throw new Error(`Cover upload failed: ${coverError.message}`);

      // Upload headshot image
      const headshotFile = await fetchImageAsFile(asset.headshotImage, asset.headshotFileName);
      const { data: headshotData, error: headshotError } = await supabase.storage
        .from('agent-headshots')
        .upload(asset.headshotFileName, headshotFile, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (headshotError) throw new Error(`Headshot upload failed: ${headshotError.message}`);

      // Get public URLs
      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from('playbook-covers')
        .getPublicUrl(asset.coverFileName);

      const { data: { publicUrl: headshotUrl } } = supabase.storage
        .from('agent-headshots')
        .getPublicUrl(asset.headshotFileName);

      // Update playbook record
      const { error: updateError } = await supabase
        .from('playbooks')
        .update({
          cover_url: coverUrl,
          agent_headshot_url: headshotUrl
        })
        .eq('id', asset.playbookId);

      if (updateError) throw new Error(`Database update failed: ${updateError.message}`);

      results.push({
        playbookId: asset.playbookId,
        success: true,
        coverUrl,
        headshotUrl
      });
    } catch (error) {
      console.error(`Error processing playbook ${asset.playbookId}:`, error);
      results.push({
        playbookId: asset.playbookId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  onProgress?.(total, total, 'Upload complete!');
  return results;
}
