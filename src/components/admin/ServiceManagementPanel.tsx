// Fixed version with proper JSX structure
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { Edit, Search, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/utils/dateFormatting";

interface Service {
  id: string;
  title: string;
  description: string;
  retail_price?: string;
  pro_price?: string;
  price_duration?: string;
  duration?: string;
  estimated_roi?: number;
  sort_order?: number;
  is_verified?: boolean;
  is_featured: boolean;
  is_top_pick: boolean;
  requires_quote: boolean;
  copay_allowed?: boolean;
  direct_purchase_enabled?: boolean;
  respa_split_limit?: number;
  max_split_percentage_non_ssp?: number;
  tags?: string[];
  category: string;
  vendor?: any;
}

interface ServiceManagementPanelProps {
  services: Service[];
  setServices: (services: Service[]) => void;
}

export const ServiceManagementPanel: React.FC<ServiceManagementPanelProps> = ({
  services,
  setServices
}) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState<Service>({} as Service);
  const [isDetailsDirty, setIsDetailsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const { toast } = useToast();

  // Track changes to editForm
  useEffect(() => {
    if (selectedService && isEditingDetails) {
      setIsDetailsDirty(
        JSON.stringify(editForm) !== JSON.stringify(selectedService)
      );
    }
  }, [editForm, selectedService, isEditingDetails]);

  const handleServiceUpdate = async () => {
    if (!selectedService) return;
    
    try {
      const { error } = await supabase
        .from('services')
        .update(editForm)
        .eq('id', selectedService.id);

      if (error) throw error;

      // Update local state
      setServices(services.map(s => s.id === selectedService.id ? { ...s, ...editForm } : s));
      setSelectedService({ ...selectedService, ...editForm });
      setIsEditingDetails(false);
      setIsDetailsDirty(false);

      toast({
        title: "Service updated",
        description: "Service details have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (!selectedService) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Service Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Select a service from the list to edit its details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editing: {selectedService.title}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">ID: {selectedService.id}</Badge>
            <Badge variant="secondary">{selectedService.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Service Details</TabsTrigger>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="funnel">Service Funnel (Live)</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Edits here update the live funnel page after saving.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {isEditingDetails ? (
                <div className="space-y-4">
                  {isDetailsDirty && (
                    <Badge variant="outline" className="text-xs">Unsaved changes</Badge>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Edit Form */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Service Title</label>
                        <Input
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={4}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Duration</label>
                          <Input
                            value={editForm.duration || ''}
                            onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                            placeholder="e.g., 30 days"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">ROI (%)</label>
                          <div className="relative">
                            {!editForm.is_verified ? (
                              <Input
                                value="TBD"
                                disabled
                                className="pr-8 text-muted-foreground"
                              />
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                max="10000"
                                step="0.1"
                                value={editForm.estimated_roi || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? null : Number(e.target.value);
                                  setEditForm({ ...editForm, estimated_roi: value });
                                }}
                                placeholder="Enter ROI percentage (e.g., 1200 for 1200%)"
                                className="pr-8"
                              />
                            )}
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {!editForm.is_verified ? 'ROI will show TBD until service is verified' : 'Enter the ROI as a percentage. Values can go beyond 1000% (e.g., 1200 for 1200%)'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Sort Order</label>
                          <Input
                            type="number"
                            value={editForm.sort_order || ''}
                            onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">List Price</label>
                          <Input
                            value={editForm.retail_price ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, retail_price: e.target.value })}
                            placeholder="$1,497.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pro Price</label>
                          <Input
                            value={editForm.pro_price ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, pro_price: e.target.value })}
                            placeholder="$1,347.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Price Duration</label>
                          <Input
                            value={editForm.price_duration ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, price_duration: e.target.value })}
                            placeholder="mo"
                          />
                        </div>
                      </div>

                      {/* Switches */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editForm.is_verified || false}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, is_verified: checked })}
                          />
                          <label className="text-sm font-medium">Verified</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editForm.is_featured || false}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, is_featured: checked })}
                          />
                          <label className="text-sm font-medium">Featured</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editForm.is_top_pick || false}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, is_top_pick: checked })}
                          />
                          <label className="text-sm font-medium">Top Pick</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editForm.requires_quote || false}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, requires_quote: checked })}
                          />
                          <label className="text-sm font-medium">Requires Quote</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editForm.copay_allowed || false}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, copay_allowed: checked })}
                          />
                          <label className="text-sm font-medium">Co-Pay Allowed</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editForm.direct_purchase_enabled || false}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, direct_purchase_enabled: checked })}
                          />
                          <div className="flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3 text-green-600" />
                            <label className="text-sm font-medium">Direct Purchase</label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Live Preview */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Live Preview</label>
                        <div className="border rounded-lg p-4 bg-muted/20">
                          <ServiceCard
                            service={{
                              ...selectedService,
                              ...editForm,
                              vendor: selectedService.vendor
                            }}
                            variant="compact"
                            isSaved={false}
                            onSave={() => {}}
                            onViewDetails={() => {}}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          This is how your service will appear to customers in the marketplace.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleServiceUpdate} disabled={!isDetailsDirty}>
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { 
                        if (selectedService) {
                          setEditForm(selectedService); 
                          setIsEditingDetails(false);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Service Details</h3>
                    <Button onClick={() => {
                      setEditForm(selectedService);
                      setIsEditingDetails(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Basic Information</h4>
                      <p className="text-sm text-muted-foreground">Title: {selectedService.title}</p>
                      <p className="text-sm text-muted-foreground">Category: {selectedService.category}</p>
                      <p className="text-sm text-muted-foreground">Duration: {selectedService.duration || 'Not set'}</p>
                      <p className="text-sm text-muted-foreground">ROI: {selectedService.estimated_roi || 0}%</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Status</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedService.is_featured && <Badge>Featured</Badge>}
                        {selectedService.is_top_pick && <Badge variant="secondary">Top Pick</Badge>}
                        {selectedService.requires_quote && <Badge variant="outline">Requires Quote</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="funnel" className="space-y-4">
              <div className="text-center py-8 border rounded-lg">
                <p className="text-muted-foreground">Funnel editor will be available here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};