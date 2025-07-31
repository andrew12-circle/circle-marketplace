import { useState, useEffect } from "react";
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

const circleLogoUrl = "/lovable-uploads/97692497-6d98-46a8-b6fc-05cd68bdc160.png";

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    isCreator: false
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
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

  const handleSignUp = async (email: string, password: string, displayName: string, isCreator: boolean) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: displayName,
          is_creator: isCreator
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
          data.displayName || '',
          data.isCreator === 'true'
        );
        
        if (user) {
          toast({
            title: "Account created!",
            description: data.isCreator === 'true'
              ? "Welcome to the creator platform! Check your email to verify your account."
              : "Welcome! Check your email to verify your account.",
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
    setFormData({ email: '', password: '', displayName: '', isCreator: false });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={circleLogoUrl}
              alt="Circle Logo" 
              className="w-16 h-16 object-contain"
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

            {/* Creator Toggle (Signup only) */}
            {!isLogin && (
              <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor="isCreator" className="text-sm font-medium">
                    I'm a creator
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Upload and monetize your content
                  </p>
                </div>
                <input
                  type="hidden"
                  name="isCreator"
                  value={formData.isCreator.toString()}
                />
                <Switch
                  id="isCreator"
                  checked={formData.isCreator}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCreator: checked }))}
                />
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