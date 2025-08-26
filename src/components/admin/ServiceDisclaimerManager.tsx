import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Eye, X } from "lucide-react";
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
  const { disclaimers, refetch } = useRESPADisclaimers();
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    refetch(false); // Fetch all disclaimers including inactive ones
  }, []);

  useEffect(() => {
    const filtered = services.filter(service =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [services, searchTerm]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          disclaimer_id,
          copay_allowed,
          respa_split_limit,
          vendor:vendors(name)
        `)
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateServiceDisclaimer = async (serviceId: string, disclaimerId: string | null) => {
    setUpdating(serviceId);
    try {
      const { error } = await supabase
        .from('services')
        .update({ disclaimer_id: disclaimerId })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, disclaimer_id: disclaimerId }
          : service
      ));

      toast({
        title: "Success",
        description: disclaimerId 
          ? "Disclaimer assigned successfully" 
          : "Disclaimer removed successfully",
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
      const { data, error } = await supabase
        .from('respa_disclaimers')
        .select('*')
        .eq('id', disclaimerId)
        .single();

      if (error) throw error;
      setPreviewDisclaimer(data);
    } catch (error) {
      console.error('Error fetching disclaimer:', error);
      toast({
        title: "Error",
        description: "Failed to load disclaimer preview",
        variant: "destructive",
      });
    }
  };

  const getDisclaimerBadge = (disclaimerId?: string) => {
    if (!disclaimerId) return <Badge variant="secondary" className="text-xs">No Disclaimer</Badge>;
    
    const disclaimer = disclaimers.find(d => d.id === disclaimerId);
    return (
      <Badge variant="default" className="text-xs">
        {disclaimer?.title || 'Unknown Disclaimer'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading services...</span>
          </div>
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
            Assign specific disclaimers to services and manage co-pay settings
          </p>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Service Cards */}
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Service Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{service.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Vendor: {service.vendor?.name || 'Unknown'}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            {service.copay_allowed && (
                              <Badge variant="outline" className="text-xs">Co-Pay Enabled</Badge>
                            )}
                            {service.respa_split_limit && (
                              <Badge variant="outline" className="text-xs">
                                {service.respa_split_limit}% RESPA Limit
                              </Badge>
                            )}
                            {getDisclaimerBadge(service.disclaimer_id)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer Controls */}
                    <div className="flex flex-col gap-3 lg:w-80">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-muted-foreground min-w-0">
                          Disclaimer:
                        </label>
                        <Select
                          value={service.disclaimer_id || "none"}
                          onValueChange={(value) => 
                            updateServiceDisclaimer(service.id, value === 'none' ? null : value)
                          }
                          disabled={updating === service.id}
                        >
                          <SelectTrigger className="flex-1">
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
                            className="shrink-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {updating === service.id && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No services found matching your search.</p>
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
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">{previewDisclaimer.title}</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {previewDisclaimer.content}
                  </div>
                </div>
                
                {previewDisclaimer.button_text && (
                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full"
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};