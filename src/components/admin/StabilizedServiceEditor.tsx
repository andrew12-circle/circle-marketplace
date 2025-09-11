import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queueServicePatch, isServiceSaving, cancelPendingSave } from "@/lib/adminServiceEditor";
import { useCanQuery } from "@/lib/dataLayer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Save, AlertCircle, Undo, DollarSign, Percent } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  is_active: boolean;
  is_featured: boolean;
  retail_price?: number;
  pro_price?: number;
  copay_allowed?: boolean;
  respa_split_limit?: number;
}

interface ServiceEditorProps {
  serviceId: string;
}

export const StabilizedServiceEditor = ({ serviceId }: ServiceEditorProps) => {
  const [localData, setLocalData] = useState<Partial<Service>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const originalDataRef = useRef<Service | null>(null);
  const { toast } = useToast();
  const canQuery = useCanQuery();
  
  // Fetch service data with proper enablement
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();
      
      if (error) throw error;
      return data as Service;
    },
    enabled: canQuery && !!serviceId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize local data when service loads
  useEffect(() => {
    if (service && !originalDataRef.current) {
      originalDataRef.current = service;
      setLocalData(service);
      setHasChanges(false);
    }
  }, [service]);

  // Listen for save events from the debounced system
  useEffect(() => {
    const handleSaveSuccess = (event: CustomEvent) => {
      if (event.detail.id === serviceId) {
        setSaveStatus('saved');
        setHasChanges(false);
        setTimeout(() => setSaveStatus(null), 3000);
      }
    };

    const handleSaveError = (event: CustomEvent) => {
      if (event.detail.id === serviceId) {
        setSaveStatus('error');
        toast({
          title: "Save Failed",
          description: event.detail.error || "An error occurred while saving",
          variant: "destructive",
        });
        setTimeout(() => setSaveStatus(null), 5000);
      }
    };

    window.addEventListener('service-saved', handleSaveSuccess as EventListener);
    window.addEventListener('service-save-error', handleSaveError as EventListener);

    return () => {
      window.removeEventListener('service-saved', handleSaveSuccess as EventListener);
      window.removeEventListener('service-save-error', handleSaveError as EventListener);
    };
  }, [serviceId, toast]);

  const handleFieldChange = (field: keyof Service, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    setHasChanges(true);
    setSaveStatus('saving');
    
    // Queue the change with optimistic UI update
    queueServicePatch(serviceId, { [field]: value });
  };

  const handleRevert = () => {
    if (originalDataRef.current) {
      setLocalData(originalDataRef.current);
      setHasChanges(false);
      setSaveStatus(null);
      cancelPendingSave(serviceId);
    }
  };

  if (!canQuery) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">
            Waiting for authentication...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">
            Loading service data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-destructive">
            Error loading service: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSaving = isServiceSaving(serviceId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Edit Service</CardTitle>
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Check className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
            {saveStatus === 'saving' && (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Save className="w-3 h-3 mr-1 animate-pulse" />
                Saving...
              </Badge>
            )}
            {saveStatus === 'error' && (
              <Badge variant="outline" className="text-red-600 border-red-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            )}
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevert}
                disabled={isSaving}
              >
                <Undo className="w-4 h-4 mr-2" />
                Revert
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={localData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              disabled={isSaving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={localData.category || ''}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={localData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            disabled={isSaving}
            rows={3}
          />
        </div>

        {/* Pricing & Copay Configuration */}
        <Card className="bg-muted/10 border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing & Copay Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retail_price">Retail Price ($)</Label>
                <Input
                  id="retail_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={localData.retail_price || ''}
                  onChange={(e) => handleFieldChange('retail_price', parseFloat(e.target.value) || 0)}
                  disabled={isSaving}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pro_price">Circle Pro Price ($)</Label>
                <Input
                  id="pro_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={localData.pro_price || ''}
                  onChange={(e) => handleFieldChange('pro_price', parseFloat(e.target.value) || 0)}
                  disabled={isSaving}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="copay_allowed"
                  checked={localData.copay_allowed || false}
                  onChange={(e) => handleFieldChange('copay_allowed', e.target.checked)}
                  disabled={isSaving}
                  className="w-4 h-4"
                />
                <Label htmlFor="copay_allowed">Allow Copay</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="respa_split_limit" className="flex items-center gap-1">
                  RESPA Split Limit
                  <Percent className="w-3 h-3" />
                </Label>
                <Input
                  id="respa_split_limit"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={localData.respa_split_limit || ''}
                  onChange={(e) => handleFieldChange('respa_split_limit', parseFloat(e.target.value) || 0)}
                  disabled={isSaving}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Copay Preview */}
            {localData.copay_allowed && (localData.retail_price || localData.pro_price) && localData.respa_split_limit && (
              <div className="p-3 bg-muted/20 rounded border">
                <Label className="text-sm font-medium text-muted-foreground">Copay Preview</Label>
                <div className="text-sm mt-1">
                  {(() => {
                    const basePrice = localData.pro_price || localData.retail_price || 0;
                    const copayPrice = basePrice * (localData.respa_split_limit / 100);
                    const savings = basePrice - copayPrice;
                    return (
                      <div className="space-y-1">
                        <div>Base Price: ${basePrice.toFixed(2)}</div>
                        <div>Copay Price: ${copayPrice.toFixed(2)}</div>
                        <div className="text-green-600 font-medium">Agent Savings: ${savings.toFixed(2)} ({(100 - localData.respa_split_limit).toFixed(1)}% off)</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={localData.is_active || false}
              onChange={(e) => handleFieldChange('is_active', e.target.checked)}
              disabled={isSaving}
              className="w-4 h-4"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_featured"
              checked={localData.is_featured || false}
              onChange={(e) => handleFieldChange('is_featured', e.target.checked)}
              disabled={isSaving}
              className="w-4 h-4"
            />
            <Label htmlFor="is_featured">Featured</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};