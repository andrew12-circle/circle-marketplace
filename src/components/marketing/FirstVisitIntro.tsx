import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useABTest } from '@/hooks/useABTest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Users, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'circle_intro_seen_v1';
const EXPIRY_DAYS = 90;

export function FirstVisitIntro() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { variant } = useABTest('first_visit_intro_v1', { holdout: 0.3 });
  
  const [open, setOpen] = useState(() => {
    // Don't show if user is logged in
    if (user) return false;
    
    // Don't show if not on root route
    if (window.location.pathname !== '/') return false;
    
    // Check if we've shown it before
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { timestamp } = JSON.parse(stored);
        const now = Date.now();
        const expiry = timestamp + (EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        if (now < expiry) return false; // Still within expiry period
      }
    } catch {
      // Ignore localStorage errors
    }
    
    return true;
  });

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleSignUp = () => {
    handleClose();
    navigate('/auth');
  };

  const handleLearnMore = () => {
    handleClose();
    // Scroll to marketplace content or keep on current page
  };

  // Don't render for holdout group
  if (variant === 'holdout') return null;
  
  // Don't render if not open or user is logged in
  if (!open || user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-circle-accent rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <Badge variant="secondary" className="text-xs">
              {t('intro.newBadge')}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-semibold text-left">
            {t('intro.headline')}
          </DialogTitle>
          <DialogDescription className="text-left text-muted-foreground">
            {t('intro.subheadline')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-circle-success mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">{t('intro.benefit1Title')}</h4>
              <p className="text-xs text-muted-foreground">{t('intro.benefit1Desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">{t('intro.benefit2Title')}</h4>
              <p className="text-xs text-muted-foreground">{t('intro.benefit2Desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-circle-accent mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">{t('intro.benefit3Title')}</h4>
              <p className="text-xs text-muted-foreground">{t('intro.benefit3Desc')}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleLearnMore} className="w-full sm:w-auto">
            {t('intro.learnMore')}
          </Button>
          <Button onClick={handleSignUp} className="w-full sm:w-auto">
            {t('intro.getStarted')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
