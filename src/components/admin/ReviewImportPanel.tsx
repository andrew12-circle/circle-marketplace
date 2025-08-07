import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, Plus, Star, Globe, Building2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewImportForm {
  service_id: string;
  rating: number;
  review_text: string;
  review_source: 'vendor_provided' | 'google_external' | 'admin_assigned';
  verified: boolean;
  source_url?: string;
  admin_notes?: string;
  reviewer_name?: string;
}

export const ReviewImportPanel = () => {
  const [services, setServices] = useState<Array<{ id: string; title: string }>>([]);
  const [form, setForm] = useState<ReviewImportForm>({
    service_id: '',
    rating: 5,
    review_text: '',
    review_source: 'vendor_provided',
    verified: false,
    source_url: '',
    admin_notes: '',
    reviewer_name: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const { toast } = useToast();

  // Load services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title')
        .order('title');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const submitSingleReview = async () => {
    if (!form.service_id || !form.review_text || form.rating === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_reviews')
        .insert({
          service_id: form.service_id,
          rating: form.rating,
          review: form.review_text,
          review_source: form.review_source,
          verified: form.verified,
          source_url: form.source_url || null,
          admin_notes: form.admin_notes || null,
          user_id: '00000000-0000-0000-0000-000000000000' // Placeholder for non-user reviews
        });

      if (error) throw error;

      toast({
        title: "Review Imported",
        description: "Review has been successfully imported",
      });

      // Reset form
      setForm({
        service_id: '',
        rating: 5,
        review_text: '',
        review_source: 'vendor_provided',
        verified: false,
        source_url: '',
        admin_notes: '',
        reviewer_name: ''
      });
    } catch (error) {
      console.error('Error importing review:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const processBulkImport = async () => {
    if (!bulkImportText.trim()) {
      toast({
        title: "No Data",
        description: "Please paste CSV data to import",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const lines = bulkImportText.trim().split('\n');
      const reviews = [];

      for (let i = 1; i < lines.length; i++) { // Skip header row
        const [service_title, rating, review_text, source, source_url] = lines[i].split(',');
        
        // Find service by title
        const service = services.find(s => s.title.toLowerCase().includes(service_title.toLowerCase()));
        if (!service) continue;

        reviews.push({
          service_id: service.id,
          rating: parseInt(rating) || 5,
          review: review_text?.replace(/"/g, '') || '',
          review_source: source as 'vendor_provided' | 'google_external' | 'admin_assigned' || 'vendor_provided',
          verified: false,
          source_url: source_url || null,
          user_id: '00000000-0000-0000-0000-000000000000'
        });
      }

      if (reviews.length === 0) {
        toast({
          title: "No Valid Reviews",
          description: "No valid reviews found in the CSV data",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('service_reviews')
        .insert(reviews);

      if (error) throw error;

      toast({
        title: "Bulk Import Complete",
        description: `Successfully imported ${reviews.length} reviews`,
      });

      setBulkImportText('');
    } catch (error) {
      console.error('Error in bulk import:', error);
      toast({
        title: "Bulk Import Failed",
        description: "Failed to import reviews. Please check your data format.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'vendor_provided': return <Building2 className="w-4 h-4" />;
      case 'google_external': return <Globe className="w-4 h-4" />;
      case 'admin_assigned': return <Shield className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'vendor_provided': return 'secondary';
      case 'google_external': return 'outline';
      case 'admin_assigned': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Single Review Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Import Single Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service">Service *</Label>
              <Select value={form.service_id} onValueChange={(value) => setForm({...form, service_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rating">Rating *</Label>
              <Select value={form.rating.toString()} onValueChange={(value) => setForm({...form, rating: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} Star{rating !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source">Review Source *</Label>
              <Select value={form.review_source} onValueChange={(value: any) => setForm({...form, review_source: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor_provided">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Vendor Provided
                    </div>
                  </SelectItem>
                  <SelectItem value="google_external">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Google/External
                    </div>
                  </SelectItem>
                  <SelectItem value="admin_assigned">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin Assigned
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reviewer">Reviewer Name</Label>
              <Input
                value={form.reviewer_name}
                onChange={(e) => setForm({...form, reviewer_name: e.target.value})}
                placeholder="Enter reviewer name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="review">Review Text *</Label>
            <Textarea
              value={form.review_text}
              onChange={(e) => setForm({...form, review_text: e.target.value})}
              placeholder="Enter the review text..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source_url">Source URL</Label>
              <Input
                value={form.source_url}
                onChange={(e) => setForm({...form, source_url: e.target.value})}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={form.verified}
                onCheckedChange={(checked) => setForm({...form, verified: checked})}
              />
              <Label>Mark as Verified</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="admin_notes">Admin Notes</Label>
            <Textarea
              value={form.admin_notes}
              onChange={(e) => setForm({...form, admin_notes: e.target.value})}
              placeholder="Internal notes for this review..."
              rows={2}
            />
          </div>

          <Button onClick={submitSingleReview} disabled={submitting} className="w-full">
            {submitting ? "Importing..." : "Import Review"}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Import Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Expected CSV format:</p>
            <code className="bg-muted p-2 rounded text-xs block mt-2">
              Service Title,Rating,Review Text,Source,Source URL<br/>
              "Social Media Marketing",5,"Great service!","vendor_provided","https://example.com"
            </code>
          </div>

          <Textarea
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
            placeholder="Paste CSV data here..."
            rows={8}
          />

          <Button onClick={processBulkImport} disabled={submitting} className="w-full">
            {submitting ? "Processing..." : "Process Bulk Import"}
          </Button>
        </CardContent>
      </Card>

      {/* Review Source Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Review Source Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Building2 className="w-3 h-3 mr-1" />
                Vendor Provided
              </Badge>
              <span className="text-sm text-muted-foreground">Reviews provided by the service vendor</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Globe className="w-3 h-3 mr-1" />
                Google/External
              </Badge>
              <span className="text-sm text-muted-foreground">Reviews from Google Business or other platforms</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                <Shield className="w-3 h-3 mr-1" />
                Admin Assigned
              </Badge>
              <span className="text-sm text-muted-foreground">Reviews manually added by administrators</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};