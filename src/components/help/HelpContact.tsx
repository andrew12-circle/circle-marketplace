import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HelpContactProps {
  currentRoute: string;
}

interface ContactForm {
  category: string;
  subject: string;
  message: string;
  email: string;
  name: string;
}

export const HelpContact: React.FC<HelpContactProps> = ({ currentRoute }) => {
  const [form, setForm] = useState<ContactForm>({
    category: '',
    subject: '',
    message: '',
    email: '',
    name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = [
    { value: 'technical', label: 'Technical Issue' },
    { value: 'account', label: 'Account Help' },
    { value: 'billing', label: 'Billing Question' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'general', label: 'General Question' }
  ];

  React.useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        email: user.email || '',
        name: user.user_metadata?.full_name || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.subject || !form.message || !form.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create context data
      const contextData = {
        currentRoute,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: user?.id,
        windowSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      // Send notification via edge function
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'support_request',
          data: {
            category: form.category,
            subject: form.subject,
            message: form.message,
            userEmail: form.email,
            userName: form.name,
            context: contextData
          }
        }
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Message Sent",
        description: "We've received your message and will respond within 24 hours.",
      });

      // Reset form after success
      setTimeout(() => {
        setIsSubmitted(false);
        setForm({
          category: '',
          subject: '',
          message: '',
          email: user?.email || '',
          name: user?.user_metadata?.full_name || ''
        });
      }, 3000);

    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="font-medium text-sm">Message Sent!</h3>
          <p className="text-xs text-muted-foreground">
            We'll get back to you within 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <form onSubmit={handleSubmit} className="p-3 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-xs font-medium">
            Category *
          </Label>
          <Select
            value={form.category}
            onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="text-xs">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-medium">
            Name *
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-medium">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            className="h-8 text-xs"
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject" className="text-xs font-medium">
            Subject *
          </Label>
          <Input
            id="subject"
            value={form.subject}
            onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Brief description of your issue"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-xs font-medium">
            Message *
          </Label>
          <Textarea
            id="message"
            value={form.message}
            onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Please describe your issue in detail..."
            className="min-h-[80px] text-xs resize-none"
          />
        </div>

        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Auto-attached context:</strong> Current page, browser info, and account details to help us assist you better.
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-8 text-xs"
        >
          {isSubmitting ? (
            <>Sending...</>
          ) : (
            <>
              <Send className="w-3 h-3 mr-1" />
              Send Message
            </>
          )}
        </Button>
      </form>
    </ScrollArea>
  );
};