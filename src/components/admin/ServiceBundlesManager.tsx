import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Package, ToggleLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getFeatureFlags, setFeatureFlags } from "@/utils/featureSafety";

type ServiceBundle = {
  id: string;
  bundle_name: string;
  bundle_type: string;
  description: string;
  service_ids: string[];
  total_price: number;
  estimated_roi_percentage: number;
  implementation_timeline_weeks: number;
  is_active: boolean;
  target_challenges: string[];
};

type ServiceItem = {
  id: string;
  title: string;
  retail_price: string;
};

export const ServiceBundlesManager = () => {
  const [bundlesEnabled, setBundlesEnabled] = useState(false);
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBundle, setNewBundle] = useState({
    bundle_name: "",
    bundle_type: "productivity",
    description: "",
    service_ids: [] as string[],
    estimated_roi_percentage: 25,
    implementation_timeline_weeks: 4,
    target_challenges: [] as string[],
  });
  const [newChallenge, setNewChallenge] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const flags = getFeatureFlags();
    setBundlesEnabled(flags.serviceBundles || false);
    loadBundles();
    loadServices();
  }, []);

  const loadBundles = async () => {
    try {
      const response = await supabase
        .from("ai_service_bundles")
        .select("*")
        .order("created_at", { ascending: false });

      if (response.error) throw response.error;
      setBundles(response.data || []);
    } catch (error) {
      console.error("Error loading bundles:", error);
      toast({
        title: "Error",
        description: "Failed to load service bundles",
        variant: "destructive",
      });
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services'); // We'll use direct API instead
      if (!response.ok) {
        // Fallback to simple mock data for now
        setServices([
          { id: '1', title: 'CRM System', retail_price: '299' },
          { id: '2', title: 'Lead Generation Tool', retail_price: '199' },
          { id: '3', title: 'Social Media Management', retail_price: '149' }
        ]);
        return;
      }
      const data = await response.json();
      setServices(data || []);
    } catch (error) {
      console.error("Error loading services:", error);
      // Use mock data as fallback
      setServices([
        { id: '1', title: 'CRM System', retail_price: '299' },
        { id: '2', title: 'Lead Generation Tool', retail_price: '199' },
        { id: '3', title: 'Social Media Management', retail_price: '149' }
      ]);
    }
  };

  const toggleBundlesFeature = (enabled: boolean) => {
    setBundlesEnabled(enabled);
    setFeatureFlags({ serviceBundles: enabled });
    
    toast({
      title: enabled ? "Service Bundles Enabled" : "Service Bundles Disabled",
      description: enabled 
        ? "Service bundles will now appear in the marketplace" 
        : "Service bundles are hidden from users",
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setNewBundle(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  const addChallenge = () => {
    if (newChallenge.trim()) {
      setNewBundle(prev => ({
        ...prev,
        target_challenges: [...prev.target_challenges, newChallenge.trim()]
      }));
      setNewChallenge("");
    }
  };

  const removeChallenge = (index: number) => {
    setNewBundle(prev => ({
      ...prev,
      target_challenges: prev.target_challenges.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalPrice = () => {
    return newBundle.service_ids.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (parseFloat(service?.retail_price || "0") || 0);
    }, 0);
  };

  const createBundle = async () => {
    if (!newBundle.bundle_name || newBundle.service_ids.length === 0) {
      toast({
        title: "Validation Error",
        description: "Bundle name and at least one service are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("ai_service_bundles")
        .insert({
          bundle_name: newBundle.bundle_name,
          bundle_type: newBundle.bundle_type,
          description: newBundle.description,
          service_ids: newBundle.service_ids,
          total_price: calculateTotalPrice(),
          estimated_roi_percentage: newBundle.estimated_roi_percentage,
          implementation_timeline_weeks: newBundle.implementation_timeline_weeks,
          target_challenges: newBundle.target_challenges,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service bundle created successfully",
      });

      setIsCreating(false);
      setNewBundle({
        bundle_name: "",
        bundle_type: "productivity",
        description: "",
        service_ids: [],
        estimated_roi_percentage: 25,
        implementation_timeline_weeks: 4,
        target_challenges: [],
      });
      loadBundles();
    } catch (error) {
      console.error("Error creating bundle:", error);
      toast({
        title: "Error",
        description: "Failed to create service bundle",
        variant: "destructive",
      });
    }
  };

  const toggleBundleActive = async (bundleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_service_bundles")
        .update({ is_active: !isActive })
        .eq("id", bundleId);

      if (error) throw error;
      
      loadBundles();
      toast({
        title: "Success",
        description: `Bundle ${!isActive ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      console.error("Error updating bundle:", error);
      toast({
        title: "Error",
        description: "Failed to update bundle",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Switch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" />
            Service Bundles Master Control
          </CardTitle>
          <CardDescription>
            Enable or disable the service bundles feature across the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="bundles-enabled"
              checked={bundlesEnabled}
              onCheckedChange={toggleBundlesFeature}
            />
            <Label htmlFor="bundles-enabled">
              {bundlesEnabled ? "Service Bundles Enabled" : "Service Bundles Disabled"}
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {bundlesEnabled 
              ? "Users can see and purchase service bundles in the marketplace"
              : "Service bundles are hidden from all users"}
          </p>
        </CardContent>
      </Card>

      {/* Bundle Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Service Bundles
            </span>
            <Button onClick={() => setIsCreating(true)} disabled={!bundlesEnabled}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </CardTitle>
          <CardDescription>
            Create and manage curated service bundles for the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!bundlesEnabled && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enable service bundles to manage them</p>
            </div>
          )}

          {bundlesEnabled && (
            <div className="space-y-4">
              {/* Create Bundle Form */}
              {isCreating && (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Create New Bundle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bundle_name">Bundle Name</Label>
                        <Input
                          id="bundle_name"
                          value={newBundle.bundle_name}
                          onChange={(e) => setNewBundle(prev => ({ ...prev, bundle_name: e.target.value }))}
                          placeholder="e.g., New Agent Starter Pack"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bundle_type">Bundle Type</Label>
                        <select
                          id="bundle_type"
                          value={newBundle.bundle_type}
                          onChange={(e) => setNewBundle(prev => ({ ...prev, bundle_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-input rounded-md"
                        >
                          <option value="productivity">Productivity</option>
                          <option value="marketing">Marketing</option>
                          <option value="lead_generation">Lead Generation</option>
                          <option value="client_management">Client Management</option>
                          <option value="listing_tools">Listing Tools</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newBundle.description}
                        onChange={(e) => setNewBundle(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this bundle includes and its benefits"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="roi">Estimated ROI %</Label>
                        <Input
                          id="roi"
                          type="number"
                          value={newBundle.estimated_roi_percentage}
                          onChange={(e) => setNewBundle(prev => ({ ...prev, estimated_roi_percentage: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeline">Implementation (Weeks)</Label>
                        <Input
                          id="timeline"
                          type="number"
                          value={newBundle.implementation_timeline_weeks}
                          onChange={(e) => setNewBundle(prev => ({ ...prev, implementation_timeline_weeks: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Target Challenges</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newChallenge}
                          onChange={(e) => setNewChallenge(e.target.value)}
                          placeholder="e.g., Low lead generation"
                          onKeyPress={(e) => e.key === 'Enter' && addChallenge()}
                        />
                        <Button type="button" onClick={addChallenge}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {newBundle.target_challenges.map((challenge, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {challenge}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeChallenge(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Select Services</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                        {services.map((service) => (
                          <div key={service.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={service.id}
                              checked={newBundle.service_ids.includes(service.id)}
                              onChange={() => handleServiceToggle(service.id)}
                            />
                            <Label htmlFor={service.id} className="flex-1">
                              {service.title} - ${service.retail_price}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Total Price: ${calculateTotalPrice()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={createBundle}>Create Bundle</Button>
                      <Button variant="outline" onClick={() => setIsCreating(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing Bundles */}
              <div className="space-y-4">
                {bundles.map((bundle) => (
                  <Card key={bundle.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {bundle.bundle_name}
                            <Badge variant={bundle.is_active ? "default" : "secondary"}>
                              {bundle.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{bundle.description}</CardDescription>
                        </div>
                        <Switch
                          checked={bundle.is_active}
                          onCheckedChange={() => toggleBundleActive(bundle.id, bundle.is_active)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label>Type</Label>
                          <p className="capitalize">{bundle.bundle_type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <Label>Services</Label>
                          <p>{bundle.service_ids.length} services</p>
                        </div>
                        <div>
                          <Label>Total Price</Label>
                          <p>${bundle.total_price}</p>
                        </div>
                        <div>
                          <Label>Est. ROI</Label>
                          <p>{bundle.estimated_roi_percentage}%</p>
                        </div>
                      </div>
                      {bundle.target_challenges.length > 0 && (
                        <div className="mt-4">
                          <Label>Target Challenges</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {bundle.target_challenges.map((challenge, index) => (
                              <Badge key={index} variant="outline">
                                {challenge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {bundles.length === 0 && !isCreating && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No service bundles created yet</p>
                    <Button className="mt-4" onClick={() => setIsCreating(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Bundle
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
