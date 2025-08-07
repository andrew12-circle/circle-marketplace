import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Eye, Save, X } from "lucide-react";
import { useRESPADisclaimers } from "@/hooks/useRESPADisclaimers";

interface Service {
  id: string;
  title: string;
  description: string;
  disclaimer_id?: string;
  copay_allowed: boolean;
  respa_split_limit?: number;
  vendor: {
    name: string;
  } | null;
}

interface DisclaimerPreview {
  id: string;
  title: string;
  content: string;
  button_text: string;
  button_url?: string;
}

export const ServiceDisclaimerManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewDisclaimer, setPreviewDisclaimer] = useState<DisclaimerPreview | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const { disclaimers, refetch } = useRESPADisclaimers();
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    refetch(false); // Fetch all disclaimers including inactive ones
  }, []);

  useEffect(() => {
    const filtered = services.filter(service =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [services, searchTerm]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          disclaimer_id,
          copay_allowed,
          respa_split_limit,
          vendor:vendor_id (
            name
          )
        `)
        .order('title');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateServiceDisclaimer = async (serviceId: string, disclaimerId: string | null) => {
    try {
      setUpdating(serviceId);
      const { error } = await supabase
        .from('services')
        .update({ disclaimer_id: disclaimerId })
        .eq('id', serviceId);

      if (error) throw error;

      // Update local state
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, disclaimer_id: disclaimerId || undefined }
            : service
        )
      );

      toast({
        title: "Success",
        description: "Service disclaimer updated successfully",
      });
    } catch (error) {
      console.error('Error updating service disclaimer:', error);
      toast({
        title: "Error",
        description: "Failed to update service disclaimer",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const previewServiceDisclaimer = async (disclaimerId: string, serviceId: string) => {
    try {
      const disclaimer = disclaimers.find(d => d.id === disclaimerId);
      if (disclaimer) {
        setPreviewDisclaimer(disclaimer);
        setSelectedServiceId(serviceId);
      }
    } catch (error) {
      console.error('Error previewing disclaimer:', error);
    }
  };

  const bulkAssignDisclaimer = async (disclaimerId: string | null, criteria: 'copay' | 'all') => {
    try {
      setLoading(true);
      
      let servicesToUpdate = services;
      if (criteria === 'copay') {
        servicesToUpdate = services.filter(s => s.copay_allowed);
      }

      // Update services one by one instead of bulk upsert
      for (const service of servicesToUpdate) {
        await supabase
          .from('services')
          .update({ disclaimer_id: disclaimerId })
          .eq('id', service.id);
      }

      await fetchServices(); // Refresh data

      toast({
        title: "Success",
        description: `Bulk updated ${servicesToUpdate.length} services`,
      });
    } catch (error) {
      console.error('Error bulk updating disclaimers:', error);
      toast({
        title: "Error",
        description: "Failed to bulk update disclaimers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisclaimerBadge = (disclaimerId?: string) => {
    if (!disclaimerId) {
      return <Badge variant="outline">No Disclaimer</Badge>;
    }
    
    const disclaimer = disclaimers.find(d => d.id === disclaimerId);
    if (!disclaimer) {
      return <Badge variant="destructive">Invalid Disclaimer</Badge>;
    }
    
    return (
      <Badge 
        variant={disclaimer.is_active ? "default" : "secondary"}
        className="max-w-32 truncate"
      >
        {disclaimer.title}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading services...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Disclaimer Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign specific disclaimers to services or manage them in bulk
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(value) => bulkAssignDisclaimer(value === 'none' ? null : value, 'copay')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Bulk assign to co-pay services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Remove all disclaimers</SelectItem>
                  {disclaimers.filter(d => d.is_active).map((disclaimer) => (
                    <SelectItem key={disclaimer.id} value={disclaimer.id}>
                      {disclaimer.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-card"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{service.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {service.vendor?.name || 'No vendor'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {service.copay_allowed && (
                      <Badge variant="outline" className="text-xs">Co-Pay Enabled</Badge>
                    )}
                    {service.respa_split_limit && (
                      <Badge variant="outline" className="text-xs">
                        {service.respa_split_limit}% RESPA Limit
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  {getDisclaimerBadge(service.disclaimer_id)}
                  
                  <div className="flex gap-1">
                    <Select
                      value={service.disclaimer_id || "none"}
                      onValueChange={(value) => 
                        updateServiceDisclaimer(service.id, value === 'none' ? null : value)
                      }
                      disabled={updating === service.id}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Disclaimer</SelectItem>
                        {disclaimers.filter(d => d.is_active).map((disclaimer) => (
                          <SelectItem key={disclaimer.id} value={disclaimer.id}>
                            {disclaimer.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {service.disclaimer_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewServiceDisclaimer(service.disclaimer_id!, service.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No services found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer Preview Modal */}
      {previewDisclaimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Disclaimer Preview</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewDisclaimer(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg text-yellow-900">
                <h3 className="font-bold text-lg mb-2">{previewDisclaimer.title}</h3>
                <p className="text-sm leading-relaxed mb-4">
                  {previewDisclaimer.content}
                </p>
                <button className="text-sm font-medium hover:underline">
                  {previewDisclaimer.button_text}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is how the disclaimer will appear when users hover over the info icon on the service card.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};