// @ts-nocheck
import { useState, useEffect } from "react";
import { useUserRegistration } from "@/hooks/useUserRegistration";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Mail, Lock, User, Briefcase } from "lucide-react";
import { SecureForm } from "@/components/common/SecureForm";
import { commonRules, checkAccountLockout, clearFailedAttempts } from "@/hooks/useSecureInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { AccountLockoutAlert } from "@/components/auth/AccountLockoutAlert";

const circleLogoUrl = "/circle-logo-updated.png";

export const Auth = () => {
  useUserRegistration(); // Apply spiritual coverage for user registration
  const [isLogin, setIsLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    return mode !== 'signup';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [lockoutStatus, setLockoutStatus] = useState({
    isLocked: false,
    attemptsRemaining: 5,
    timeRemainingSeconds: 0
  });
  const [passwordStrong, setPasswordStrong] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      console.log('Checking user session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session check result:', { session: !!session, error });
      if (session) {
        console.log('User already logged in, redirecting to home');
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  };

  const handleSignUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });

    if (error) throw error;
    return data;
  };

  const handleForgotPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) throw error;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    console.log('Starting Google sign-in...');
    
    // Check if we're in Lovable preview environment
    const isLovablePreview = window.location.hostname.includes('lovable.app');
    
    if (isLovablePreview) {
      toast({
        title: "Google Sign-In Unavailable",
        description: "Google OAuth is not available in preview. Use email/password to test authentication.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    try {
      console.log('Redirect URL:', `${window.location.origin}/`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }
      console.log('Google OAuth initiated successfully');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Check account lockout status when email changes
  useEffect(() => {
    const checkLockout = async () => {
      if (formData.email && isLogin) {
        try {
          const status = await checkAccountLockout(formData.email);
          setLockoutStatus(status);
        } catch (error) {
          console.error('Error checking account lockout:', error);
        }
      }
    };

    const timer = setTimeout(checkLockout, 500);
    return () => clearTimeout(timer);
  }, [formData.email, isLogin]);

  const handleSecureSubmit = async (data: Record<string, string>) => {
    setLoading(true);

    try {
      // Check lockout status before attempting login
      if (isLogin) {
        const lockoutCheck = await checkAccountLockout(data.email);
        if (lockoutCheck.isLocked) {
          toast({
            title: "Account Locked",
            description: `Account is temporarily locked. Try again in ${Math.ceil(lockoutCheck.timeRemainingSeconds / 60)} minutes.`,
            variant: "destructive",
          });
          setLockoutStatus(lockoutCheck);
          return;
        }
      }

      // Validate password strength for signup
      if (!isLogin && !passwordStrong) {
        toast({
          title: "Weak Password",
          description: "Please choose a stronger password that meets all requirements.",
          variant: "destructive",
        });
        return;
      }

      if (isLogin) {
        await handleLogin(data.email, data.password);
        // Clear failed attempts on successful login
        await clearFailedAttempts(data.email);
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
        navigate('/');
      } else {
        const { user } = await handleSignUp(
          data.email, 
          data.password, 
          data.displayName || ''
        );
        
        if (user) {
          toast({
            title: "Account created!",
            description: "Welcome! Check your email to verify your account.",
          });
        }
      }
    } catch (error: any) {
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials.";
        // Update lockout status after failed login
        if (isLogin && data.email) {
          setTimeout(async () => {
            try {
              const status = await checkAccountLockout(data.email);
              setLockoutStatus(status);
            } catch (err) {
              console.error('Error updating lockout status:', err);
            }
          }, 100);
        }
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Try logging in instead.";
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = "Password should be at least 8 characters long.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; // Re-throw to let SecureForm handle it
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (data: Record<string, string>) => {
    setLoading(true);
    
    try {
      await handleForgotPassword(data.email);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      let errorMessage = "Failed to send reset email. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validationRules = showForgotPassword
    ? { email: commonRules.email }
    : isLogin 
    ? {
        email: commonRules.email,
        password: { required: true, minLength: 8 }
      }
    : {
        email: commonRules.email,
        password: commonRules.password,
        displayName: commonRules.name,
      };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowForgotPassword(false);
    setFormData({ email: '', password: '', displayName: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background removed for better performance */}
      
      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm border-white/20">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/circle-logo-updated.png"
              alt="Circle Logo" 
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              width="112"
              height="112"
              style={{
                imageRendering: 'crisp-edges'
              }}
            />
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {showForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {showForgotPassword 
                ? 'Enter your email to receive reset instructions'
                : isLogin 
                ? 'Sign in to your account to continue' 
                : 'Sign up to start your journey with Circle Academy'
              }
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {/* Account Lockout Alert */}
          {isLogin && (
            <AccountLockoutAlert
              isLocked={lockoutStatus.isLocked}
              timeRemainingSeconds={lockoutStatus.timeRemainingSeconds}
              attemptsRemaining={lockoutStatus.attemptsRemaining}
            />
          )}
          
          {/* Google Sign-In (Only for Login and Signup, not Forgot Password) */}
          {!showForgotPassword && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full mb-6"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {loading ? 'Signing in...' : `Continue with Google`}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}
          
          <SecureForm 
            validationRules={validationRules}
            onSubmit={showForgotPassword ? handleForgotPasswordSubmit : handleSecureSubmit}
            className="space-y-4"
            requireCSRF={false}
          >
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Display Name Field (Signup only) */}
            {!isLogin && !showForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Field (Not shown for forgot password) */}
            {!showForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {/* Password Strength Indicator (Signup only) */}
                {!isLogin && (
                  <PasswordStrengthIndicator
                    password={formData.password}
                    onStrengthChange={setPasswordStrong}
                  />
                )}
              </div>
            )}


            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Loading...' : (
                showForgotPassword ? 'Send Reset Email' : 
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
            
            {/* Forgot Password Link (Login only) */}
            {isLogin && !showForgotPassword && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                >
                  Forgot your password?
                </Button>
              </div>
            )}
            
            {/* Back to Login Link (Forgot Password) */}
            {showForgotPassword && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(false)}
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to login
                </Button>
              </div>
            )}
          </SecureForm>

          <Separator className="my-6" />

          {/* Toggle between login/signup */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              type="button"
              variant="link"
              onClick={toggleMode}
              className="p-0 h-auto font-semibold"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;