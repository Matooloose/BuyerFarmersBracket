import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, resendVerification, isEmailVerified } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'error'>('pending');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }

    // Check if user is already verified
    if (isEmailVerified) {
      setVerificationStatus('verified');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }

    // Handle email verification from URL (when user clicks email link)
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type === 'email_verification') {
      // The auth state change will handle the verification
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified.",
      });
      setVerificationStatus('verified');
    }

    // Start cooldown timer if needed
    const lastResend = localStorage.getItem('lastResendTime');
    if (lastResend) {
      const timeDiff = Date.now() - parseInt(lastResend);
      const cooldownRemaining = Math.max(0, 60000 - timeDiff); // 1 minute cooldown
      
      if (cooldownRemaining > 0) {
        setResendCooldown(Math.ceil(cooldownRemaining / 1000));
      }
    }
  }, [user, isEmailVerified, searchParams, navigate, toast]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!email || isResending || resendCooldown > 0) return;

    setIsResending(true);
    
    try {
      const { error } = await resendVerification(email);
      
      if (error) {
        setVerificationStatus('error');
        return;
      }

      // Set cooldown
      setResendCooldown(60);
      localStorage.setItem('lastResendTime', Date.now().toString());
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error) {
      console.error('Error resending verification:', error);
      setVerificationStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />;
      default:
        return <Mail className="h-16 w-16 text-blue-500 mx-auto" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'verified':
        return {
          title: "Email Verified!",
          description: "Your email has been successfully verified. Redirecting to dashboard..."
        };
      case 'error':
        return {
          title: "Verification Failed",
          description: "There was an issue verifying your email. Please try again or contact support."
        };
      default:
        return {
          title: "Verify Your Email",
          description: "We've sent a verification link to your email address. Please check your inbox and click the link to verify your account."
        };
    }
  };

  const statusMessage = getStatusMessage();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to verify your email address.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl">{statusMessage.title}</CardTitle>
            <CardDescription>{statusMessage.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {verificationStatus === 'pending' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    disabled={isResending}
                  />
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={handleResendVerification}
                    disabled={!email || isResending || resendCooldown > 0}
                    className="w-full"
                    variant={resendCooldown > 0 ? "outline" : "default"}
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Resend in {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>Didn't receive the email?</p>
                    <ul className="mt-2 space-y-1">
                      <li>• Check your spam/junk folder</li>
                      <li>• Make sure the email address is correct</li>
                      <li>• Wait a few minutes for delivery</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {verificationStatus === 'verified' && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Account Verified</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  You will be redirected shortly...
                </p>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Verification Failed</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setVerificationStatus('pending')}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => navigate('/contact-support')}
                    variant="outline"
                    className="flex-1"
                  >
                    Get Help
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-sm"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerification;