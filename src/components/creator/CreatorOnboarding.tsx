import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Video, 
  User, 
  FileText, 
  Star,
  ArrowRight,
  Upload,
  ExternalLink,
  Plus,
  X,
  Shield,
  CreditCard
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  completed: boolean;
}

interface OnboardingData {
  basicInfo: {
    bio: string;
    experience_years: number;
    specialties: string[];
  };
  verification: {
    social_links: Record<string, string>;
    portfolio_links: string[];
    sample_content_urls: string[];
  };
}

const CreatorBasicInfo = ({ data, onUpdate, onNext }: any) => {
  const [formData, setFormData] = useState(data.basicInfo || {
    bio: '',
    experience_years: 0,
    specialties: []
  });
  const [newSpecialty, setNewSpecialty] = useState('');

  const specialtyOptions = [
    'Real Estate', 'Marketing', 'Sales', 'Lead Generation', 'Social Media',
    'Technology', 'Finance', 'Leadership', 'Training', 'Business Development'
  ];

  const addSpecialty = () => {
    if (newSpecialty && !formData.specialties.includes(newSpecialty)) {
      const updated = {
        ...formData,
        specialties: [...formData.specialties, newSpecialty]
      };
      setFormData(updated);
      onUpdate({ basicInfo: updated });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    const updated = {
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    };
    setFormData(updated);
    onUpdate({ basicInfo: updated });
  };

  const handleChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate({ basicInfo: updated });
  };

  const canProceed = formData.bio && formData.experience_years > 0 && formData.specialties.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="bio">Professional Bio *</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="Tell us about your expertise and what you can teach others..."
          rows={4}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="experience">Years of Experience *</Label>
        <Select 
          value={formData.experience_years.toString()} 
          onValueChange={(value) => handleChange('experience_years', parseInt(value))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1-2 years</SelectItem>
            <SelectItem value="3">3-5 years</SelectItem>
            <SelectItem value="6">6-10 years</SelectItem>
            <SelectItem value="11">11-15 years</SelectItem>
            <SelectItem value="16">15+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Specialties *</Label>
        <div className="mt-2 space-y-3">
          <div className="flex gap-2">
            <Select value={newSpecialty} onValueChange={setNewSpecialty}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialtyOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={addSpecialty} disabled={!newSpecialty}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.specialties.map(specialty => (
              <Badge key={specialty} variant="secondary" className="gap-1">
                {specialty}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeSpecialty(specialty)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={onNext} disabled={!canProceed} className="w-full">
        Continue <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

const CreatorVerification = ({ data, onUpdate, onNext }: any) => {
  const [formData, setFormData] = useState(data.verification || {
    social_links: {},
    portfolio_links: [],
    sample_content_urls: []
  });
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [newSampleUrl, setNewSampleUrl] = useState('');

  const socialPlatforms = [
    { key: 'youtube', label: 'YouTube', placeholder: 'Your YouTube channel URL' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'Your LinkedIn profile URL' },
    { key: 'instagram', label: 'Instagram', placeholder: 'Your Instagram profile URL' },
    { key: 'tiktok', label: 'TikTok', placeholder: 'Your TikTok profile URL' },
    { key: 'website', label: 'Website', placeholder: 'Your professional website URL' }
  ];

  const updateSocialLink = (platform: string, url: string) => {
    const updated = {
      ...formData,
      social_links: { ...formData.social_links, [platform]: url }
    };
    setFormData(updated);
    onUpdate({ verification: updated });
  };

  const addPortfolioLink = () => {
    if (newPortfolioLink) {
      const updated = {
        ...formData,
        portfolio_links: [...formData.portfolio_links, newPortfolioLink]
      };
      setFormData(updated);
      onUpdate({ verification: updated });
      setNewPortfolioLink('');
    }
  };

  const removePortfolioLink = (index: number) => {
    const updated = {
      ...formData,
      portfolio_links: formData.portfolio_links.filter((_, i) => i !== index)
    };
    setFormData(updated);
    onUpdate({ verification: updated });
  };

  const addSampleUrl = () => {
    if (newSampleUrl) {
      const updated = {
        ...formData,
        sample_content_urls: [...formData.sample_content_urls, newSampleUrl]
      };
      setFormData(updated);
      onUpdate({ verification: updated });
      setNewSampleUrl('');
    }
  };

  const removeSampleUrl = (index: number) => {
    const updated = {
      ...formData,
      sample_content_urls: formData.sample_content_urls.filter((_, i) => i !== index)
    };
    setFormData(updated);
    onUpdate({ verification: updated });
  };

  const hasMinimumInfo = 
    Object.keys(formData.social_links).some(key => formData.social_links[key]) ||
    formData.portfolio_links.length > 0 ||
    formData.sample_content_urls.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Social Media Profiles</h4>
        <div className="space-y-3">
          {socialPlatforms.map(platform => (
            <div key={platform.key}>
              <Label htmlFor={platform.key}>{platform.label}</Label>
              <Input
                id={platform.key}
                value={formData.social_links[platform.key] || ''}
                onChange={(e) => updateSocialLink(platform.key, e.target.value)}
                placeholder={platform.placeholder}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Portfolio Links</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newPortfolioLink}
              onChange={(e) => setNewPortfolioLink(e.target.value)}
              placeholder="Add portfolio or work sample URL"
              className="flex-1"
            />
            <Button type="button" onClick={addPortfolioLink} disabled={!newPortfolioLink}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.portfolio_links.map((link, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{link}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePortfolioLink(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Sample Content URLs</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newSampleUrl}
              onChange={(e) => setNewSampleUrl(e.target.value)}
              placeholder="Add sample video, podcast, or content URL"
              className="flex-1"
            />
            <Button type="button" onClick={addSampleUrl} disabled={!newSampleUrl}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.sample_content_urls.map((url, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <Video className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{url}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSampleUrl(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={onNext} disabled={!hasMinimumInfo} className="w-full">
        Submit for Review <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

const CreatorPaymentStep = ({ data, onUpdate, onNext }: any) => {
  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Payment Setup Required</h3>
        <p className="text-muted-foreground">
          Complete your payment setup to start earning from your content
        </p>
      </div>
      
      <Alert>
        <Shield className="w-4 h-4" />
        <AlertDescription>
          <strong>Important:</strong> Payment setup is required before you can upload content or receive earnings. 
          This ensures all creators meet our payment standards for automated monthly payouts.
        </AlertDescription>
      </Alert>
      
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Payment Setup Requirements:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Stripe Connect account verification</li>
          <li>• Tax information (W-9/W-8)</li>
          <li>• Bank account verification</li>
          <li>• Identity verification</li>
        </ul>
      </div>
      
      <Button 
        onClick={() => {
          onUpdate({ paymentSetup: { completed: true } });
          onNext();
        }} 
        className="w-full"
      >
        Continue to Payment Setup <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

const CreatorWelcome = ({ onNext }: any) => (
  <div className="text-center space-y-6">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
      <Star className="w-8 h-8 text-primary" />
    </div>
    <div>
      <h3 className="text-2xl font-bold mb-2">Become a Creator</h3>
      <p className="text-muted-foreground">
        Join our creator program and start earning from your expertise. 
        Share your knowledge and build your audience.
      </p>
    </div>
    <div className="bg-muted p-4 rounded-lg">
      <h4 className="font-medium mb-2">What you'll get:</h4>
      <ul className="text-sm text-muted-foreground space-y-1">
        <li>• 25% revenue share on all content sales</li>
        <li>• Professional creator dashboard</li>
        <li>• Analytics and insights</li>
        <li>• Direct fan engagement tools</li>
        <li>• Marketing support</li>
      </ul>
    </div>
    <Button onClick={onNext} className="w-full">
      Get Started <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

export const CreatorOnboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    basicInfo: { bio: '', experience_years: 0, specialties: [] },
    verification: { social_links: {}, portfolio_links: [], sample_content_urls: [] }
  });
  const [loading, setLoading] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Welcome',
      description: 'Learn about our creator program',
      component: CreatorWelcome,
      completed: false
    },
    {
      id: 1,
      title: 'Basic Info',
      description: 'Tell us about your expertise',
      component: CreatorBasicInfo,
      completed: false
    },
    {
      id: 2,
      title: 'Verification',
      description: 'Submit verification materials',
      component: CreatorVerification,
      completed: false
    },
    {
      id: 3,
      title: 'Payment Setup',
      description: 'Setup payments to start earning',
      component: CreatorPaymentStep,
      completed: false
    }
  ];

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update profile with creator info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_creator: true,
          creator_bio: onboardingData.basicInfo.bio,
          specialties: onboardingData.basicInfo.specialties,
          years_experience: onboardingData.basicInfo.experience_years,
          creator_social_links: onboardingData.verification.social_links,
          creator_joined_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create verification request
      const { error: verificationError } = await supabase
        .from('creator_verification_requests')
        .insert({
          user_id: user.id,
          social_links: onboardingData.verification.social_links,
          portfolio_links: onboardingData.verification.portfolio_links,
          bio: onboardingData.basicInfo.bio,
          experience_years: onboardingData.basicInfo.experience_years,
          specialties: onboardingData.basicInfo.specialties,
          sample_content_urls: onboardingData.verification.sample_content_urls,
          status: 'pending'
        });

      if (verificationError) throw verificationError;

      // Mark onboarding as complete
      const { error: onboardingError } = await supabase
        .from('creator_onboarding')
        .upsert({
          user_id: user.id,
          step: 3,
          completed_steps: [0, 1, 2] as any,
          onboarding_data: onboardingData as any,
          completed_at: new Date().toISOString()
        });

      if (onboardingError) throw onboardingError;

      toast({
        title: 'Application Submitted!',
        description: 'Your creator application has been submitted for review. You\'ll be notified once approved.',
      });

      // Redirect to payment setup page
      navigate('/creator-payment-setup');

    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit creator application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Creator Onboarding</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="mb-4" />
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                {index <= currentStep ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="hidden md:block">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};