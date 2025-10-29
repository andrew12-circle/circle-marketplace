import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function UploadPlaybookCovers() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImages = async () => {
    setUploading(true);
    
    try {
      const images = [
        { path: '/images/temp-youtube-100k.png', name: 'youtube-100k.png', title: 'YouTube to $100K+/Month' },
        { path: '/images/temp-circle-prospecting.png', name: 'circle-prospecting.png', title: 'The Circle Prospecting Blueprint' },
        { path: '/images/temp-luxury-50m.png', name: 'luxury-50m.png', title: 'The $50M Luxury Listing Playbook' },
        { path: '/images/temp-first-time-buyer.png', name: 'first-time-buyer.png', title: 'First-Time Buyer Machine' },
        { path: '/images/temp-denver-1.png', name: 'expired-listing.png', title: 'The Expired Listing System' },
        { path: '/images/temp-denver-2.png', name: 'investor-deal-flow.png', title: 'Investor Deal Flow Factory' },
        { path: '/images/temp-seattle.png', name: 'referral-only.png', title: 'The Referral-Only Agent' },
        { path: '/images/temp-phoenix.png', name: 'new-construction.png', title: 'New Construction Specialist' },
      ];

      const results = [];

      for (const image of images) {
        try {
          // Fetch the image from public folder
          const response = await fetch(image.path);
          const blob = await response.blob();

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('playbook_covers')
            .upload(image.name, blob, {
              contentType: 'image/png',
              upsert: true
            });

          if (error) throw error;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('playbook_covers')
            .getPublicUrl(image.name);

          results.push({ title: image.title, url: publicUrl });
          console.log(`Uploaded ${image.title}:`, publicUrl);

          // Update the database
          const { error: updateError } = await supabase
            .from('playbooks')
            .update({ cover_url: publicUrl })
            .eq('title', image.title);

          if (updateError) {
            console.error(`Error updating ${image.title}:`, updateError);
          }
        } catch (err) {
          console.error(`Error processing ${image.title}:`, err);
        }
      }

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${results.length} images`,
      });

      console.log('All uploads complete:', results);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Upload Playbook Covers</h1>
        <p className="text-muted-foreground">
          Click the button below to upload playbook cover images to Supabase Storage
        </p>
        <Button onClick={uploadImages} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Images'}
        </Button>
      </div>
    </div>
  );
}
