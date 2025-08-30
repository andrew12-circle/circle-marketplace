import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRESPADisclaimers } from "@/hooks/useRESPADisclaimers";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Shield, AlertTriangle } from "lucide-react";

interface ServiceDisclaimerSectionProps {
  serviceId: string;
  serviceName: string;
}

interface DisclaimerPreview {
  id: string;
  title: string;
  content: string;
  button_text?: string;
  button_url?: string;
}

export const ServiceDisclaimerSection = ({ serviceId, serviceName }: ServiceDisclaimerSectionProps) => {
  const [currentDisclaimerId, setCurrentDisclaimerId] = useState<string | null>(null);
  const [previewDisclaimer, setPreviewDisclaimer] = useState<DisclaimerPreview | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { disclaimers, loading } = useRESPADisclaimers();
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentDisclaimer();
  }, [serviceId]);

  const fetchCurrentDisclaimer = async () => {
    try {
    const { data, error } = await supabase
      .from('services')
      .select('disclaimer_id')
      .eq('id' as any, serviceId as any)
      .single();

    if (error) throw error;
    setCurrentDisclaimerId((data as any)?.disclaimer_id || null);
    } catch (error) {
      console.error('Error fetching current disclaimer:', error);
    }
  };

  const updateServiceDisclaimer = async (disclaimerId: string | null) => {
    setIsUpdating(true);
    try {
    const { error } = await (supabase
      .from('services')
      .update as any)({ disclaimer_id: disclaimerId })
      .eq('id' as any, serviceId);

      if (error) throw error;

      setCurrentDisclaimerId(disclaimerId);
      toast({
        title: "Success",
        description: disclaimerId 
          ? "Disclaimer assigned successfully" 
          : "Disclaimer removed successfully"
      });
    } catch (error) {
      console.error('Error updating service disclaimer:', error);
      toast({
        title: "Error",
        description: "Failed to update disclaimer assignment",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const previewServiceDisclaimer = async (disclaimerId: string) => {
    try {
      const { data, error } = await (supabase
        .from('respa_disclaimers')
        .select as any)('*')
        .eq('id' as any, disclaimerId as any)
        .single();

      if (error) throw error;

      const disclaimerData = data as any;
      setPreviewDisclaimer({
        id: disclaimerData.id,
        title: disclaimerData.title,
        content: disclaimerData.content,
        button_text: disclaimerData.button_text,
        button_url: disclaimerData.button_url
      });
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error fetching disclaimer for preview:', error);
      toast({
        title: "Error",
        description: "Failed to load disclaimer preview",
        variant: "destructive"
      });
    }
  };

  const currentDisclaimer = disclaimers.find(d => d.id === currentDisclaimerId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Service Disclaimer Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{serviceName}</h4>
              <p className="text-sm text-muted-foreground">
                Assign RESPA disclaimers to this service
              </p>
            </div>
            {currentDisclaimer && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Disclaimer Active
              </Badge>
            )}
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Disclaimer</label>
              <div className="flex gap-2">
                <Select
                  value={currentDisclaimerId || "none"}
                  onValueChange={(value) => {
                    const newValue = value === "none" ? null : value;
                    updateServiceDisclaimer(newValue);
                  }}
                  disabled={isUpdating || loading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a disclaimer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Disclaimer</SelectItem>
                    {disclaimers.map((disclaimer) => (
                      <SelectItem key={disclaimer.id} value={disclaimer.id}>
                        {disclaimer.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {currentDisclaimerId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewServiceDisclaimer(currentDisclaimerId)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {currentDisclaimer && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      {currentDisclaimer.title}
                    </h4>
                    <p className="text-sm text-blue-700">
                      This disclaimer will be shown to customers when they interact with this service.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!currentDisclaimer && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">No Disclaimer Assigned</h4>
                    <p className="text-sm text-amber-700">
                      Consider assigning a RESPA disclaimer to ensure compliance when this service is offered.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Disclaimer Preview</DialogTitle>
          </DialogHeader>
          {previewDisclaimer && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{previewDisclaimer.title}</h3>
                <div 
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: previewDisclaimer.content }}
                />
              </div>
              {previewDisclaimer.button_text && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (previewDisclaimer.button_url) {
                        window.open(previewDisclaimer.button_url, '_blank');
                      }
                    }}
                  >
                    {previewDisclaimer.button_text}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};