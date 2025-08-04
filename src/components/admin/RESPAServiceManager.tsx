import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Search, CheckCircle, XCircle } from 'lucide-react';
import { determineVendorRisk } from '../marketplace/RESPAComplianceSystem';

interface Service {
  id: string;
  title: string;
  category: string;
  description?: string;
  is_respa_regulated?: boolean;
  respa_risk_level?: string;
  max_split_percentage?: number;
  vendor_id?: string;
  vendor?: {
    business_name?: string;
    display_name?: string;
    specialties?: string[];
  };
}

const RESPAServiceManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, filterStatus]);

  const loadServices = async () => {
    try {
      // First get services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, title, category, description, is_respa_regulated, respa_risk_level, max_split_percentage, vendor_id')
        .order('title');

      if (servicesError) throw servicesError;

      // Then get vendor profiles for these services
      const vendorIds = [...new Set(servicesData?.map(s => s.vendor_id).filter(Boolean))];
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('profiles')
        .select('user_id, business_name, display_name, specialties')
        .in('user_id', vendorIds);

      if (vendorsError) throw vendorsError;

      // Merge the data
      const vendorMap = new Map(vendorsData?.map(v => [v.user_id, v]) || []);
      const servicesWithVendors = servicesData?.map(service => ({
        ...service,
        vendor: service.vendor_id ? vendorMap.get(service.vendor_id) : undefined
      })) || [];

      setServices(servicesWithVendors);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(service => {
        switch (filterStatus) {
          case 'evaluated':
            return service.max_split_percentage !== null && service.max_split_percentage !== undefined;
          case 'pending':
            return service.max_split_percentage === null || service.max_split_percentage === undefined;
          case 'no-split-limit':
            return service.max_split_percentage === null || service.max_split_percentage === undefined;
          default:
            return true;
        }
      });
    }

    setFilteredServices(filtered);
  };

  const updateService = async (serviceId: string, updates: Partial<Service>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId);

      if (error) throw error;

      setServices(prev => prev.map(service =>
        service.id === serviceId ? { ...service, ...updates } : service
      ));

      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const bulkUpdateSelected = async (updates: Partial<Service>) => {
    if (selectedServices.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select services to update",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .in('id', selectedServices);

      if (error) throw error;

      setServices(prev => prev.map(service =>
        selectedServices.includes(service.id) ? { ...service, ...updates } : service
      ));

      setSelectedServices([]);
      toast({
        title: "Bulk Update Complete",
        description: `Updated ${selectedServices.length} services`,
      });
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast({
        title: "Error",
        description: "Failed to update services",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const autoAssessRisk = async () => {
    setSaving(true);
    try {
      const updates = services
        .filter(service => !service.respa_risk_level)
        .map(service => {
          const riskLevel = determineVendorRisk({
            name: service.title,
            description: service.description || ''
          });
          const isRegulated = riskLevel === 'high';
          
          return {
            id: service.id,
            is_respa_regulated: isRegulated,
            respa_risk_level: riskLevel,
            max_split_percentage: riskLevel === 'high' ? 0 : (riskLevel === 'medium' ? 50 : 100)
          };
        });

      for (const update of updates) {
        const { error } = await supabase
          .from('services')
          .update({
            is_respa_regulated: update.is_respa_regulated,
            respa_risk_level: update.respa_risk_level,
            max_split_percentage: update.max_split_percentage
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      await loadServices();
      toast({
        title: "Auto Assessment Complete",
        description: `Assessed ${updates.length} services`,
      });
    } catch (error) {
      console.error('Error in auto assessment:', error);
      toast({
        title: "Error",
        description: "Failed to complete auto assessment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (service: Service) => {
    const hasSplit = service.max_split_percentage !== null && service.max_split_percentage !== undefined;
    
    if (hasSplit) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Split Limit Set</Badge>;
    } else {
      return <Badge variant="secondary">Pending Setup</Badge>;
    }
  };

  const getComplianceStats = () => {
    const total = services.length;
    const evaluated = services.filter(s => s.respa_risk_level !== null).length;
    const pending = total - evaluated;
    const highRisk = services.filter(s => s.respa_risk_level === 'high').length;
    
    return { total, evaluated, pending, highRisk };
  };

  const stats = getComplianceStats();

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading services...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          RESPA Split Limit Management
        </CardTitle>
        <CardDescription>
          Set maximum split percentages for services when settlement service providers split bills (all services are RESPA regulated when splits occur)
        </CardDescription>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Services</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
            <div className="text-sm text-green-600">Evaluated</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-orange-600">Pending Review</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
            <div className="text-sm text-red-600">High Risk</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="evaluated">Evaluated</SelectItem>
              <SelectItem value="no-split-limit">No Split Limit Set</SelectItem>
              <SelectItem value="high-risk">High Risk</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={autoAssessRisk} disabled={saving} variant="outline">
            Auto Assess Risk
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedServices.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm font-medium">{selectedServices.length} services selected</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => bulkUpdateSelected({ is_respa_regulated: true, respa_risk_level: 'high', max_split_percentage: 0 })}
                disabled={saving}
              >
                Mark as High Risk
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => bulkUpdateSelected({ is_respa_regulated: false, respa_risk_level: 'low', max_split_percentage: 100 })}
                disabled={saving}
              >
                Mark as Low Risk
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedServices([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Services Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedServices.length === filteredServices.length && filteredServices.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedServices(filteredServices.map(s => s.id));
                      } else {
                        setSelectedServices([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Max Split %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServices(prev => [...prev, service.id]);
                        } else {
                          setSelectedServices(prev => prev.filter(id => id !== service.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.title}</div>
                      {service.description && (
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{service.category}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(service)}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={service.max_split_percentage || ''}
                      onChange={(e) => 
                        updateService(service.id, { 
                          max_split_percentage: parseInt(e.target.value) || 0 
                        })
                      }
                      className="w-20"
                      disabled={saving}
                      placeholder="0-100"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredServices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No services found matching your criteria
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RESPAServiceManager;