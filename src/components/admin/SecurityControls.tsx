// FILE: src/components/admin/SecurityControls.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityControlsProps {
  onUpdate: () => void;
}

export function SecurityControls({ onUpdate }: SecurityControlsProps) {
  const [underAttack, setUnderAttack] = useState(false);
  const [captchaAlways, setCaptchaAlways] = useState(false);
  const [powEnforce, setPowEnforce] = useState(true);
  const [closeSignups, setCloseSignups] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (key: string, value: boolean) => {
    toast({
      title: "Security Setting Updated",
      description: `${key} has been ${value ? 'enabled' : 'disabled'}.`,
    });
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="under-attack">Under Attack Mode</Label>
            <Switch
              id="under-attack"
              checked={underAttack}
              onCheckedChange={(checked) => {
                setUnderAttack(checked);
                handleToggle('Under Attack Mode', checked);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="captcha-always">Always Require CAPTCHA</Label>
            <Switch
              id="captcha-always"
              checked={captchaAlways}
              onCheckedChange={(checked) => {
                setCaptchaAlways(checked);
                handleToggle('CAPTCHA Always On', checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pow-enforce">Enforce Proof of Work</Label>
            <Switch
              id="pow-enforce"
              checked={powEnforce}
              onCheckedChange={(checked) => {
                setPowEnforce(checked);
                handleToggle('Proof of Work Enforcement', checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="close-signups">Close Signups</Label>
            <Switch
              id="close-signups"
              checked={closeSignups}
              onCheckedChange={(checked) => {
                setCloseSignups(checked);
                handleToggle('Close Signups', checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Emergency Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="destructive" className="w-full">
              Activate Panic Mode
            </Button>
            <Button variant="outline" className="w-full">
              Clear All Blocks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}