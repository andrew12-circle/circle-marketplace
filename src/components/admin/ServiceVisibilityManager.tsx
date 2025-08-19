import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Search, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
  id: string;
  title: string;
  category: string;
  is_active: boolean;
  is_verified: boolean;
  vendor_name?: string;
  created_at: string;
}

export const ServiceVisibilityManager = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(true);

  // Get unique categories
  const categories = [...new Set(services.map(s => s.category).filter(Boolean))].sort();

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          category,
          is_active,
          is_verified,
          created_at,
          vendors (name)
        `)
        .order('title');

      if (error) throw error;

      const formattedServices = (data || []).map(service => ({
        ...service,
        vendor_name: service.vendors?.name || 'No Vendor'
      }));

      setServices(formattedServices);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceVisibility = async (serviceId: string, currentState: boolean) => {
    if (updating.has(serviceId)) return;

    setUpdating(prev => new Set(prev).add(serviceId));

    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentState })
        .eq('id', serviceId);

      if (error) throw error;

      // Update local state
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, is_active: !currentState }
            : service
        )
      );

      toast({
        title: 'Success',
        description: `Service ${!currentState ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service visibility',
        variant: 'destructive'
      });
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  const bulkToggle = async (activate: boolean) => {
    const servicesToUpdate = filteredServices.filter(s => s.is_active !== activate);
    
    if (servicesToUpdate.length === 0) {
      toast({
        title: 'Info',
        description: `All filtered services are already ${activate ? 'active' : 'inactive'}`,
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${activate ? 'activate' : 'deactivate'} ${servicesToUpdate.length} services?`
    );

    if (!confirmed) return;

    try {
      const serviceIds = servicesToUpdate.map(s => s.id);
      
      const { error } = await supabase
        .from('services')
        .update({ is_active: activate })
        .in('id', serviceIds);

      if (error) throw error;

      // Update local state
      setServices(prev => 
        prev.map(service => 
          serviceIds.includes(service.id)
            ? { ...service, is_active: activate }
            : service
        )
      );

      toast({
        title: 'Success',
        description: `${servicesToUpdate.length} services ${activate ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk update',
        variant: 'destructive'
      });
    }
  };

  // Filter services
  useEffect(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => 
        statusFilter === 'active' ? service.is_active : !service.is_active
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(service => service.category === categoryFilter);
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    loadServices();
  }, []);

  const activeCount = services.filter(s => s.is_active).length;
  const inactiveCount = services.filter(s => !s.is_active).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between">
        <div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-0 h-auto font-normal">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Service Visibility Manager</h2>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          <p className="text-muted-foreground mt-1">
            Control which services appear in the marketplace
          </p>
        </div>
        <Button onClick={loadServices} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <CollapsibleContent className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Services</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <EyeOff className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Inactive Services</p>
                <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Services</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Bulk Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Services</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, vendor, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status Filter</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category Filter</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button 
              onClick={() => bulkToggle(true)}
              variant="outline"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Activate Filtered ({filteredServices.filter(s => !s.is_active).length})
            </Button>
            <Button 
              onClick={() => bulkToggle(false)}
              variant="outline"
              size="sm"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Deactivate Filtered ({filteredServices.filter(s => s.is_active).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>Services ({filteredServices.length})</CardTitle>
          <CardDescription>
            Toggle individual services on/off. Only services that are both <strong>Active</strong> and <strong>Verified</strong> appear in the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No services found matching your filters
            </div>
          ) : (
            <div className="space-y-2">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{service.title}</h3>
                      {service.is_verified && (
                        <Badge variant="secondary" className="shrink-0">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{service.vendor_name}</span>
                      <span>•</span>
                      <span>{service.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Badge
                      variant={service.is_active ? "default" : "secondary"}
                      className={service.is_active ? "bg-green-500" : "bg-red-500"}
                    >
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`switch-${service.id}`} className="sr-only">
                        Toggle service visibility
                      </Label>
                      <Switch
                        id={`switch-${service.id}`}
                        checked={service.is_active}
                        onCheckedChange={() => toggleServiceVisibility(service.id, service.is_active)}
                        disabled={updating.has(service.id)}
                      />
                      {updating.has(service.id) && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};