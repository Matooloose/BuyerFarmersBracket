import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Leaf, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  MapPin, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Shield,
  FileText,
  Crop,
  RotateCcw,
  RefreshCw,
  Navigation
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
);

// Types for enhanced registration features
interface FormValidation {
  username: {
    isValid: boolean;
    message: string;
  };
  email: {
    isValid: boolean;
    message: string;
  };
  password: {
    isValid: boolean;
    message: string;
    strength: number;
  };
  confirmPassword: {
    isValid: boolean;
    message: string;
  };
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address: string;
}

interface RegistrationStep {
  id: string;
  title: string;
  completed: boolean;
}

const REGISTRATION_STEPS: RegistrationStep[] = [
  { id: 'basic-info', title: 'Basic Information', completed: false },
  { id: 'profile-setup', title: 'Profile Setup', completed: false },
  { id: 'location', title: 'Location', completed: false },
  { id: 'verification', title: 'Email Verification', completed: false },
  { id: 'terms', title: 'Terms & Conditions', completed: false }
];

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  // Core form state
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(REGISTRATION_STEPS);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    bio: ""
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Enhanced features state
  const [validation, setValidation] = useState<FormValidation>({
    username: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '', strength: 0 },
    confirmPassword: { isValid: false, message: '' }
  });
  
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Very Weak',
    color: '#ef4444',
    requirements: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    }
  });
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 200, height: 200 });
  
  // Location state
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Email verification state
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Real-time form validation with debouncing for username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateForm();
    }, 500); // Debounce for 500ms to avoid too many API calls
    
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Email verification countdown
  useEffect(() => {
    if (verificationCountdown > 0) {
      const timer = setTimeout(() => {
        setVerificationCountdown(verificationCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationCountdown]);

  // Auto-detect location on component mount
  useEffect(() => {
    detectLocation();
  }, []);

  const validateForm = async () => {
    const newValidation: FormValidation = {
      username: await validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword)
    };
    
    setValidation(newValidation);
    updatePasswordStrength(formData.password);
    return newValidation;
  };

  const validateUsername = async (username: string) => {
    if (username.length === 0) return { isValid: false, message: '' };
    if (username.length < 3) return { isValid: false, message: 'Username must be at least 3 characters' };
    if (username.length > 20) return { isValid: false, message: 'Username must be less than 20 characters' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
    
    // Check if username already exists
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('Error checking username:', error);
        return { isValid: false, message: 'Unable to verify username availability' };
      }
      
      if (data) {
        return { isValid: false, message: 'Username is already taken' };
      }
      
      return { isValid: true, message: 'Username is available' };
    } catch (error) {
      console.error('Error checking username:', error);
      return { isValid: false, message: 'Unable to verify username availability' };
    }
  };

  const validateEmail = (email: string) => {
    if (email.length === 0) return { isValid: false, message: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { isValid: false, message: 'Please enter a valid email address' };
    return { isValid: true, message: 'Email format is valid' };
  };

  const validatePassword = (password: string) => {
    if (password.length === 0) return { isValid: false, message: '', strength: 0 };
    
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const strength = Object.values(requirements).filter(Boolean).length;
    
    if (strength < 3) return { isValid: false, message: 'Password is too weak', strength };
    if (strength < 4) return { isValid: true, message: 'Password is acceptable', strength };
    return { isValid: true, message: 'Strong password', strength };
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (confirmPassword.length === 0) return { isValid: false, message: '' };
    if (password !== confirmPassword) return { isValid: false, message: 'Passwords do not match' };
    return { isValid: true, message: 'Passwords match' };
  };

  const updatePasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(requirements).filter(Boolean).length;
    
    let label = 'Very Weak';
    let color = '#ef4444';
    
    switch (score) {
      case 0:
      case 1:
        label = 'Very Weak';
        color = '#ef4444';
        break;
      case 2:
        label = 'Weak';
        color = '#f97316';
        break;
      case 3:
        label = 'Fair';
        color = '#eab308';
        break;
      case 4:
        label = 'Good';
        color = '#22c55e';
        break;
      case 5:
        label = 'Strong';
        color = '#16a34a';
        break;
    }
    
    setPasswordStrength({ score, label, color, requirements });
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    
    try {
      // Try GPS first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              // Reverse geocoding using a free service
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              const data = await response.json();
              
              setLocation({
                latitude,
                longitude,
                city: data.city || data.locality || '',
                country: data.countryName || '',
                address: data.plusCode || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              });
            } catch (error) {
              console.error('Reverse geocoding failed:', error);
              setLocation({
                latitude,
                longitude,
                city: '',
                country: '',
                address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              });
            }
            setIsDetectingLocation(false);
          },
          async (error) => {
            console.log('GPS failed, trying IP-based location:', error);
            // Fallback to IP-based location
            try {
              const response = await fetch('https://ipapi.co/json/');
              const data = await response.json();
              
              setLocation({
                latitude: data.latitude,
                longitude: data.longitude,
                city: data.city || '',
                country: data.country_name || '',
                address: `${data.city}, ${data.country_name}`
              });
            } catch (ipError) {
              console.error('IP-based location failed:', ipError);
              toast({
                title: "Location Detection Failed",
                description: "Could not detect your location. You can set it manually later.",
                variant: "destructive",
              });
            }
            setIsDetectingLocation(false);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        throw new Error('Geolocation not supported');
      }
    } catch (error) {
      setIsDetectingLocation(false);
      console.error('Location detection failed:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setShowImageCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const cropImage = () => {
    if (!originalImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = 200;
      canvas.height = 200;
      
      ctx.drawImage(
        img,
        cropData.x,
        cropData.y,
        cropData.width,
        cropData.height,
        0,
        0,
        200,
        200
      );
      
      const croppedImage = canvas.toDataURL();
      setProfilePicture(croppedImage);
      setShowImageCropper(false);
    };
    img.src = originalImage;
  };

  const sendVerificationEmail = async () => {
    if (!validation.email.isValid) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
      });
      
      if (error) throw error;
      
      setIsEmailSent(true);
      setVerificationCountdown(60);
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your email and click the verification link.",
      });
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const getStepProgress = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const updateStepCompletion = (stepId: string, completed: boolean) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed } : step
    ));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0: // Basic info
        return validation.username.isValid && 
               validation.email.isValid && 
               validation.password.isValid && 
               validation.confirmPassword.isValid;
      case 1: // Profile setup
        return formData.firstName && formData.lastName;
      case 2: // Location
        return location !== null;
      case 3: // Email verification
        return emailVerified || isEmailSent;
      case 4: // Terms
        return acceptedTerms;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceedToNextStep() && currentStep < steps.length - 1) {
      updateStepCompletion(steps[currentStep].id, true);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, formData.username);

      if (!error) {
        // Get the current user from supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Create comprehensive profile
          await supabase.from('profiles').upsert({
            id: user.id,
            email: formData.email,
            name: formData.username,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            bio: formData.bio,
            profile_picture: profilePicture,
            location: location ? JSON.stringify(location) : null,
          });
        }
        
        updateStepCompletion('terms', true);
        
        toast({
          title: "Account Created Successfully!",
          description: "Welcome to FarmersBracket! Your account has been created.",
        });
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderProfileSetupStep();
      case 2:
        return renderLocationStep();
      case 3:
        return renderEmailVerificationStep();
      case 4:
        return renderTermsStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className={`h-11 pl-10 ${
              formData.username && !validation.username.isValid 
                ? 'border-red-500' 
                : formData.username && validation.username.isValid 
                ? 'border-green-500' 
                : ''
            }`}
          />
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {formData.username && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {validation.username.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {formData.username && validation.username.message && (
          <p className={`text-xs ${validation.username.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validation.username.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className={`h-11 pl-10 ${
              formData.email && !validation.email.isValid 
                ? 'border-red-500' 
                : formData.email && validation.email.isValid 
                ? 'border-green-500' 
                : ''
            }`}
          />
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {formData.email && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {validation.email.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {formData.email && validation.email.message && (
          <p className={`text-xs ${validation.email.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validation.email.message}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className={`h-11 pl-10 pr-10 ${
              formData.password && !validation.password.isValid 
                ? 'border-red-500' 
                : formData.password && validation.password.isValid 
                ? 'border-green-500' 
                : ''
            }`}
          />
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        
        {/* Password Strength Meter */}
        {formData.password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Password Strength:</span>
              <span 
                className={`text-xs font-medium ${
                  passwordStrength.score === 0 || passwordStrength.score === 1 ? 'text-red-500' :
                  passwordStrength.score === 2 ? 'text-orange-500' :
                  passwordStrength.score === 3 ? 'text-yellow-500' :
                  passwordStrength.score === 4 ? 'text-green-500' : 'text-green-600'
                }`}
              >
                {passwordStrength.label}
              </span>
            </div>
            <Progress 
              value={(passwordStrength.score / 5) * 100} 
              className="h-2"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.length ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordStrength.requirements.length ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                8+ characters
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordStrength.requirements.uppercase ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                Uppercase letter
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordStrength.requirements.lowercase ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                Lowercase letter
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.number ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordStrength.requirements.number ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                Number
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.special ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordStrength.requirements.special ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                Special character
              </div>
            </div>
          </div>
        )}
        
        {formData.password && validation.password.message && (
          <p className={`text-xs ${validation.password.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validation.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            className={`h-11 pl-10 pr-10 ${
              formData.confirmPassword && !validation.confirmPassword.isValid 
                ? 'border-red-500' 
                : formData.confirmPassword && validation.confirmPassword.isValid 
                ? 'border-green-500' 
                : ''
            }`}
          />
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          {formData.confirmPassword && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              {validation.confirmPassword.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {formData.confirmPassword && validation.confirmPassword.message && (
          <p className={`text-xs ${validation.confirmPassword.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validation.confirmPassword.message}
          </p>
        )}
      </div>
    </div>
  );

  const renderProfileSetupStep = () => (
    <div className="space-y-4">
      {/* Profile Picture Upload */}
      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 p-1 h-8 w-8 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Upload a profile picture to personalize your account
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Profile picture upload"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="Your first name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className="h-11"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Your last name"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Your phone number"
          value={formData.phone}
          onChange={handleInputChange}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (Optional)</Label>
        <textarea
          id="bio"
          name="bio"
          placeholder="Tell us a bit about yourself..."
          value={formData.bio}
          onChange={handleInputChange}
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={3}
        />
      </div>
    </div>
  );

  const renderLocationStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <MapPin className="h-12 w-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-semibold">Set Your Location</h3>
        <p className="text-sm text-muted-foreground">
          This helps us show you local farmers and products
        </p>
      </div>

      {location ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Location Detected</span>
          </div>
          <p className="text-sm text-green-700">
            {location.city && location.country 
              ? `${location.city}, ${location.country}`
              : location.address}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          {isDetectingLocation ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 justify-center mb-2">
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-blue-800">Detecting your location...</span>
              </div>
              <p className="text-sm text-blue-600">This may take a few seconds</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                type="button"
                onClick={detectLocation}
                className="w-full"
                variant="outline"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Detect My Location
              </Button>
              <p className="text-xs text-muted-foreground">
                We'll use GPS or your IP address to find your approximate location
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderEmailVerificationStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-semibold">Verify Your Email</h3>
        <p className="text-sm text-muted-foreground">
          We'll send a verification link to {formData.email}
        </p>
      </div>

      {!isEmailSent ? (
        <Button
          type="button"
          onClick={sendVerificationEmail}
          className="w-full"
          disabled={!validation.email.isValid}
        >
          Send Verification Email
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-medium">Email Sent!</span>
            </div>
            <p className="text-sm text-blue-600">
              Check your inbox and click the verification link
            </p>
            {verificationCountdown > 0 && (
              <p className="text-xs text-blue-500 mt-2">
                Resend available in {formatCountdown(verificationCountdown)}
              </p>
            )}
          </div>

          {verificationCountdown === 0 && (
            <Button
              type="button"
              onClick={sendVerificationEmail}
              variant="outline"
              className="w-full"
            >
              Resend Verification Email
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-verified"
              checked={emailVerified}
              onCheckedChange={(checked) => setEmailVerified(checked as boolean)}
            />
            <Label htmlFor="email-verified" className="text-sm">
              I have verified my email address
            </Label>
          </div>
        </div>
      )}
    </div>
  );

  const renderTermsStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-semibold">Terms & Conditions</h3>
        <p className="text-sm text-muted-foreground">
          Please review and accept our terms to complete registration
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="accept-terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
        />
        <Label htmlFor="accept-terms" className="text-sm flex items-center gap-1">
          I agree to the 
          <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
            <DialogTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-primary underline">
                Terms & Conditions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Terms & Conditions
                </DialogTitle>
                <DialogDescription>
                  Please read these terms carefully before accepting
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <section>
                  <h4 className="font-semibold mb-2">1. Account Registration</h4>
                  <p className="text-muted-foreground">
                    By creating an account, you agree to provide accurate and complete information. 
                    You are responsible for maintaining the security of your account credentials.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-semibold mb-2">2. Platform Usage</h4>
                  <p className="text-muted-foreground">
                    FarmersBracket connects buyers with local farmers. Users must use the platform 
                    responsibly and in accordance with applicable laws and regulations.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-semibold mb-2">3. Privacy Policy</h4>
                  <p className="text-muted-foreground">
                    We collect and process your personal data in accordance with our Privacy Policy. 
                    This includes location data used to show relevant local farmers and products.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-semibold mb-2">4. Transaction Terms</h4>
                  <p className="text-muted-foreground">
                    All transactions are between buyers and farmers. FarmersBracket facilitates 
                    connections but is not responsible for the quality of products or fulfillment of orders.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-semibold mb-2">5. Content Guidelines</h4>
                  <p className="text-muted-foreground">
                    Users must not post inappropriate, misleading, or harmful content. We reserve 
                    the right to remove content that violates our community guidelines.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-semibold mb-2">6. Limitation of Liability</h4>
                  <p className="text-muted-foreground">
                    FarmersBracket provides the platform "as is" and is not liable for any damages 
                    arising from platform use, including but not limited to product quality or delivery issues.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-semibold mb-2">7. Termination</h4>
                  <p className="text-muted-foreground">
                    We may terminate accounts that violate these terms. Users may delete their 
                    accounts at any time through account settings.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-semibold mb-2">8. Updates to Terms</h4>
                  <p className="text-muted-foreground">
                    These terms may be updated periodically. Continued use of the platform 
                    constitutes acceptance of any changes.
                  </p>
                </section>
              </div>
            </DialogContent>
          </Dialog>
          and Privacy Policy
        </Label>
      </div>

      {acceptedTerms && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">Terms accepted - Ready to create account!</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">FarmersBracket</h1>
            <p className="text-muted-foreground">Join our community</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(getStepProgress())}% Complete</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex flex-col items-center ${
                  index === currentStep ? 'text-primary' : 
                  step.completed ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                  index === currentStep ? 'border-primary bg-primary text-primary-foreground' :
                  step.completed ? 'border-green-600 bg-green-600 text-white' : 'border-muted-foreground'
                }`}>
                  {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-xs mt-1 text-center max-w-[60px] leading-tight">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Form */}
        <Card className="shadow-medium">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">{steps[currentStep]?.title}</CardTitle>
            <CardDescription className="text-center">
              {currentStep === 0 && "Enter your basic information to get started"}
              {currentStep === 1 && "Set up your profile with additional details"}
              {currentStep === 2 && "Help us find local farmers near you"}
              {currentStep === 3 && "Verify your email address for security"}
              {currentStep === 4 && "Review and accept our terms to finish"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderCurrentStep()}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                )}
                
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-light"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading || !canProceedToNextStep()}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-light"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                )}
              </div>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Image Cropper Modal */}
        <Dialog open={showImageCropper} onOpenChange={setShowImageCropper}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crop className="h-5 w-5" />
                Crop Your Profile Picture
              </DialogTitle>
              <DialogDescription>
                Adjust the crop area to fit your image perfectly
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {originalImage && (
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageCropper(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={cropImage}
                  className="flex-1"
                >
                  Apply Crop
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Register;