import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, CheckCircle, FileText, Calculator, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SERVICE_CATEGORIES, determineVendorRisk, getRiskBadge } from "@/components/marketplace/RESPAComplianceSystem";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  is_respa_regulated: boolean | null;
  respa_risk_level: string | null;
  respa_compliance_notes: string | null;
  max_split_percentage: number | null;
  compliance_checklist: any;
  vendor_id: string;
  vendor: {
    id: string;
    business_name: string;
  };
}

interface ComplianceRule {
  serviceType: string;
  maxSplitPercentage: number;
  requiredDocuments: string[];
  complianceNotes: string;
  riskLevel: 'high' | 'medium' | 'low';
}

const DEFAULT_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    serviceType: 'CRM Software',
    maxSplitPercentage: 100,
    requiredDocuments: ['Marketing Materials', 'Service Agreement'],
    complianceNotes: 'Standard technology service - no RESPA restrictions',
    riskLevel: 'low'
  },
  {
    serviceType: 'Lead Generation',
    maxSplitPercentage: 100,
    requiredDocuments: ['Marketing Strategy', 'Lead Source Documentation'],
    complianceNotes: 'Ensure leads are for advertising value only',
    riskLevel: 'low'
  },
  {
    serviceType: 'Title Services',
    maxSplitPercentage: 0,
    requiredDocuments: ['RESPA Compliance Certificate', 'Legal Review'],
    complianceNotes: 'PROHIBITED - Cannot split costs with settlement services',
    riskLevel: 'high'
  },
  {
    serviceType: 'Home Inspection',
    maxSplitPercentage: 0,
    requiredDocuments: ['RESPA Compliance Certificate', 'Legal Review'],
    complianceNotes: 'PROHIBITED - Settlement service under RESPA',
    riskLevel: 'high'
  },
  {
    serviceType: 'Mortgage Services',
    maxSplitPercentage: 0,
    requiredDocuments: ['RESPA Compliance Certificate', 'Legal Review'],
    complianceNotes: 'PROHIBITED - Direct settlement service',
    riskLevel: 'high'
  },
  {
    serviceType: 'Photography',
    maxSplitPercentage: 100,
    requiredDocuments: ['Service Agreement', 'Portfolio Examples'],
    complianceNotes: 'Marketing service - fully splittable',
    riskLevel: 'low'
  },
  {
    serviceType: 'Home Warranty',
    maxSplitPercentage: 50,
    requiredDocuments: ['Joint Marketing Agreement', 'Compliance Review'],
    complianceNotes: 'Limited split allowed for true joint advertising only',
    riskLevel: 'medium'
  }
];

