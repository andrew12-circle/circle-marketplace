
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Trash2, 
  Mail, 
  AlertCircle,
  CheckCircle,
  Save
} from "lucide-react";

interface ServiceConsultationEmailsProps {
  serviceId: string;
  serviceName: string;
}

export const ServiceConsultationEmails = ({ serviceId, serviceName }: ServiceConsultationEmailsProps) => {
  const [emails, setEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmails();
  }, [serviceId]);

  const loadEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('consultation_emails')
        .eq('id', serviceId)
        .single();

      if (error) throw error;

      const consultationEmails = data?.consultation_emails || [];
      // Always show at least one empty field
      setEmails(consultationEmails.length > 0 ? consultationEmails : ['']);
    } catch (error) {
      console.error('Error loading consultation emails:', error);
      toast.error('Failed to load consultation emails');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Empty emails are ok
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    if (emails.length < 4) {
      setEmails([...emails, '']);
    }
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty emails and validate
      const filteredEmails = emails
        .map(email => email.trim())
        .filter(email => email !== '');

      // Validate all emails
      const invalidEmails = filteredEmails.filter(email => !isValidEmail(email));
      if (invalidEmails.length > 0) {
        toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
        return;
      }

      // Check for duplicates
      const uniqueEmails = [...new Set(filteredEmails)];
      if (uniqueEmails.length !== filteredEmails.length) {
        toast.error('Duplicate email addresses found. Please remove duplicates.');
        return;
      }

      const { error } = await supabase
        .from('services')
        .update({ consultation_emails: uniqueEmails })
        .eq('id', serviceId);

      if (error) throw error;

      toast.success(`Consultation alert emails updated successfully`);
      
      // Reload to show the saved state
      await loadEmails();
    } catch (error: any) {
      console.error('Error saving consultation emails:', error);
      toast.error(error.message || 'Failed to save consultation emails');
    } finally {
      setSaving(false);
    }
  };

  const getValidEmails = () => {
    return emails.filter(email => email.trim() !== '' && isValidEmail(email.trim()));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading consultation emails...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Consultation Alert Emails
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add up to 4 email addresses to notify when agents book consultations for "{serviceName}". 
          These emails will receive immediate alerts with booking details.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">How it works:</h4>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• When an agent books a consultation, ALL these emails receive an instant alert</li>
                <li>• Emails include client contact info and scheduled time</li>
                <li>• This ensures you never miss a booking opportunity</li>
                <li>• Leave empty to disable email notifications for this service</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {emails.map((email, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor={`email-${index}`} className="text-sm">
                  Alert Email {index + 1}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="Enter email address"
                    className={`
                      ${email.trim() && !isValidEmail(email.trim()) ? 'border-red-500' : ''}
                    `}
                  />
                  <div className="flex items-center gap-1">
                    {email.trim() && isValidEmail(email.trim()) && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {emails.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmailField(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {email.trim() && !isValidEmail(email.trim()) && (
                  <p className="text-sm text-red-600 mt-1">Please enter a valid email address</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {emails.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmailField}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Email ({emails.length}/4)
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleSave}
            disabled={saving || emails.some(email => email.trim() && !isValidEmail(email.trim()))}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Emails'}
          </Button>
        </div>

        {getValidEmails().length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Active Alert Recipients:</h4>
            <div className="flex flex-wrap gap-2">
              {getValidEmails().map((email, index) => (
                <Badge key={index} variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {email.trim()}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-green-700 mt-2">
              {getValidEmails().length} email{getValidEmails().length !== 1 ? 's' : ''} will receive consultation alerts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
