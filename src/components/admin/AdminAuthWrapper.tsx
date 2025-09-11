import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthErrorHandler } from '@/utils/authErrorHandler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export const AdminAuthWrapper = ({ children }: AdminAuthWrapperProps) => {
  const { user, session, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Monitor for auth errors and session state
  useEffect(() => {
    const handleAuthError = async () => {
      if (!user || !session) {
        return;
      }

      // Check if session is expired by trying to make a simple request
      try {
        const { error } = await supabase.from('profiles').select('user_id').limit(1);
        
        if (error) {
          logger.warn('Auth verification failed:', error);
          
          // Check if it's an auth-related error
          const isAuthError = error.message?.includes('JWT') || 
                             error.message?.includes('session') ||
                             error.message?.includes('token') ||
                             error.code === '401';
          
          if (isAuthError) {
            setAuthError(error.message);
          }
        } else {
          // Clear any previous auth errors if request succeeds
          setAuthError(null);
        }
      } catch (error) {
        logger.error('Auth verification exception:', error);
        setAuthError('Session verification failed');
      }
    };

    // Only check auth if we have a user and session
    if (user && session && !loading) {
      handleAuthError();
      
      // Set up periodic auth verification for admin routes
      const interval = setInterval(handleAuthError, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user, session, loading]);

  // Handle session recovery
  const handleRecovery = async () => {
    setIsRecovering(true);
    setAuthError(null);
    
    try {
      const recovered = await AuthErrorHandler.manualSessionRecovery();
      
      if (recovered) {
        toast.success('Session recovered successfully');
        setAuthError(null);
      } else {
        setAuthError('Session recovery failed. Please sign in again.');
      }
    } catch (error) {
      logger.error('Recovery attempt failed:', error);
      setAuthError('Recovery failed. Please sign in again.');
    } finally {
      setIsRecovering(false);
    }
  };

  // Force sign out and redirect
  const handleForceSignOut = () => {
    AuthErrorHandler['forceSignOut']?.();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show auth error recovery interface
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle className="text-destructive">
              Authentication Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Admin session has encountered an issue:</p>
              <p className="text-xs font-mono bg-muted p-2 rounded">
                {authError}
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleRecovery}
                disabled={isRecovering}
                className="w-full"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Recovering Session...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Try to Recover Session
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleForceSignOut}
                className="w-full"
              >
                Sign Out & Restart
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground text-center mt-4">
              <p>This admin panel has enhanced session monitoring to prevent data loss.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no user or session, show sign in required
  if (!user || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in to access the admin panel.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children if everything is OK
  return <>{children}</>;
};

// Import supabase for auth checks
import { supabase } from '@/integrations/supabase/client';