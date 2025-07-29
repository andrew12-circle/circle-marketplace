import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Users, 
  DollarSign, 
  Mail, 
  ArrowRight, 
  CheckCircle,
  UserPlus,
  Search
} from 'lucide-react';

interface CoPayFlowProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: Array<{
    serviceId: string;
    title: string;
    vendor: string;
    price: number;
    quantity: number;
  }>;
}

type FlowStep = 'explanation' | 'ssp-choice' | 'invite-ssp' | 'select-approved' | 'complete';

export const CoPayFlow = ({ isOpen, onClose, cartItems }: CoPayFlowProps) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('explanation');
  const [selectedSSP, setSelectedSSP] = useState('');
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const coPayAmount = totalAmount * 0.2; // 20% co-pay
  const insuranceCoverage = totalAmount - coPayAmount;

  const approvedSSPs = [
    { id: '1', name: 'HealthCare Partners', specialty: 'Primary Care', rating: 4.8 },
    { id: '2', name: 'WellnessCorp', specialty: 'Preventive Care', rating: 4.9 },
    { id: '3', name: 'MedCare Solutions', specialty: 'Specialist Care', rating: 4.7 },
  ];

  const handleInviteSSP = () => {
    // TODO: Send invitation email to SSP
    console.log('Inviting SSP:', inviteData);
    setCurrentStep('complete');
  };

  const handleSelectApprovedSSP = () => {
    if (selectedSSP) {
      setCurrentStep('complete');
    }
  };

  const handleClose = () => {
    setCurrentStep('explanation');
    setSelectedSSP('');
    setInviteData({ name: '', email: '', company: '', message: '' });
    onClose();
  };

  const renderExplanation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Circle Co-Pay Program</h3>
        <p className="text-muted-foreground">
          Get 80% of your services covered through our partner network
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Your Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Total Service Cost:</span>
              <span className="font-semibold">${totalAmount}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Insurance Coverage (80%):</span>
              <span className="font-semibold">-${insuranceCoverage}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Your Co-Pay (20%):</span>
              <span>${coPayAmount}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold">Protected Coverage</h4>
              <p className="text-sm text-muted-foreground">80% covered by insurance</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold">Quality Network</h4>
              <p className="text-sm text-muted-foreground">Vetted service providers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold">Easy Process</h4>
              <p className="text-sm text-muted-foreground">Streamlined claims</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => setCurrentStep('ssp-choice')} className="flex-1">
          Continue with Co-Pay
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderSSPChoice = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Choose Your Service Provider</h3>
        <p className="text-muted-foreground">
          Select from our approved network or invite your preferred provider
        </p>
      </div>

      <div className="grid gap-4">
        <Button 
          onClick={() => setCurrentStep('select-approved')}
          className="h-auto p-4 justify-start"
        >
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Browse Approved Providers</div>
              <div className="text-sm opacity-90">Choose from our vetted network</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto" />
        </Button>

        <Button 
          variant="outline"
          onClick={() => setCurrentStep('invite-ssp')}
          className="h-auto p-4 justify-start"
        >
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Invite Your Provider</div>
              <div className="text-sm text-muted-foreground">Bring your preferred service provider</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto" />
        </Button>
      </div>

      <Button variant="ghost" onClick={() => setCurrentStep('explanation')} className="w-full">
        Back
      </Button>
    </div>
  );

  const renderInviteSSP = () => (
    <div className="space-y-6">
      <div className="text-center">
        <UserPlus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Invite Your Service Provider</h3>
        <p className="text-muted-foreground">
          We'll send them information about joining our network
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ssp-name">Provider Name</Label>
            <Input
              id="ssp-name"
              value={inviteData.name}
              onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
              placeholder="Dr. John Smith"
            />
          </div>
          <div>
            <Label htmlFor="ssp-email">Email Address</Label>
            <Input
              id="ssp-email"
              type="email"
              value={inviteData.email}
              onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
              placeholder="doctor@example.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="ssp-company">Company/Practice</Label>
          <Input
            id="ssp-company"
            value={inviteData.company}
            onChange={(e) => setInviteData({...inviteData, company: e.target.value})}
            placeholder="Smith Medical Practice"
          />
        </div>

        <div>
          <Label htmlFor="ssp-message">Personal Message (Optional)</Label>
          <Textarea
            id="ssp-message"
            value={inviteData.message}
            onChange={(e) => setInviteData({...inviteData, message: e.target.value})}
            placeholder="Hi Dr. Smith, I'd like to use your services through the Circle network..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleInviteSSP}
          disabled={!inviteData.name || !inviteData.email}
          className="flex-1"
        >
          <Mail className="w-4 h-4 mr-2" />
          Send Invitation
        </Button>
        <Button variant="outline" onClick={() => setCurrentStep('ssp-choice')}>
          Back
        </Button>
      </div>
    </div>
  );

  const renderSelectApproved = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Approved Service Providers</h3>
        <p className="text-muted-foreground">
          Choose from our verified network of providers
        </p>
      </div>

      <div className="space-y-3">
        {approvedSSPs.map((ssp) => (
          <Card 
            key={ssp.id}
            className={`cursor-pointer border-2 transition-colors ${
              selectedSSP === ssp.id ? 'border-blue-500 bg-blue-50' : 'border-border hover:border-blue-300'
            }`}
            onClick={() => setSelectedSSP(ssp.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{ssp.name}</h4>
                  <p className="text-sm text-muted-foreground">{ssp.specialty}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{ssp.rating} ★</Badge>
                  {selectedSSP === ssp.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-1 ml-auto" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleSelectApprovedSSP}
          disabled={!selectedSSP}
          className="flex-1"
        >
          Select Provider
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button variant="outline" onClick={() => setCurrentStep('ssp-choice')}>
          Back
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
      <div>
        <h3 className="text-xl font-semibold mb-2">Co-Pay Request Submitted!</h3>
        <p className="text-muted-foreground">
          We're processing your co-pay request. You'll receive confirmation within 24 hours.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Service Cost:</span>
              <span>${totalAmount}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Insurance Coverage:</span>
              <span>-${insuranceCoverage}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Your Co-Pay:</span>
              <span>${coPayAmount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleClose} className="w-full">
        Continue
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Circle Co-Pay Flow</DialogTitle>
        </DialogHeader>

        {currentStep === 'explanation' && renderExplanation()}
        {currentStep === 'ssp-choice' && renderSSPChoice()}
        {currentStep === 'invite-ssp' && renderInviteSSP()}
        {currentStep === 'select-approved' && renderSelectApproved()}
        {currentStep === 'complete' && renderComplete()}
      </DialogContent>
    </Dialog>
  );
};