import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Plus, Calendar, Mail, Phone, Globe, FileText, Check, X, Clock, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, differenceInDays } from "date-fns";

interface ComplianceTracking {
  id: string;
  service_id: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approval_date?: string;
  approval_notes?: string;
  initial_listing_date: string;
  deadline_date: string;
  minimum_outreach_count: number;
  current_outreach_count: number;
  created_at: string;
  updated_at: string;
}

interface OutreachAttempt {
  id: string;
  service_id: string;
  compliance_tracking_id: string;
  contact_method: 'email' | 'phone' | 'mail' | 'website_form' | 'other';
  contact_target: string;
  attempt_date: string;
  subject_line?: string;
  message_content?: string;
  evidence_url?: string;
  evidence_type?: 'screenshot' | 'email_receipt' | 'document' | 'other';
  response_received: boolean;
  response_date?: string;
  response_content?: string;
  created_at: string;
}

interface ServiceComplianceTrackerProps {
  serviceId: string;
  serviceName: string;
}

export function ServiceComplianceTracker({ serviceId, serviceName }: ServiceComplianceTrackerProps) {
  const [complianceData, setComplianceData] = useState<ComplianceTracking | null>(null);
  const [outreachAttempts, setOutreachAttempts] = useState<OutreachAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddOutreach, setShowAddOutreach] = useState(false);

  // New outreach form state
  const [newOutreach, setNewOutreach] = useState({
    contact_method: 'email' as const,
    contact_target: '',
    subject_line: '',
    message_content: '',
    evidence_url: '',
    evidence_type: 'screenshot' as const,
    response_received: false,
    response_content: ''
  });

  const loadComplianceData = useCallback(async () => {
    console.log('ServiceComplianceTracker: loadComplianceData called for serviceId:', serviceId);
    try {
      setLoading(true);
      // Load compliance tracking record
      let { data: compliance, error: complianceError } = await supabase
        .from('service_compliance_tracking')
        .select('*')
        .eq('service_id', serviceId)
        .maybeSingle();

      if (complianceError) throw complianceError;

      // If no compliance record exists, create one
      if (!compliance) {
        const { data: newCompliance, error: createError } = await supabase
          .from('service_compliance_tracking')
          .insert([{ service_id: serviceId }])
          .select()
          .single();

        if (createError) throw createError;
        compliance = newCompliance;
      }

      setComplianceData(compliance);

      // Load outreach attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('service_outreach_attempts')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      if (attemptsError) throw attemptsError;
      setOutreachAttempts(attempts || []);

    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    console.log('ServiceComplianceTracker: useEffect triggered for serviceId:', serviceId);
    loadComplianceData();
  }, [serviceId, loadComplianceData]);

  const updateApprovalStatus = async (status: 'approved' | 'rejected', notes?: string) => {
    if (!complianceData) return;

    try {
      const { error } = await supabase
        .from('service_compliance_tracking')
        .update({
          approval_status: status,
          approval_date: new Date().toISOString(),
          approval_notes: notes
        })
        .eq('id', complianceData.id);

      if (error) throw error;

      await loadComplianceData();
      toast.success(`Service ${status} successfully`);
    } catch (error) {
      console.error('Error updating approval status:', error);
      toast.error('Failed to update approval status');
    }
  };

  const addOutreachAttempt = async () => {
    if (!complianceData) return;

    try {
      const { error } = await supabase
        .from('service_outreach_attempts')
        .insert([{
          service_id: serviceId,
          compliance_tracking_id: complianceData.id,
          ...newOutreach
        }]);

      if (error) throw error;

      await loadComplianceData();
      setShowAddOutreach(false);
      setNewOutreach({
        contact_method: 'email',
        contact_target: '',
        subject_line: '',
        message_content: '',
        evidence_url: '',
        evidence_type: 'screenshot',
        response_received: false,
        response_content: ''
      });
      toast.success('Outreach attempt recorded');
    } catch (error) {
      console.error('Error adding outreach attempt:', error);
      toast.error('Failed to record outreach attempt');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      approved: { variant: "default" as const, icon: Check, color: "text-green-600" },
      rejected: { variant: "destructive" as const, icon: X, color: "text-red-600" },
      auto_approved: { variant: "outline" as const, icon: Check, color: "text-blue-600" }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getContactIcon = (method: string) => {
    const icons = {
      email: Mail,
      phone: Phone,
      website_form: Globe,
      mail: FileText,
      other: FileText
    };
    return icons[method as keyof typeof icons] || FileText;
  };

  const getDaysRemaining = () => {
    if (!complianceData) return 0;
    return differenceInDays(new Date(complianceData.deadline_date), new Date());
  };

  const isCompliant = () => {
    if (!complianceData) return false;
    return complianceData.current_outreach_count >= complianceData.minimum_outreach_count;
  };

  if (loading) {
    return <div className="p-4">Loading compliance data...</div>;
  }

  if (!complianceData) {
    return <div className="p-4">No compliance data found</div>;
  }

  const daysRemaining = getDaysRemaining();
  const compliant = isCompliant();

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Compliance Status - {serviceName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Status</label>
              {getStatusBadge(complianceData.approval_status)}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Days Remaining</label>
              <div className={`text-2xl font-bold ${daysRemaining < 7 ? 'text-red-600' : daysRemaining < 14 ? 'text-yellow-600' : 'text-green-600'}`}>
                {daysRemaining}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Outreach Progress</label>
              <div className="text-2xl font-bold">
                {complianceData.current_outreach_count} / {complianceData.minimum_outreach_count}
              </div>
              <div className={`text-xs ${compliant ? 'text-green-600' : 'text-red-600'}`}>
                {compliant ? 'Requirement met' : 'More outreach needed'}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <div className="text-sm">{format(new Date(complianceData.deadline_date), 'MMM dd, yyyy')}</div>
            </div>
          </div>

          {/* Approval Actions */}
          {complianceData.approval_status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={() => updateApprovalStatus('approved', 'Manually approved by admin')}
                variant="default"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve Service
              </Button>
              <Button 
                onClick={() => updateApprovalStatus('rejected', 'Rejected by admin')}
                variant="destructive"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Reject Service
              </Button>
            </div>
          )}

          {complianceData.approval_notes && (
            <div className="p-3 bg-muted rounded-lg">
              <label className="text-sm font-medium">Approval Notes:</label>
              <p className="text-sm mt-1">{complianceData.approval_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outreach Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Outreach Attempts</span>
            <Dialog open={showAddOutreach} onOpenChange={setShowAddOutreach}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Outreach
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record New Outreach Attempt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact Method</label>
                      <Select value={newOutreach.contact_method} onValueChange={(value: any) => setNewOutreach({...newOutreach, contact_method: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="mail">Physical Mail</SelectItem>
                          <SelectItem value="website_form">Website Form</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact Target</label>
                      <Input
                        placeholder="Email address, phone number, etc."
                        value={newOutreach.contact_target}
                        onChange={(e) => setNewOutreach({...newOutreach, contact_target: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject Line</label>
                    <Input
                      placeholder="Email subject or call purpose"
                      value={newOutreach.subject_line}
                      onChange={(e) => setNewOutreach({...newOutreach, subject_line: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message Content</label>
                    <Textarea
                      placeholder="Content of your outreach message"
                      value={newOutreach.message_content}
                      onChange={(e) => setNewOutreach({...newOutreach, message_content: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Evidence</label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `compliance-evidence-${Date.now()}.${fileExt}`;
                                const { data, error } = await supabase.storage
                                  .from('compliance-evidence')
                                  .upload(fileName, file);
                                
                                if (error) throw error;
                                
                                const { data: urlData } = supabase.storage
                                  .from('compliance-evidence')
                                  .getPublicUrl(fileName);
                                
                                setNewOutreach({...newOutreach, evidence_url: urlData.publicUrl});
                                toast.success('File uploaded successfully');
                              } catch (error) {
                                console.error('Upload error:', error);
                                toast.error('Failed to upload file');
                              }
                            }
                          }}
                        />
                        <Input
                          placeholder="Or paste URL to evidence"
                          value={newOutreach.evidence_url}
                          onChange={(e) => setNewOutreach({...newOutreach, evidence_url: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Evidence Type</label>
                      <Select value={newOutreach.evidence_type} onValueChange={(value: any) => setNewOutreach({...newOutreach, evidence_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="screenshot">Screenshot</SelectItem>
                          <SelectItem value="email_receipt">Email Receipt</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Response Content (if received)</label>
                    <Textarea
                      placeholder="Any response received from the service"
                      value={newOutreach.response_content}
                      onChange={(e) => {
                        setNewOutreach({
                          ...newOutreach, 
                          response_content: e.target.value,
                          response_received: e.target.value.length > 0
                        });
                      }}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={addOutreachAttempt} disabled={!newOutreach.contact_target}>
                      Record Outreach
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddOutreach(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outreachAttempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No outreach attempts recorded yet. Add your first outreach to start tracking compliance.
            </div>
          ) : (
            <div className="space-y-4">
              {outreachAttempts.map((attempt) => {
                const Icon = getContactIcon(attempt.contact_method);
                return (
                  <div key={attempt.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium capitalize">{attempt.contact_method}</span>
                        <span className="text-muted-foreground">→ {attempt.contact_target}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(attempt.attempt_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    {attempt.subject_line && (
                      <div>
                        <span className="text-sm font-medium">Subject:</span> {attempt.subject_line}
                      </div>
                    )}
                    
                    {attempt.message_content && (
                      <div className="text-sm bg-muted p-2 rounded">
                        {attempt.message_content}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {attempt.evidence_url && (
                          <a 
                            href={attempt.evidence_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Evidence ({attempt.evidence_type})
                          </a>
                        )}
                        {attempt.response_received && (
                          <Badge variant="outline" className="text-green-600">
                            Response Received
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {attempt.response_content && (
                      <div className="text-sm bg-green-50 p-2 rounded border-l-4 border-green-200">
                        <span className="font-medium">Response:</span> {attempt.response_content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}