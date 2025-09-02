import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSecurityGate } from '@/hooks/useSecurityGate';
import { TurnstileGate } from './TurnstileGate';
import { PowGate } from './PowGate';
import { SecureForm } from './SecureForm';

export function SecureActionExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { 
    loading, 
    gateResult, 
    submitWithGate, 
    handleCaptchaSuccess, 
    handlePowSuccess 
  } = useSecurityGate({
    endpoint: '/api/contact',
    onBlocked: () => {
      toast({
        title: "Access Blocked",
        description: "Your request has been blocked due to suspicious activity.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await submitWithGate(async () => {
        // Simulate API call
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
      });

      toast({
        title: "Success",
        description: "Your message has been sent successfully!",
      });
      
      // Reset form
      setFormData({ name: '', email: '', message: '' });
      
    } catch (error) {
      console.error('Submission error:', error);
      
      if (error instanceof Error && error.message.includes('Security gate required')) {
        // This will trigger the appropriate gate component to show
        return;
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show security gate if required
  if (gateResult?.gateRequired && gateResult.gateType === 'captcha') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Verification Required</CardTitle>
          <CardDescription>
            Please complete the verification to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TurnstileGate onSuccess={handleCaptchaSuccess} />
        </CardContent>
      </Card>
    );
  }

  if (gateResult?.gateRequired && gateResult.gateType === 'pow') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Challenge</CardTitle>
          <CardDescription>
            Solving computational challenge... This may take a few moments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PowGate onSuccess={handlePowSuccess} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Form</CardTitle>
        <CardDescription>
          Secure contact form with anti-bot protection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SecureForm onSubmit={handleSubmit} actionRoute="/api/contact" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || loading}
            className="w-full"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </SecureForm>
      </CardContent>
    </Card>
  );
}