import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LenderRequestFormProps {
  onRequestCreated?: (requestId: string) => void;
}

export function LenderRequestForm({ onRequestCreated }: LenderRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agentId: "",
    skuId: "",
    requestedVendorShare: "",
    location: "",
    buyers12mo: "",
    totalUnits: "",
    goals: ""
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock agent location (Franklin, TN coordinates)
      const franklinTN = {
        type: "Point",
        coordinates: [-86.8689, 35.9251] // [longitude, latitude]
      };

      // Create request
      const { data: request, error: requestError } = await supabase
        .from('lender_request')
        .insert({
          agent_id: formData.agentId,
          sku_id: formData.skuId,
          requested_vendor_share: parseFloat(formData.requestedVendorShare),
          agent_latlon: franklinTN,
          status: 'draft'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create snapshot
      const agentStats = {
        buyers_12mo: parseInt(formData.buyers12mo),
        total_units: parseInt(formData.totalUnits)
      };

      const goals = {
        description: formData.goals
      };

      const { error: snapshotError } = await supabase
        .from('lender_request_snapshot')
        .insert({
          request_id: request.id,
          agent_stats_json: agentStats,
          goals_json: goals,
          geo_json: { location: formData.location }
        });

      if (snapshotError) throw snapshotError;

      // Update status to searching
      const { error: updateError } = await supabase
        .from('lender_request')
        .update({ status: 'searching' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Trigger match engine
      const { error: matchError } = await supabase.functions.invoke('lender-match-engine', {
        body: { request_id: request.id }
      });

      if (matchError) {
        console.warn('Match engine invocation failed:', matchError);
        // Don't fail the request creation if match engine fails
      }

      toast({
        title: "Request Created",
        description: "Your lender request has been submitted and is being processed."
      });

      onRequestCreated?.(request.id);

      // Reset form
      setFormData({
        agentId: "",
        skuId: "",
        requestedVendorShare: "",
        location: "",
        buyers12mo: "",
        totalUnits: "",
        goals: ""
      });

    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Lender Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agentId">Agent ID</Label>
              <Input
                id="agentId"
                value={formData.agentId}
                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="skuId">SKU ID</Label>
              <Input
                id="skuId"
                value={formData.skuId}
                onChange={(e) => setFormData({ ...formData, skuId: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requestedVendorShare">Requested Vendor Share (%)</Label>
              <Input
                id="requestedVendorShare"
                type="number"
                min="0"
                max="100"
                value={formData.requestedVendorShare}
                onChange={(e) => setFormData({ ...formData, requestedVendorShare: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Franklin, TN"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyers12mo">Buyers (Last 12 Months)</Label>
              <Input
                id="buyers12mo"
                type="number"
                min="0"
                value={formData.buyers12mo}
                onChange={(e) => setFormData({ ...formData, buyers12mo: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="totalUnits">Total Units</Label>
              <Input
                id="totalUnits"
                type="number"
                min="0"
                value={formData.totalUnits}
                onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="goals">Goals & Notes</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              placeholder="Describe your goals and any additional requirements..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Request..." : "Create Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}