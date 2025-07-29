import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  MessageCircle,
  DollarSign,
  FileText
} from 'lucide-react';

interface ConsultationExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    vendor: {
      name: string;
    };
    price: string;
  };
  onBookConsultation: () => void;
}

export const ConsultationExplanationModal = ({ 
  isOpen, 
  onClose, 
  service, 
  onBookConsultation 
}: ConsultationExplanationModalProps) => {
  const benefits = [
    {
      icon: DollarSign,
      title: "Accurate Pricing",
      description: "Get a customized quote based on your specific needs and requirements"
    },
    {
      icon: Users,
      title: "Expert Matching", 
      description: "We'll match you with the right specialist for your unique situation"
    },
    {
      icon: FileText,
      title: "Detailed Planning",
      description: "Receive a comprehensive plan tailored to your goals and timeline"
    },
    {
      icon: CheckCircle,
      title: "Quality Assurance",
      description: "Ensure the service meets your expectations before committing"
    }
  ];

  const process = [
    {
      step: 1,
      title: "Book Consultation",
      description: "Schedule a free consultation with the service provider",
      icon: Calendar
    },
    {
      step: 2, 
      title: "Take Prep Course",
      description: "Complete a short preparation course to maximize your consultation",
      icon: FileText
    },
    {
      step: 3,
      title: "Meet with Expert",
      description: "Discuss your needs and receive a customized proposal",
      icon: MessageCircle
    },
    {
      step: 4,
      title: "Receive Final Quote",
      description: "Get accurate pricing and move forward with confidence",
      icon: CheckCircle
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Why This Service Requires a Consultation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{service.title}</h3>
                  <p className="text-muted-foreground">by {service.vendor.name}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    Consultation Required
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {service.price && parseFloat(service.price) > 0 
                      ? `Starting at $${service.price}` 
                      : "Custom pricing based on your needs"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explanation */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Why a consultation is needed:</h3>
            <p className="text-muted-foreground mb-4">
              This service is highly customized and requires understanding your specific situation, 
              goals, and requirements before providing accurate pricing and service details. A consultation 
              ensures you receive exactly what you need and helps avoid mismatched expectations.
            </p>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Benefits of the consultation process:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process */}
          <div>
            <h3 className="font-semibold text-lg mb-4">How it works:</h3>
            <div className="space-y-4">
              {process.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time commitment */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-800">Time Commitment</span>
              </div>
              <p className="text-sm text-orange-700">
                The entire process typically takes 2-3 days from booking to receiving your final quote. 
                The consultation itself is usually 30-60 minutes, and the prep course takes about 15-20 minutes.
              </p>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={onBookConsultation} className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Book Free Consultation
            </Button>
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};