export const RESPAComplianceManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterCompliance, setFilterCompliance] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          category,
          is_respa_regulated,
          respa_risk_level,
          respa_compliance_notes,
          max_split_percentage,
          compliance_checklist,
          vendor_id,
          vendor:vendors(id, business_name)
        `)
        .order('title');

      if (error) throw error;
      // Filter out any data with invalid vendor structure and cast properly
      const validServices = (data || []).filter((service: any) => 
        service.vendor && 
        typeof service.vendor === 'object' && 
        !Array.isArray(service.vendor) &&
        service.vendor.id && 
        service.vendor.business_name
      ) as unknown as Service[];
      
      setServices(validServices);
      setFilteredServices(validServices);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRisk !== "all") {
      filtered = filtered.filter(service => {
        const riskData = { name: service.title, description: service.description, is_respa_regulated: service.is_respa_regulated, respa_risk_level: service.respa_risk_level };
        const risk = service.respa_risk_level || determineVendorRisk(riskData);
        return risk === filterRisk;
      });
    }

    if (filterCompliance !== "all") {
      filtered = filtered.filter(service => {
        if (filterCompliance === "evaluated") {
          return service.is_respa_regulated !== null;
        } else if (filterCompliance === "pending") {
          return service.is_respa_regulated === null;
        }
        return true;
      });
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, filterRisk, filterCompliance]);

  const generateComplianceChecklist = (service: Service) => {
    const rule = DEFAULT_COMPLIANCE_RULES.find(r => 
      service.category.toLowerCase().includes(r.serviceType.toLowerCase()) ||
      service.title.toLowerCase().includes(r.serviceType.toLowerCase())
    ) || DEFAULT_COMPLIANCE_RULES[0]; // Default to CRM if no match

    return {
      riskLevel: rule.riskLevel,
      maxSplitPercentage: rule.maxSplitPercentage,
      requiredDocuments: rule.requiredDocuments,
      complianceSteps: [
        'Review service description for RESPA implications',
        'Verify vendor business model',
        'Check for settlement service connections',
        'Document true advertising value',
        'Obtain legal sign-off if required'
      ],
      notes: rule.complianceNotes
    };
  };

  const bulkEvaluateServices = async () => {
    setSaving(true);
    try {
      const updates = services.map(service => {
        const riskData = { name: service.title, description: service.description, is_respa_regulated: service.is_respa_regulated, respa_risk_level: service.respa_risk_level };
        const risk = determineVendorRisk(riskData);
        const checklist = generateComplianceChecklist(service);
      const rule = DEFAULT_COMPLIANCE_RULES.find(r => 
        service.category.toLowerCase().includes(r.serviceType.toLowerCase()) ||
        service.title.toLowerCase().includes(r.serviceType.toLowerCase())
      );

        return {
          id: service.id,
          is_respa_regulated: risk === 'high',
          respa_risk_level: risk,
          max_split_percentage: rule?.maxSplitPercentage || (risk === 'high' ? 0 : 100),
          compliance_checklist: checklist,
          respa_compliance_notes: `Auto-evaluated: ${checklist.notes}`
        };
      });

      for (const update of updates) {
        const { error } = await supabase
          .from('services')
          .update({
            respa_risk_level: update.respa_risk_level,
            max_split_percentage: update.max_split_percentage,
            compliance_checklist: update.compliance_checklist,
            respa_compliance_notes: update.respa_compliance_notes
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      await loadServices();
      toast({
        title: "Bulk Evaluation Complete",
        description: `Updated ${updates.length} services with RESPA compliance assessments`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete bulk evaluation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateServiceCompliance = async (serviceId: string, updates: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId);

      if (error) throw error;

      await loadServices();
      toast({
        title: "Updated",
        description: "Service compliance information updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getComplianceStats = () => {
    const total = services.length;
    const evaluated = services.filter(s => s.respa_risk_level !== null).length;
    const highRisk = services.filter(s => {
      const riskData = { name: s.title, description: s.description, is_respa_regulated: s.is_respa_regulated, respa_risk_level: s.respa_risk_level };
      const currentRisk = (s.respa_risk_level || determineVendorRisk(riskData)) as string;
      return currentRisk === 'high';
    }).length;
    const approved = services.filter(s => s.max_split_percentage && s.max_split_percentage > 0).length;

    return { total, evaluated, highRisk, approved };
  };

  const stats = getComplianceStats();

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
            <p className="text-xs text-muted-foreground">Evaluated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Split Approved</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Service Evaluation</TabsTrigger>
          <TabsTrigger value="rules">Compliance Rules</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>RESPA Compliance Manager</span>
                <Button onClick={bulkEvaluateServices} disabled={saving}>
                  <Calculator className="w-4 h-4 mr-2" />
                  {saving ? "Evaluating..." : "Bulk Evaluate All"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label>Search Services</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search services, vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Risk Level</Label>
                  <Select value={filterRisk} onValueChange={setFilterRisk}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={filterCompliance} onValueChange={setFilterCompliance}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="evaluated">Evaluated</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services List */}
          <div className="grid gap-4">
            {loading ? (
              <div>Loading services...</div>
            ) : (
              filteredServices.map((service) => (
                <ServiceComplianceCard
                  key={service.id}
                  service={service}
                  onUpdate={(updates) => updateServiceCompliance(service.id, updates)}
                  onSelect={() => setSelectedService(service)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <ComplianceRulesManager />
        </TabsContent>

        <TabsContent value="reports">
          <ComplianceReports services={services} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ServiceComplianceCard = ({ 
  service, 
  onUpdate, 
  onSelect 
}: { 
  service: Service; 
  onUpdate: (updates: any) => void;
  onSelect: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [formData, setFormData] = useState({
    is_respa_regulated: service.is_respa_regulated,
    respa_risk_level: service.respa_risk_level,
    max_split_percentage: service.max_split_percentage || 0,
    respa_compliance_notes: service.respa_compliance_notes || ''
  });

  const currentRisk = service.respa_risk_level || (() => {
    const riskData = { name: service.title, description: service.description, is_respa_regulated: service.is_respa_regulated, respa_risk_level: service.respa_risk_level };
    return determineVendorRisk(riskData);
  })();
  const isEvaluated = service.respa_risk_level !== null;

  return (
    <Card className={`transition-all ${expanded ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{service.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{service.vendor.business_name}</p>
          </div>
          <div className="flex items-center gap-2">
            {getRiskBadge(currentRisk as 'high' | 'medium' | 'low')}
            {!isEvaluated && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Pending Review
              </Badge>
            )}
            {service.max_split_percentage !== null && (
              <Badge variant="secondary">
                {service.max_split_percentage}% Split
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div>
            <Label>Service Description</Label>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>RESPA Regulated</Label>
              <Select 
                value={formData.is_respa_regulated?.toString() || "null"} 
                onValueChange={(value) => setFormData({
                  ...formData, 
                  is_respa_regulated: value === "null" ? null : value === "true"
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Not Evaluated</SelectItem>
                  <SelectItem value="true">Yes - RESPA Regulated</SelectItem>
                  <SelectItem value="false">No - Non-RESPA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Risk Level</Label>
              <Select 
                value={formData.respa_risk_level || ""} 
                onValueChange={(value) => setFormData({...formData, respa_risk_level: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Maximum Split Percentage</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.max_split_percentage}
              onChange={(e) => setFormData({
                ...formData, 
                max_split_percentage: parseInt(e.target.value) || 0
              })}
            />
          </div>

          <div>
            <Label>Compliance Notes</Label>
            <Textarea
              value={formData.respa_compliance_notes}
              onChange={(e) => setFormData({...formData, respa_compliance_notes: e.target.value})}
              placeholder="Document compliance reasoning, required documents, special considerations..."
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onUpdate(formData)}>
              Update Compliance
            </Button>
            <Button variant="outline" onClick={onSelect}>
              <FileText className="w-4 h-4 mr-2" />
              View Checklist
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const ComplianceRulesManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>RESPA Compliance Rules Engine</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DEFAULT_COMPLIANCE_RULES.map((rule, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{rule.serviceType}</h3>
                <Badge variant={rule.riskLevel === 'high' ? 'destructive' : rule.riskLevel === 'medium' ? 'secondary' : 'default'}>
                  {rule.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{rule.complianceNotes}</p>
              <div className="text-sm">
                <strong>Max Split:</strong> {rule.maxSplitPercentage}%
              </div>
              <div className="text-sm">
                <strong>Required Docs:</strong> {rule.requiredDocuments.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ComplianceReports = ({ services }: { services: Service[] }) => {
  const generateReport = () => {
    const byRisk = services.reduce((acc, service) => {
      const riskData = { name: service.title, description: service.description, is_respa_regulated: service.is_respa_regulated, respa_risk_level: service.respa_risk_level };
      const risk = service.respa_risk_level || determineVendorRisk(riskData);
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = services.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { byRisk, byCategory };
  };

  const { byRisk, byCategory } = generateReport();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Summary Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">By Risk Level</h3>
              {Object.entries(byRisk).map(([risk, count]) => (
                <div key={risk} className="flex justify-between">
                  <span className="capitalize">{risk} Risk:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-semibold mb-3">By Category</h3>
              {Object.entries(byCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between">
                  <span>{category}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};