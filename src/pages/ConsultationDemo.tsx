import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  BookOpen, 
  MessageSquare, 
  DollarSign,
  Clock,
  Star,
  Shield
} from 'lucide-react';
import { ConsultationFlow } from '@/components/marketplace/ConsultationFlow';

export const ConsultationDemo = () => {
  const [isFlowOpen, setIsFlowOpen] = useState(false);

  const demoService = {
    id: 'demo-consultation-service',
    title: 'Custom Marketing Campaign Strategy',
    vendor: {
      name: 'Pro Marketing Solutions'
    }
  };

  const features = [
    "Comprehensive market analysis",
    "Custom strategy development", 
    "Implementation roadmap",
    "6-month support included"
  ];

  const steps = [
    {
      icon: Calendar,
      title: "Book Consultation",
      description: "Schedule a 60-minute strategy session with our experts"
    },
    {
      icon: BookOpen,
      title: "Complete Preparation Course",
      description: "Learn key concepts to maximize your consultation value"
    },
    {
      icon: MessageSquare,
      title: "Strategy Session",
      description: "Collaborate with experts to design your custom solution"
    },
    {
      icon: CheckCircle,
      title: "Receive Proposal",
      description: "Get detailed pricing and timeline for your project"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Consultation-Based Service Demo</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience our consultation flow for services that require custom pricing and strategy development.
        </p>
      </div>

      {/* Service Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{demoService.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  Consultation Required
                </Badge>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Verified Provider</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">Starting from $2,500</div>
              <div className="text-sm text-muted-foreground">Final pricing after consultation</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">What's Included:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">Free 60-minute consultation</div>
                <div className="text-sm text-muted-foreground">No commitment required</div>
              </div>
            </div>
            <Button onClick={() => setIsFlowOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Book Consultation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Process Steps */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <step.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gray-200 transform translate-x-3" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Transparent Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Get accurate quotes based on your specific needs and budget
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Expert Guidance</h3>
            <p className="text-sm text-muted-foreground">
              Work directly with industry experts to design your solution
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Educational Prep</h3>
            <p className="text-sm text-muted-foreground">
              Learn key concepts before your consultation for better outcomes
            </p>
          </CardContent>
        </Card>
      </div>

      <ConsultationFlow
        isOpen={isFlowOpen}
        onClose={() => setIsFlowOpen(false)}
        service={demoService}
      />
    </div>
  );
};