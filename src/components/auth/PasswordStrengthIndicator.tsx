import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePasswordStrength } from '@/hooks/useSecureInput';
import { Shield, ShieldCheck, ShieldX } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange?: (isStrong: boolean) => void;
}

export const PasswordStrengthIndicator = ({ 
  password, 
  onStrengthChange 
}: PasswordStrengthIndicatorProps) => {
  const [strength, setStrength] = useState({
    isStrong: false,
    score: 0,
    maxScore: 6,
    feedback: [] as string[]
  });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const validatePassword = async () => {
      if (!password) {
        setStrength({ isStrong: false, score: 0, maxScore: 6, feedback: [] });
        onStrengthChange?.(false);
        return;
      }

      setIsValidating(true);
      try {
        const result = await validatePasswordStrength(password);
        setStrength(result);
        onStrengthChange?.(result.isStrong);
      } catch (error) {
        console.error('Password validation error:', error);
        setStrength({ isStrong: false, score: 0, maxScore: 6, feedback: ['Unable to validate password'] });
        onStrengthChange?.(false);
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce validation
    const timer = setTimeout(validatePassword, 300);
    return () => clearTimeout(timer);
  }, [password, onStrengthChange]);

  if (!password) return null;

  const progressValue = (strength.score / strength.maxScore) * 100;
  const strengthLevel = strength.score <= 2 ? 'weak' : strength.score <= 4 ? 'medium' : 'strong';
  
  const getStrengthColor = () => {
    if (strengthLevel === 'weak') return 'text-destructive';
    if (strengthLevel === 'medium') return 'text-warning';
    return 'text-success';
  };

  const getStrengthIcon = () => {
    if (strengthLevel === 'weak') return <ShieldX className="h-4 w-4 text-destructive" />;
    if (strengthLevel === 'medium') return <Shield className="h-4 w-4 text-warning" />;
    return <ShieldCheck className="h-4 w-4 text-success" />;
  };

  const getProgressColor = () => {
    if (strengthLevel === 'weak') return 'bg-destructive';
    if (strengthLevel === 'medium') return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {getStrengthIcon()}
        <span className={`text-sm font-medium ${getStrengthColor()}`}>
          {isValidating ? 'Checking...' : `Password Strength: ${strengthLevel.charAt(0).toUpperCase() + strengthLevel.slice(1)}`}
        </span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
        style={{
          '--progress-color': `hsl(var(--${strengthLevel === 'weak' ? 'destructive' : strengthLevel === 'medium' ? 'warning' : 'success'}))`
        } as React.CSSProperties}
      />
      
      <div className="text-xs text-muted-foreground">
        Score: {strength.score}/{strength.maxScore}
      </div>

      {strength.feedback.length > 0 && (
        <Alert variant={strength.isStrong ? "default" : "destructive"}>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {strength.feedback.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};