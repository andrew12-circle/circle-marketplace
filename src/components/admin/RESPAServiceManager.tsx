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
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Search, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { determineVendorRisk } from '../marketplace/RESPAComplianceSystem';
import RESPADocumentUpload from './RESPADocumentUpload';

interface DocumentInfo {
  name: string;
  path: string;
  size: number;
  uploadedAt: string;
}

interface Service {
  id: string;
  title: string;
  category: string;
  description?: string;
  is_respa_regulated?: boolean;
  respa_risk_level?: string;
  respa_split_limit?: number;
  respa_compliance_notes?: string;
  
  regulatory_findings?: string;
  supporting_documents?: DocumentInfo[];
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
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
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
        .select('id, title, category, description, is_respa_regulated, respa_risk_level, respa_split_limit, respa_compliance_notes, regulatory_findings, supporting_documents, vendor_id')
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
        supporting_documents: (service.supporting_documents as any) || [],
        vendor: service.vendor_id ? vendorMap.get(service.vendor_id) : undefined
      })) || [];

      setServices(servicesWithVendors as Service[]);
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
        service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(service => {
        switch (filterStatus) {
          case 'evaluated':
            return service.respa_split_limit !== null && service.respa_split_limit !== undefined;
          case 'pending':
            return service.respa_split_limit === null || service.respa_split_limit === undefined;
          case 'no-split-limit':
            return service.respa_split_limit === null || service.respa_split_limit === undefined;
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
      // Convert updates to match database schema
      const dbUpdates: any = { ...updates };
      if (updates.supporting_documents) {
        dbUpdates.supporting_documents = updates.supporting_documents;
      }
      
      const { error } = await supabase
        .from('services')
        .update(dbUpdates)
        .eq('id' as any, serviceId);

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
      // Convert updates to match database schema
      const dbUpdates: any = { ...updates };
      if (updates.supporting_documents) {
        dbUpdates.supporting_documents = updates.supporting_documents;
      }
      
      const { error } = await supabase
        .from('services')
        .update(dbUpdates)
        .in('id' as any, selectedServices as any);

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
          
          const percentage = riskLevel === 'high' ? 0 : (riskLevel === 'medium' ? 50 : 100);
          return {
            id: service.id,
            is_respa_regulated: isRegulated,
            respa_risk_level: riskLevel,
            respa_split_limit: percentage
          };
        });

      for (const update of updates) {
        const { error } = await supabase
          .from('services')
          .update({
            is_respa_regulated: update.is_respa_regulated,
            respa_risk_level: update.respa_risk_level,
            respa_split_limit: update.respa_split_limit
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
    const hasSplit = service.respa_split_limit !== null && service.respa_split_limit !== undefined;
    
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
          Set maximum split percentages for services. Changes here will update both admin limits AND marketplace display percentages.
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
      
      <CardContent className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Split Percentage Management Moved</h3>
          <p className="text-muted-foreground mb-4">
            Split percentage limits are now managed exclusively in the RESPA Compliance Manager section.
          </p>
          <p className="text-sm text-muted-foreground">
            This ensures centralized compliance management and prevents conflicts between different editing interfaces.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RESPAServiceManager;