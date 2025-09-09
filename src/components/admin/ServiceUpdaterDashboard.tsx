import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import BulkServiceResearch from './BulkServiceResearch';

export default function ServiceUpdaterDashboard() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'research' | 'update' | 'complete'>('research');

  const steps = [
    {
      id: 'research',
      title: 'Step 1: Generate Research',
      description: 'Create comprehensive research entries for all services',
      component: BulkServiceResearch,
      status: currentStep === 'research' ? 'active' : currentStep === 'update' || currentStep === 'complete' ? 'completed' : 'pending'
    },
    {
      id: 'update',
      title: 'Step 2: Update Service Content',
      description: 'Fill out service descriptions, pricing, and verification using research',
      status: currentStep === 'update' ? 'active' : currentStep === 'complete' ? 'completed' : 'pending'
    },
    {
      id: 'complete',
      title: 'Step 3: Verification Complete',
      description: 'All services updated and verified',
      status: currentStep === 'complete' ? 'completed' : 'pending'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'active': return <Clock className="h-5 w-5 text-blue-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'active': return <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service AI Update Dashboard</CardTitle>
          <CardDescription>
            Complete workflow to catch up all services with AI-generated content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{step.title}</h3>
                    {getStatusBadge(step.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
                {step.status === 'pending' && index > 0 && (
                  <Button 
                    onClick={() => setCurrentStep(step.id as any)}
                    disabled={steps[index - 1].status !== 'completed'}
                  >
                    Start
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Component */}
      {currentStep === 'research' && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Research Generator</CardTitle>
            <CardDescription>
              Generate comprehensive research for all services. Use mode "missing-only" and batch size 1-3.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkServiceResearch />
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Recommended Settings:</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Mode: "missing-only" (to avoid overwriting existing research)</li>
                <li>• Batch Size: 1-3 (to avoid timeouts)</li>
                <li>• Market Intelligence: Enable for better results</li>
                <li>• Run until all services have research entries</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'update' && (
        <Card>
          <CardHeader>
            <CardTitle>AI Service Updater</CardTitle>
            <CardDescription>
              Fill out service content using the generated research
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  toast({
                    title: "Starting AI Service Updater",
                    description: "Navigate to the AI Service Updater in the admin panel"
                  });
                  // In a real implementation, this would trigger the bulk AI service updater
                }}
                className="w-full"
              >
                Launch AI Service Updater
              </Button>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Next Steps:</h4>
                <ul className="text-sm text-green-800 mt-2 space-y-1">
                  <li>• Select all services that need updating</li>
                  <li>• Choose Background mode (since research is already generated)</li>
                  <li>• Enable overwrite if you want to refresh existing content</li>
                  <li>• Monitor the batch status for completion</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}