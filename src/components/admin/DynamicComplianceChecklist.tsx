import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, FileText, Download, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  notes?: string;
  documents?: string[];
  riskLevel: 'high' | 'medium' | 'low';
}

interface ComplianceChecklist {
  serviceId: string;
  serviceTitle: string;
  riskLevel: 'high' | 'medium' | 'low';
  items: ChecklistItem[];
  overallNotes: string;
  completedAt?: string;
  approvedBy?: string;
}

const generateChecklistForService = (service: any): ComplianceChecklist => {
  const baseItems: ChecklistItem[] = [
    {
      id: 'service-review',
      title: 'Service Description Review',
      description: 'Review the complete service offering and business model',
      required: true,
      completed: false,
      riskLevel: 'low'
    },
    {
      id: 'vendor-verification',
      title: 'Vendor Business Verification',
      description: 'Verify vendor registration, licensing, and business structure',
      required: true,
      completed: false,
      riskLevel: 'medium'
    },
    {
      id: 'respa-analysis',
      title: 'RESPA Classification Analysis',
      description: 'Determine if service falls under RESPA settlement services',
      required: true,
      completed: false,
      riskLevel: 'high'
    }
  ];

  // Add risk-specific items
  const riskLevel = service.respa_risk_level || 'medium';
  
  if (riskLevel === 'high') {
    baseItems.push(
      {
        id: 'legal-review',
        title: 'Legal Counsel Review',
        description: 'Mandatory legal review for high-risk RESPA services',
        required: true,
        completed: false,
        riskLevel: 'high'
      },
      {
        id: 'documentation-review',
        title: 'RESPA Documentation Review',
        description: 'Review all RESPA compliance documentation and certifications',
        required: true,
        completed: false,
        riskLevel: 'high'
      },
      {
        id: 'settlement-connection',
        title: 'Settlement Service Connection Analysis',
        description: 'Analyze any connections to settlement services or providers',
        required: true,
        completed: false,
        riskLevel: 'high'
      }
    );
  }

  if (riskLevel === 'medium') {
    baseItems.push(
      {
        id: 'marketing-review',
        title: 'Marketing Material Review',
        description: 'Review proposed joint marketing materials for compliance',
        required: true,
        completed: false,
        riskLevel: 'medium'
      },
      {
        id: 'value-documentation',
        title: 'True Advertising Value Documentation',
        description: 'Document the legitimate advertising value of the service',
        required: true,
        completed: false,
        riskLevel: 'medium'
      }
    );
  }

  // Add category-specific items
  const category = service.category?.toLowerCase() || '';
  
  if (category.includes('crm') || category.includes('software')) {
    baseItems.push({
      id: 'software-integration',
      title: 'Software Integration Review',
      description: 'Review software integrations and data sharing policies',
      required: false,
      completed: false,
      riskLevel: 'low'
    });
  }

  if (category.includes('lead') || category.includes('marketing')) {
    baseItems.push({
      id: 'lead-source-verification',
      title: 'Lead Source Verification',
      description: 'Verify lead generation methods and source transparency',
      required: true,
      completed: false,
      riskLevel: 'medium'
    });
  }

  return {
    serviceId: service.id,
    serviceTitle: service.title,
    riskLevel,
    items: baseItems,
    overallNotes: ''
  };
};

interface DynamicComplianceChecklistProps {
  service: any;
  onComplete?: (checklist: ComplianceChecklist) => void;
  readOnly?: boolean;
}

export const DynamicComplianceChecklist = ({ 
  service, 
  onComplete, 
  readOnly = false 
}: DynamicComplianceChecklistProps) => {
  const [checklist, setChecklist] = useState<ComplianceChecklist | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing checklist or generate new one
    if (service.compliance_checklist) {
      setChecklist(service.compliance_checklist);
    } else {
      setChecklist(generateChecklistForService(service));
    }
  }, [service]);

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    if (!checklist || readOnly) return;

    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    setChecklist({
      ...checklist,
      items: updatedItems
    });
  };

  const saveChecklist = async () => {
    if (!checklist) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          compliance_checklist: checklist as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id);

      if (error) throw error;

      toast({
        title: "Checklist Saved",
        description: "Compliance checklist saved successfully",
      });

      if (onComplete) {
        onComplete(checklist);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save checklist",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCompletionProgress = () => {
    if (!checklist) return 0;
    const completed = checklist.items.filter(item => item.completed).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  const getRequiredItemsStatus = () => {
    if (!checklist) return { completed: 0, total: 0 };
    const required = checklist.items.filter(item => item.required);
    const completed = required.filter(item => item.completed);
    return { completed: completed.length, total: required.length };
  };

  const exportChecklist = () => {
    if (!checklist) return;

    const exportData = {
      service: service.title,
      vendor: service.vendor?.business_name || 'Unknown',
      riskLevel: checklist.riskLevel,
      completionDate: new Date().toISOString(),
      items: checklist.items.map(item => ({
        title: item.title,
        description: item.description,
        required: item.required,
        completed: item.completed,
        notes: item.notes || '',
        riskLevel: item.riskLevel
      })),
      overallNotes: checklist.overallNotes
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-checklist-${service.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!checklist) {
    return <div>Loading checklist...</div>;
  }

  const progress = getCompletionProgress();
  const requiredStatus = getRequiredItemsStatus();
  const isComplete = requiredStatus.completed === requiredStatus.total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl">Compliance Checklist</h2>
              <p className="text-sm text-muted-foreground">{checklist.serviceTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={checklist.riskLevel === 'high' ? 'destructive' : checklist.riskLevel === 'medium' ? 'secondary' : 'default'}>
                {checklist.riskLevel.toUpperCase()} RISK
              </Badge>
              {isComplete && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Required Items: {requiredStatus.completed}/{requiredStatus.total}</span>
              <span>Total Items: {checklist.items.filter(i => i.completed).length}/{checklist.items.length}</span>
            </div>

            {!readOnly && (
              <div className="flex gap-2">
                <Button onClick={saveChecklist} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Progress"}
                </Button>
                <Button variant="outline" onClick={exportChecklist}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-4">
        {checklist.items.map((item, index) => (
          <Card key={item.id} className={`${item.completed ? 'bg-green-50 border-green-200' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(checked) => 
                    updateChecklistItem(item.id, { completed: !!checked })
                  }
                  disabled={readOnly}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    {item.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                    <Badge 
                      variant={item.riskLevel === 'high' ? 'destructive' : item.riskLevel === 'medium' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {item.riskLevel}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  
                  {!readOnly && (
                    <Textarea
                      placeholder="Add notes, documentation, or comments..."
                      value={item.notes || ''}
                      onChange={(e) => updateChecklistItem(item.id, { notes: e.target.value })}
                      className="text-sm"
                      rows={2}
                    />
                  )}
                  
                  {readOnly && item.notes && (
                    <div className="text-sm bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {item.notes}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {!readOnly ? (
            <Textarea
              placeholder="Add overall compliance notes, final recommendations, or summary..."
              value={checklist.overallNotes}
              onChange={(e) => setChecklist({ ...checklist, overallNotes: e.target.value })}
              rows={4}
            />
          ) : (
            <div className="text-sm bg-gray-50 p-4 rounded">
              {checklist.overallNotes || 'No overall notes provided.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Status */}
      {isComplete && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Compliance Review Complete</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              All required checklist items have been completed. This service is ready for final approval.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};