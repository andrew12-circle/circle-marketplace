// FILE: src/components/security/PowGate.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, Cpu, CheckCircle, AlertCircle } from 'lucide-react';
import { proofOfWork, type PowChallenge, type PowSolution } from '@/lib/anti-bot/proof-of-work';
import { supabase } from '@/integrations/supabase/client';

interface PowGateProps {
  onSuccess: (workToken: string) => void;
  onError?: (error: string) => void;
  difficulty?: number;
  className?: string;
}

export function PowGate({
  onSuccess,
  onError,
  difficulty = 20,
  className = ''
}: PowGateProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'solving' | 'verifying' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [challenge, setChallenge] = useState<PowChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  useEffect(() => {
    if (status === 'solving' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(95, (elapsed / estimatedTime) * 100);
        setProgress(progressPercent);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [status, startTime, estimatedTime]);

  const startChallenge = async () => {
    setStatus('loading');
    setError(null);
    setProgress(0);

    try {
      // Get challenge from server
      const { data, error: challengeError } = await supabase.functions.invoke('pow-challenge', {
        body: { action: 'generate', difficulty }
      });

      if (challengeError) throw challengeError;
      if (!data?.challenge) throw new Error('No challenge received');

      const newChallenge = data.challenge;
      setChallenge(newChallenge);
      
      // Estimate solve time
      const estimatedMs = proofOfWork.getEstimatedSolveTime(difficulty);
      setEstimatedTime(estimatedMs);
      
      setStatus('solving');
      setStartTime(Date.now());

      // Solve challenge
      const solution = await proofOfWork.solveChallenge(newChallenge);
      
      if (!solution) {
        throw new Error('Failed to solve challenge');
      }

      setProgress(100);
      setStatus('verifying');

      // Verify solution with server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('pow-challenge', {
        body: {
          action: 'verify',
          solution,
          challengeId: newChallenge.challengeId
        }
      });

      if (verifyError) throw verifyError;
      if (!verifyData?.workToken) throw new Error('Verification failed');

      setStatus('success');
      
      // Store work token for future requests
      sessionStorage.setItem('workToken', verifyData.workToken);
      sessionStorage.setItem('workTokenExpiry', verifyData.expiresAt.toString());
      
      onSuccess(verifyData.workToken);

    } catch (err) {
      console.error('PoW challenge failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setChallenge(null);
    setStartTime(null);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'solving':
        return <Cpu className="h-5 w-5 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Preparing security challenge...';
      case 'solving':
        return 'Solving computational challenge...';
      case 'verifying':
        return 'Verifying solution...';
      case 'success':
        return 'Challenge completed successfully!';
      case 'error':
        return 'Challenge failed';
      default:
        return 'Ready to start security verification';
    }
  };

  const getTimeEstimate = () => {
    if (difficulty <= 16) return 'a few seconds';
    if (difficulty <= 20) return '10-30 seconds';
    if (difficulty <= 24) return '1-2 minutes';
    return 'several minutes';
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">Proof of Work Verification</span>
          </div>

          <p className="text-sm text-muted-foreground">
            {getStatusText()}
          </p>

          {status === 'idle' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                This will take approximately {getTimeEstimate()} to complete.
              </p>
              <Button onClick={startChallenge} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Start Verification
              </Button>
            </div>
          )}

          {(status === 'loading' || status === 'solving' || status === 'verifying') && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <Progress value={100} className="w-full" />
              <p className="text-xs text-green-600">
                Verification completed! You may now proceed.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={handleRetry} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              This computational challenge helps protect against automated abuse.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}