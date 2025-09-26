import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  MapPin, 
  Leaf, 
  Users, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Monitor,
  Settings,
  Bell,
  Camera,
  Mic,
  Navigation,
  Shield,
  Eye,
  Accessibility,
  Type,
  Zap,
  CheckCircle,
  SkipForward,
  X,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Heart,
  Package,
  Truck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useAppState } from "@/contexts/AppStateContext";

// Types for enhanced welcome features
interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  videoUrl?: string;
  personalizedContent?: (location?: string) => React.ReactNode;
}

interface Permission {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  benefits: string[];
  required: boolean;
  status: 'pending' | 'granted' | 'denied';
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  accessibility: {
    largeText: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

interface OnboardingProgress {
  currentSlide: number;
  completedSlides: number[];
  permissions: Record<string, 'pending' | 'granted' | 'denied'>;
  preferences: UserPreferences;
  startTime: number;
  lastActiveTime: number;
}

const Welcome = () => {
  const navigate = useNavigate();
  const { setHasCompletedWelcome } = useAppState();
  const { toast } = useToast();
  
  // Core state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Video state
  const [videoStates, setVideoStates] = useState<Record<string, { playing: boolean; muted: boolean }>>({});
  
  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'location',
      name: 'Location Access',
      icon: <Navigation className="h-5 w-5" />,
      description: 'Access your location to find nearby farms and products',
      benefits: [
        'Discover local farmers in your area',
        'Get accurate delivery estimates',
        'Find seasonal produce near you',
        'Support local agriculture'
      ],
      required: false,
      status: 'pending'
    },
    {
      id: 'notifications',
      name: 'Push Notifications',
      icon: <Bell className="h-5 w-5" />,
      description: 'Get notified about order updates and new products',
      benefits: [
        'Real-time order tracking updates',
        'Alerts for fresh product arrivals',
        'Delivery status notifications',
        'Special offers and discounts'
      ],
      required: false,
      status: 'pending'
    },
    {
      id: 'camera',
      name: 'Camera Access',
      icon: <Camera className="h-5 w-5" />,
      description: 'Take photos to review products and share experiences',
      benefits: [
        'Scan product QR codes',
        'Share product reviews with photos',
        'Upload profile pictures',
        'Report issues with visual evidence'
      ],
      required: false,
      status: 'pending'
    }
  ]);
  
  // User preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    notifications: true,
    accessibility: {
      largeText: false,
      highContrast: false,
      reducedMotion: false
    }
  });
  
  // Progress state
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({
    currentSlide: 0,
    completedSlides: [],
    permissions: {},
    preferences: preferences,
    startTime: Date.now(),
    lastActiveTime: Date.now()
  });
  
  // Dialog state
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showPermissionDetails, setShowPermissionDetails] = useState<string | null>(null);
  
  // Refs
  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const autoAdvanceTimer = useRef<NodeJS.Timeout>();

  useStatusBar();

  // Component helpers
  const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  const StepItem = ({ number, title, description }: { number: number; title: string; description: string }) => (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
        {number}
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  const PermissionCard = ({ 
    permission, 
    onToggle, 
    onShowDetails 
  }: { 
    permission: Permission; 
    onToggle: () => void; 
    onShowDetails: () => void;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {permission.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{permission.name}</p>
            {permission.required && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Required
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{permission.description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowDetails}
          className="p-1 h-6 w-6"
        >
          <Eye className="h-3 w-3" />
        </Button>
        <Button
          variant={permission.status === 'granted' ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="text-xs px-2 py-1 h-6"
        >
          {permission.status === 'granted' ? 'Granted' : 
           permission.status === 'denied' ? 'Denied' : 'Allow'}
        </Button>
      </div>
    </div>
  );

  const ThemeOption = ({ 
    icon, 
    label, 
    value, 
    selected, 
    onClick 
  }: { 
    icon: React.ReactNode; 
    label: string; 
    value: string; 
    selected: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
        selected 
          ? 'border-primary bg-primary/5 text-primary' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  const AccessibilityOption = ({ 
    icon, 
    title, 
    description, 
    checked, 
    onChange 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-start justify-between p-3 border rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );

  // Define onboarding slides
  const slides: OnboardingSlide[] = [
    {
      id: 'welcome',
      title: 'Welcome to FarmersBracket',
      description: 'Your gateway to fresh, local produce',
      icon: <Leaf className="h-12 w-12 text-primary" />,
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
            <Leaf className="h-12 w-12 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">FarmersBracket</h1>
            <p className="text-lg text-muted-foreground font-medium">shopleft</p>
          </div>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Connect directly with local farmers and get the freshest produce delivered to your door
          </p>
        </div>
      ),
      personalizedContent: (location) => location ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Welcome to {location}!</span>
          </div>
          <p className="text-xs text-green-600">
            We've found 12 local farms in your area ready to serve you fresh produce.
          </p>
        </div>
      ) : null
    },
    {
      id: 'features',
      title: 'Discover Amazing Features',
      description: 'Everything you need for fresh food shopping',
      icon: <Star className="h-12 w-12 text-yellow-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Star className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-xl font-semibold">Why Choose FarmersBracket?</h3>
          </div>
          <div className="space-y-3">
            <FeatureItem 
              icon={<Users className="h-5 w-5 text-blue-500" />} 
              title="Direct from Farmers" 
              description="Support local agriculture and get the best prices"
            />
            <FeatureItem 
              icon={<Leaf className="h-5 w-5 text-green-500" />} 
              title="Fresh & Organic" 
              description="Quality guaranteed, pesticide-free produce"
            />
            <FeatureItem 
              icon={<Truck className="h-5 w-5 text-purple-500" />} 
              title="Fast Delivery" 
              description="Same-day delivery from farm to your table"
            />
            <FeatureItem 
              icon={<Shield className="h-5 w-5 text-orange-500" />} 
              title="100% Secure" 
              description="Safe payments and guaranteed freshness"
            />
          </div>
        </div>
      ),
      videoUrl: '/demo-features.mp4'
    },
    {
      id: 'shopping',
      title: 'Easy Shopping Experience',
      description: 'Browse, order, and track with ease',
      icon: <ShoppingBag className="h-12 w-12 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <ShoppingBag className="h-12 w-12 text-purple-500 mx-auto mb-2" />
            <h3 className="text-xl font-semibold">Shop Like Never Before</h3>
          </div>
          <div className="space-y-3">
            <StepItem number={1} title="Browse" description="Explore fresh products from local farms" />
            <StepItem number={2} title="Order" description="Add items to cart and checkout securely" />
            <StepItem number={3} title="Track" description="Monitor your order from farm to door" />
            <StepItem number={4} title="Enjoy" description="Receive fresh produce and leave reviews" />
          </div>
        </div>
      ),
      videoUrl: '/demo-shopping.mp4',
      personalizedContent: (location) => location ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-800">
            🎯 In {location}, most orders arrive within 2-4 hours!
          </p>
        </div>
      ) : null
    },
    {
      id: 'permissions',
      title: 'Customize Your Experience',
      description: 'Set permissions and preferences',
      icon: <Settings className="h-12 w-12 text-gray-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Settings className="h-12 w-12 text-gray-500 mx-auto mb-2" />
            <h3 className="text-xl font-semibold">Personalize FarmersBracket</h3>
            <p className="text-sm text-muted-foreground">
              Configure permissions and preferences for the best experience
            </p>
          </div>
          
          {/* Permissions Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Permissions
            </h4>
            {permissions.map((permission) => (
              <PermissionCard 
                key={permission.id} 
                permission={permission} 
                onToggle={() => handlePermissionToggle(permission.id)}
                onShowDetails={() => setShowPermissionDetails(permission.id)}
              />
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'preferences',
      title: 'App Preferences',
      description: 'Customize your app experience',
      icon: <Accessibility className="h-12 w-12 text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Accessibility className="h-12 w-12 text-indigo-500 mx-auto mb-2" />
            <h3 className="text-xl font-semibold">Accessibility & Preferences</h3>
          </div>
          
          {/* Theme Selection */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Theme Preference
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <ThemeOption 
                icon={<Sun className="h-4 w-4" />} 
                label="Light" 
                value="light"
                selected={preferences.theme === 'light'}
                onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
              />
              <ThemeOption 
                icon={<Moon className="h-4 w-4" />} 
                label="Dark" 
                value="dark"
                selected={preferences.theme === 'dark'}
                onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
              />
              <ThemeOption 
                icon={<Monitor className="h-4 w-4" />} 
                label="System" 
                value="system"
                selected={preferences.theme === 'system'}
                onClick={() => setPreferences(prev => ({ ...prev, theme: 'system' }))}
              />
            </div>
          </div>
          
          {/* Accessibility Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Accessibility
            </h4>
            <AccessibilityOption 
              icon={<Type className="h-4 w-4" />}
              title="Large Text"
              description="Increase text size for better readability"
              checked={preferences.accessibility.largeText}
              onChange={(checked) => setPreferences(prev => ({
                ...prev,
                accessibility: { ...prev.accessibility, largeText: checked }
              }))}
            />
            <AccessibilityOption 
              icon={<Eye className="h-4 w-4" />}
              title="High Contrast"
              description="Enhance contrast for better visibility"
              checked={preferences.accessibility.highContrast}
              onChange={(checked) => setPreferences(prev => ({
                ...prev,
                accessibility: { ...prev.accessibility, highContrast: checked }
              }))}
            />
            <AccessibilityOption 
              icon={<Zap className="h-4 w-4" />}
              title="Reduced Motion"
              description="Minimize animations and transitions"
              checked={preferences.accessibility.reducedMotion}
              onChange={(checked) => setPreferences(prev => ({
                ...prev,
                accessibility: { ...prev.accessibility, reducedMotion: checked }
              }))}
            />
          </div>
        </div>
      )
    },
    {
      id: 'ready',
      title: 'You\'re All Set!',
      description: 'Ready to start shopping fresh?',
      icon: <CheckCircle className="h-12 w-12 text-green-500" />,
      content: (
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Welcome to the Community!</h3>
            <p className="text-muted-foreground">
              You're now ready to explore fresh, local produce and connect with farmers in your area.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">What's Next?</h4>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• Browse local farms and products</li>
              <li>• Create your first order</li>
              <li>• Track deliveries in real-time</li>
              <li>• Leave reviews and connect with farmers</li>
            </ul>
          </div>
        </div>
      ),
      personalizedContent: (location) => location ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-blue-800">
              Welcome to the {location} farming community!
            </span>
          </div>
          <p className="text-xs text-blue-600">
            You're joining 1,200+ other shoppers supporting local agriculture.
          </p>
        </div>
      ) : null
    }
  ];

  // Load saved progress on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('onboardingProgress');
    const hasCompletedBefore = localStorage.getItem('hasCompletedWelcome');
    
    if (hasCompletedBefore === 'true') {
      setIsReturningUser(true);
    }
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress) as OnboardingProgress;
        setOnboardingProgress(progress);
        setCurrentSlide(progress.currentSlide);
        setPreferences(progress.preferences);
        
        // Update permissions state
        const updatedPermissions = permissions.map(permission => ({
          ...permission,
          status: progress.permissions[permission.id] || 'pending'
        }));
        setPermissions(updatedPermissions);
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
      }
    }
    
    // Detect user location for personalization
    detectUserLocation();
  }, []);

  // Save progress whenever state changes
  useEffect(() => {
    const progress: OnboardingProgress = {
      currentSlide,
      completedSlides: onboardingProgress.completedSlides,
      permissions: permissions.reduce((acc, permission) => ({
        ...acc,
        [permission.id]: permission.status
      }), {}),
      preferences,
      startTime: onboardingProgress.startTime,
      lastActiveTime: Date.now()
    };
    
    setOnboardingProgress(progress);
    localStorage.setItem('onboardingProgress', JSON.stringify(progress));
  }, [currentSlide, permissions, preferences]);

  // Auto-advance timer
  useEffect(() => {
    if (preferences.accessibility.reducedMotion) return;
    
    if (currentSlide < slides.length - 1) {
      autoAdvanceTimer.current = setTimeout(() => {
        if (!isDragging) {
          nextSlide();
        }
      }, 8000); // 8 seconds auto-advance
    }
    
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [currentSlide, isDragging, preferences.accessibility.reducedMotion]);

  const detectUserLocation = async () => {
    try {
      // Try IP-based location first (fallback)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.city && data.country_name) {
        setUserLocation(`${data.city}, ${data.country_name}`);
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    }
  };

  const handlePermissionToggle = async (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return;

    try {
      let granted = false;
      
      switch (permissionId) {
        case 'location':
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                updatePermissionStatus(permissionId, 'granted');
                localStorage.setItem('userLocation', JSON.stringify({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }));
                toast({
                  title: "Location access granted!",
                  description: "We'll show you the best farms near you",
                });
              },
              () => {
                updatePermissionStatus(permissionId, 'denied');
                toast({
                  title: "Location access denied",
                  description: "You can still browse all products",
                  variant: "destructive",
                });
              }
            );
          }
          break;
          
        case 'notifications':
          if ('Notification' in window) {
            const result = await Notification.requestPermission();
            granted = result === 'granted';
            updatePermissionStatus(permissionId, granted ? 'granted' : 'denied');
            
            if (granted) {
              toast({
                title: "Notifications enabled!",
                description: "You'll get updates about your orders",
              });
            }
          }
          break;
          
        case 'camera':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop immediately
            updatePermissionStatus(permissionId, 'granted');
            toast({
              title: "Camera access granted!",
              description: "You can now scan QR codes and take photos",
            });
          } catch (error) {
            updatePermissionStatus(permissionId, 'denied');
          }
          break;
      }
    } catch (error) {
      updatePermissionStatus(permissionId, 'denied');
    }
  };

  const updatePermissionStatus = (permissionId: string, status: 'pending' | 'granted' | 'denied') => {
    setPermissions(prev => prev.map(permission => 
      permission.id === permissionId 
        ? { ...permission, status }
        : permission
    ));
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      markSlideCompleted(currentSlide);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    markSlideCompleted(currentSlide);
  };

  const markSlideCompleted = (slideIndex: number) => {
    setOnboardingProgress(prev => ({
      ...prev,
      completedSlides: [...new Set([...prev.completedSlides, slideIndex])]
    }));
  };

  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleSwipeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const deltaX = clientX - dragStart.x;
    const deltaY = Math.abs(('changedTouches' in e ? e.changedTouches[0].clientY : e.clientY) - dragStart.y);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  };

  const toggleVideo = (slideId: string) => {
    const video = videoRefs.current[slideId];
    if (!video) return;

    if (video.paused) {
      video.play();
      setVideoStates(prev => ({
        ...prev,
        [slideId]: { ...prev[slideId], playing: true }
      }));
    } else {
      video.pause();
      setVideoStates(prev => ({
        ...prev,
        [slideId]: { ...prev[slideId], playing: false }
      }));
    }
  };

  const toggleVideoMute = (slideId: string) => {
    const video = videoRefs.current[slideId];
    if (!video) return;

    video.muted = !video.muted;
    setVideoStates(prev => ({
      ...prev,
      [slideId]: { ...prev[slideId], muted: video.muted }
    }));
  };

  const skipOnboarding = () => {
    setShowSkipDialog(false);
    completeOnboarding();
  };

  const completeOnboarding = () => {
    // Save completion status
    localStorage.setItem('hasCompletedWelcome', 'true');
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    localStorage.removeItem('onboardingProgress');
    
    setHasCompletedWelcome(true);
    
    toast({
      title: "Welcome to FarmersBracket!",
      description: "You're all set to start shopping fresh, local produce",
    });
    
    navigate('/login');
  };

  const getProgressPercentage = () => {
    return ((currentSlide + 1) / slides.length) * 100;
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Skip Button for Returning Users */}
        {isReturningUser && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Welcome back!
            </div>
            <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Skip Onboarding?</DialogTitle>
                  <DialogDescription>
                    You can skip the onboarding and jump straight to the app. 
                    You can always review these features later in settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSkipDialog(false)}
                    className="flex-1"
                  >
                    Continue Tour
                  </Button>
                  <Button
                    onClick={skipOnboarding}
                    className="flex-1"
                  >
                    Skip to App
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentSlide + 1} of {slides.length}</span>
            <span>{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
          <div className="flex justify-center space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide 
                    ? 'bg-primary' 
                    : index < currentSlide 
                    ? 'bg-primary/50' 
                    : 'bg-muted'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Carousel */}
        <Card className="shadow-medium min-h-[500px]">
          <CardContent className="p-6">
            <div
              ref={carouselRef}
              className="relative overflow-hidden"
              onTouchStart={handleSwipeStart}
              onTouchEnd={handleSwipeEnd}
              onMouseDown={handleSwipeStart}
              onMouseUp={handleSwipeEnd}
            >
              <div
                className={`flex transition-transform duration-300 ease-in-out carousel-slide-track`}
                style={{
                  '--carousel-translate': `-${currentSlide * 100}%`,
                  '--carousel-width': `${slides.length * 100}%`
                } as React.CSSProperties}
              >
                {slides.map((slide, index) => (
                  <div key={slide.id} className="w-full flex-shrink-0 space-y-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-semibold text-foreground">{slide.title}</h2>
                      <p className="text-sm text-muted-foreground">{slide.description}</p>
                    </div>

                    {/* Video Section */}
                    {slide.videoUrl && (
                      <div className="relative">
                        <video
                          ref={(el) => {
                            if (el) videoRefs.current[slide.id] = el;
                          }}
                          src={slide.videoUrl}
                          className="w-full h-48 object-cover rounded-lg"
                          loop
                          muted={videoStates[slide.id]?.muted !== false}
                          playsInline
                        />
                        <div className="absolute bottom-2 right-2 flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="p-2 h-8 w-8"
                            onClick={() => toggleVideo(slide.id)}
                          >
                            {videoStates[slide.id]?.playing ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="p-2 h-8 w-8"
                            onClick={() => toggleVideoMute(slide.id)}
                          >
                            {videoStates[slide.id]?.muted ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Slide Content */}
                    <div className="space-y-4">
                      {slide.content}
                      {slide.personalizedContent && userLocation && slide.personalizedContent(userLocation)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            {currentSlide < slides.length - 1 && (
              <Button variant="ghost" onClick={() => setShowSkipDialog(true)}>
                Skip
              </Button>
            )}
          </div>

          {currentSlide < slides.length - 1 ? (
            <Button
              onClick={nextSlide}
              className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary-light"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={completeOnboarding}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600"
            >
              <span>Get Started</span>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Permission Details Dialog */}
        <Dialog 
          open={showPermissionDetails !== null} 
          onOpenChange={() => setShowPermissionDetails(null)}
        >
          <DialogContent>
            {showPermissionDetails && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {permissions.find(p => p.id === showPermissionDetails)?.icon}
                    {permissions.find(p => p.id === showPermissionDetails)?.name}
                  </DialogTitle>
                  <DialogDescription>
                    {permissions.find(p => p.id === showPermissionDetails)?.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Benefits:</h4>
                    <ul className="space-y-1">
                      {permissions.find(p => p.id === showPermissionDetails)?.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPermissionDetails(null)}
                      className="flex-1"
                    >
                      Maybe Later
                    </Button>
                    <Button
                      onClick={() => {
                        handlePermissionToggle(showPermissionDetails);
                        setShowPermissionDetails(null);
                      }}
                      className="flex-1"
                    >
                      Allow Access
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Welcome;