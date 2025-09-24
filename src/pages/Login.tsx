import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Leaf, 
  Eye, 
  EyeOff, 
  Wifi, 
  WifiOff, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Smartphone
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Types for enhanced login features
interface FailedAttempt {
  timestamp: number;
  email: string;
}

interface DeviceInfo {
  id: string;
  name: string;
  lastSeen: number;
  trusted: boolean;
}

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasUppercase: boolean;
}

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  
  // Basic form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Enhanced security features
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasNumber: false,
    hasSymbol: false,
    hasUppercase: false
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  // Refs for auto-fill optimization
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Device fingerprinting and trusted device management
  useEffect(() => {
    const generateDeviceId = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas.toDataURL()
      ].join('|');
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return Math.abs(hash).toString(36);
    };

    setDeviceId(generateDeviceId());
    
    // Load remembered credentials
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
    // Load failed attempts from localStorage
    const savedAttempts = localStorage.getItem('loginFailedAttempts');
    if (savedAttempts) {
      try {
        const attempts = JSON.parse(savedAttempts) as FailedAttempt[];
        // Clean up attempts older than 24 hours
        const validAttempts = attempts.filter(
          attempt => Date.now() - attempt.timestamp < 24 * 60 * 60 * 1000
        );
        setFailedAttempts(validAttempts);
        localStorage.setItem('loginFailedAttempts', JSON.stringify(validAttempts));
      } catch (e) {
        localStorage.removeItem('loginFailedAttempts');
      }
    }
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Rate limiting countdown
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCountdown(rateLimitCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isRateLimited && rateLimitCountdown === 0) {
      setIsRateLimited(false);
    }
  }, [rateLimitCountdown, isRateLimited]);

  // Password validation
  useEffect(() => {
    const validation = {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasUppercase: /[A-Z]/.test(password)
    };
    setPasswordValidation(validation);
  }, [password]);

  // Check if device is trusted
  const isDeviceTrusted = (): boolean => {
    const trustedDevices = localStorage.getItem('trustedDevices');
    if (!trustedDevices) return false;
    
    try {
      const devices = JSON.parse(trustedDevices) as DeviceInfo[];
      return devices.some(device => device.id === deviceId && device.trusted);
    } catch {
      return false;
    }
  };

  // Calculate rate limit delay based on failed attempts
  const calculateRateLimitDelay = (attempts: number): number => {
    if (attempts < 3) return 0;
    if (attempts < 5) return 30; // 30 seconds
    if (attempts < 7) return 120; // 2 minutes
    if (attempts < 10) return 300; // 5 minutes
    return 900; // 15 minutes for 10+ attempts
  };

  // Check if user should be rate limited
  const checkRateLimit = (userEmail: string): boolean => {
    const recentAttempts = failedAttempts.filter(
      attempt => 
        attempt.email === userEmail && 
        Date.now() - attempt.timestamp < 60 * 60 * 1000 // Last hour
    );
    
    if (recentAttempts.length >= 3) {
      const delay = calculateRateLimitDelay(recentAttempts.length);
      const lastAttempt = Math.max(...recentAttempts.map(a => a.timestamp));
      const timeElapsed = Math.floor((Date.now() - lastAttempt) / 1000);
      
      if (timeElapsed < delay) {
        setRateLimitCountdown(delay - timeElapsed);
        return true;
      }
    }
    
    return false;
  };

  // Record failed attempt
  const recordFailedAttempt = (userEmail: string) => {
    const newAttempt: FailedAttempt = {
      timestamp: Date.now(),
      email: userEmail
    };
    
    const updatedAttempts = [...failedAttempts, newAttempt];
    setFailedAttempts(updatedAttempts);
    localStorage.setItem('loginFailedAttempts', JSON.stringify(updatedAttempts));
    
    // Check if rate limiting should be applied
    if (checkRateLimit(userEmail)) {
      setIsRateLimited(true);
      const recentAttempts = updatedAttempts.filter(
        attempt => 
          attempt.email === userEmail && 
          Date.now() - attempt.timestamp < 60 * 60 * 1000
      );
      
      toast({
        title: "Too Many Failed Attempts",
        description: `Account temporarily locked. Please wait ${calculateRateLimitDelay(recentAttempts.length)} seconds.`,
        variant: "destructive",
      });
    }
  };

  // Add device to trusted devices
  const addTrustedDevice = (userEmail: string) => {
    const deviceInfo: DeviceInfo = {
      id: deviceId,
      name: `${navigator.platform} - ${new Date().toLocaleDateString()}`,
      lastSeen: Date.now(),
      trusted: true
    };
    
    const existingDevices = localStorage.getItem('trustedDevices');
    let devices: DeviceInfo[] = [];
    
    if (existingDevices) {
      try {
        devices = JSON.parse(existingDevices);
      } catch {
        devices = [];
      }
    }
    
    // Remove existing device with same ID and add new one
    devices = devices.filter(device => device.id !== deviceId);
    devices.push(deviceInfo);
    
    // Keep only last 5 trusted devices
    if (devices.length > 5) {
      devices = devices.slice(-5);
    }
    
    localStorage.setItem('trustedDevices', JSON.stringify(devices));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      toast({
        title: "No Internet Connection",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (checkRateLimit(email)) {
      setIsRateLimited(true);
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (!error) {
        // Success - clear failed attempts for this email
        const updatedAttempts = failedAttempts.filter(attempt => attempt.email !== email);
        setFailedAttempts(updatedAttempts);
        localStorage.setItem('loginFailedAttempts', JSON.stringify(updatedAttempts));
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
          
          // Add to trusted devices if not already trusted
          if (!isDeviceTrusted()) {
            addTrustedDevice(email);
            toast({
              title: "Device Remembered",
              description: "This device has been added to your trusted devices.",
            });
          }
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.setItem('rememberMe', 'false');
        }
        
        navigate('/dashboard');
      } else {
        // Record failed attempt
        recordFailedAttempt(email);
      }
    } catch (error) {
      recordFailedAttempt(email);
    } finally {
      setIsLoading(false);
    }
  };

  const getFailedAttemptsForEmail = (userEmail: string): number => {
    return failedAttempts.filter(
      attempt => 
        attempt.email === userEmail && 
        Date.now() - attempt.timestamp < 60 * 60 * 1000
    ).length;
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Network Status Indicator */}
        <div className={`fixed top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isOnline 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              Offline
            </>
          )}
        </div>

        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">FarmersBracket</h1>
            <p className="text-muted-foreground">shopleft</p>
          </div>
        </div>

        {/* Device Recognition Badge */}
        {isDeviceTrusted() && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Smartphone className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">Trusted Device</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
        )}

        {/* Rate Limiting Warning */}
        {isRateLimited && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <Clock className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Account Temporarily Locked</p>
              <p className="text-xs text-red-600">
                Too many failed attempts. Try again in {formatCountdown(rateLimitCountdown)}
              </p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <Card className="shadow-medium">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue shopping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  ref={emailRef}
                  id="email"
                  name="email" // Important for password managers
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  autoComplete="email"
                  disabled={isRateLimited}
                />
                {email && getFailedAttemptsForEmail(email) > 0 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFailedAttemptsForEmail(email)} failed attempt(s) in the last hour
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="password" // Important for password managers
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    required
                    className="h-11 pr-10"
                    autoComplete="current-password"
                    disabled={isRateLimited}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isRateLimited}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* Password Security Checklist */}
                {showPasswordRequirements && password && (
                  <div className="mt-2 p-3 bg-gray-50 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Password Requirements</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 text-xs ${
                        passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {passwordValidation.minLength ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        At least 8 characters
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {passwordValidation.hasUppercase ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        One uppercase letter
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {passwordValidation.hasNumber ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        One number
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        passwordValidation.hasSymbol ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {passwordValidation.hasSymbol ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        One special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isRateLimited}
                />
                <Label 
                  htmlFor="remember-me" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me on this device
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-primary to-primary-light"
                disabled={isLoading || isRateLimited || !isOnline}
              >
                {isLoading ? (
                  "Signing in..."
                ) : isRateLimited ? (
                  `Locked (${formatCountdown(rateLimitCountdown)})`
                ) : !isOnline ? (
                  "No Internet Connection"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;