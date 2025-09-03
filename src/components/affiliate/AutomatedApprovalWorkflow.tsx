import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  UserCheck,
  FileText,
  Globe,
  TrendingUp,
  Shield
} from "lucide-react";

interface AutomatedApprovalWorkflowProps {
  affiliateId?: string;
  onStatusChange?: (status: string) => void;
}

interface ApprovalWorkflow {
  id: string;
  current_stage: string;
  auto_approval_score: number;
  manual_review_required: boolean;
  approval_criteria_met: Record<string, boolean>;
  stage_history: Array<{
    stage: string;
    timestamp: string;
    score: number;
    auto_decision: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

interface FraudCheck {
  id: string;
  check_type: string;
  risk_score: number;
  details: Record<string, any>;
  flagged: boolean;
  created_at: string;
}

export const AutomatedApprovalWorkflow = ({ 
  affiliateId, 
  onStatusChange 
}: AutomatedApprovalWorkflowProps) => {
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [fraudChecks, setFraudChecks] = useState<FraudCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (affiliateId) {
      loadWorkflowData();
    }
  }, [affiliateId]);

  const loadWorkflowData = async () => {
    if (!affiliateId) return;

    try {
      setLoading(true);

      // Load workflow data
      const { data: workflowData, error: workflowError } = await supabase
        .from('affiliate_approval_workflow')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .single();

      if (workflowError && workflowError.code !== 'PGRST116') {
        throw workflowError;
      }

      setWorkflow(workflowData);

      // Load fraud checks
      const { data: fraudData, error: fraudError } = await supabase
        .from('affiliate_fraud_checks')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (fraudError) {
        throw fraudError;
      }

      setFraudChecks(fraudData || []);

    } catch (error: any) {
      console.error('Error loading workflow data:', error);
      toast({
        title: "Error",
        description: "Failed to load approval workflow data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerApprovalProcess = async () => {
    if (!affiliateId) return;

    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('affiliate-fraud-detection/automated-approval', {
        body: { affiliate_id: affiliateId }
      });

      if (error) throw error;

      toast({
        title: "Approval Process Completed",
        description: `Status: ${data.current_stage}`,
      });

      // Reload data
      await loadWorkflowData();
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange(data.current_stage);
      }

    } catch (error: any) {
      console.error('Error triggering approval process:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to process approval",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'application_submitted':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'auto_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending_manual_review':
        return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'additional_info_required':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'auto_approved':
        return 'bg-green-100 text-green-800';
      case 'pending_manual_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'additional_info_required':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const criteriaItems = [
    { key: 'complete_profile', label: 'Complete Profile', icon: UserCheck, points: 20 },
    { key: 'website_provided', label: 'Website Provided', icon: Globe, points: 15 },
    { key: 'marketing_channels_specified', label: 'Marketing Channels', icon: TrendingUp, points: 10 },
    { key: 'terms_accepted', label: 'Terms Accepted', icon: FileText, points: 25 },
    { key: 'low_fraud_risk', label: 'Low Fraud Risk', icon: Shield, points: 30 }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading approval workflow...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Approval Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflow ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStageIcon(workflow.current_stage)}
                  <span className="font-medium">
                    {workflow.current_stage.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <Badge className={getStageColor(workflow.current_stage)}>
                  Score: {workflow.auto_approval_score}/100
                </Badge>
              </div>

              <Progress value={workflow.auto_approval_score} className="w-full" />

              <div className="text-sm text-muted-foreground">
                {workflow.manual_review_required ? (
                  <p className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Manual review required before approval
                  </p>
                ) : workflow.current_stage === 'auto_approved' ? (
                  <p className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Automatically approved based on criteria
                  </p>
                ) : (
                  <p>Additional information or actions may be required</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No approval workflow found</p>
              <Button onClick={triggerApprovalProcess} disabled={processing}>
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Start Approval Process
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Criteria */}
      {workflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Approval Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criteriaItems.map((criterion) => {
                const met = workflow.approval_criteria_met[criterion.key] || false;
                const IconComponent = criterion.icon;
                
                return (
                  <div key={criterion.key} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-5 h-5 ${met ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={met ? 'text-foreground' : 'text-muted-foreground'}>
                        {criterion.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={met ? 'default' : 'secondary'}>
                        {criterion.points} pts
                      </Badge>
                      {met ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fraud Detection Results */}
      {fraudChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fraudChecks.map((check) => (
                <div key={check.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {check.check_type.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={check.flagged ? 'destructive' : 'secondary'}>
                        Risk Score: {check.risk_score}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(check.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {check.flagged && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      High risk detected - manual review required
                    </div>
                  )}
                  
                  {check.details.indicators && Array.isArray(check.details.indicators) && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Issues found:</p>
                      <ul className="list-disc list-inside ml-2">
                        {check.details.indicators.map((indicator: any, index: number) => (
                          <li key={index}>{indicator.type?.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage History */}
      {workflow?.stage_history && workflow.stage_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Progress History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflow.stage_history.reverse().map((stage, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border-l-2 border-gray-200 pl-4">
                  {getStageIcon(stage.stage)}
                  <div className="flex-1">
                    <p className="font-medium">
                      {stage.stage.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Score: {stage.score}/100 • 
                      {stage.auto_decision ? ' Auto-decision' : ' Manual review'} • 
                      {new Date(stage.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {workflow && workflow.current_stage !== 'auto_approved' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                onClick={triggerApprovalProcess} 
                disabled={processing}
                variant="outline"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-run Approval Check
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};