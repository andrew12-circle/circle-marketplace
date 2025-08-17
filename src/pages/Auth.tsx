
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFunnelEvents } from "@/hooks/useFunnelEvents";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { trackSignupStart, trackSignupSuccess } = useFunnelEvents();
  const [authStarted, setAuthStarted] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Track authentication events
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        trackSignupSuccess();
      }
    });

    return () => subscription.unsubscribe();
  }, [trackSignupSuccess]);

  // Track when user starts signup process
  const handleAuthStart = () => {
    if (!authStarted) {
      trackSignupStart();
      setAuthStarted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Circle</CardTitle>
          <p className="text-gray-600">Sign in to your account or create a new one</p>
        </CardHeader>
        <CardContent>
          <div onClick={handleAuthStart}>
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(221.2 83.2% 53.3%)',
                      brandAccent: 'hsl(221.2 83.2% 53.3%)',
                    },
                  },
                },
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/auth`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
