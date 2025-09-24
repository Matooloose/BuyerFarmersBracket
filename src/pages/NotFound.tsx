import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Home, 
  ShoppingCart, 
  User, 
  Package, 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  Heart, 
  Calendar, 
  MapPin, 
  Settings, 
  Compass, 
  Navigation, 
  Gamepad2, 
  Flag, 
  MessageSquare, 
  Copy, 
  Share2, 
  Phone, 
  Mail, 
  ExternalLink,
  Star,
  Clock,
  Zap,
  Award,
  Gift,
  Sparkles,
  TrendingUp
} from "lucide-react";

// Enhanced interfaces
interface PageSuggestion {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  relevanceScore: number;
  icon: any;
  isPopular?: boolean;
  isNew?: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  type: 'page' | 'product' | 'farmer' | 'help';
}

interface BrokenLinkReport {
  url: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
  description: string;
  expectedContent: string;
  contactInfo: string;
}

interface NavigationShortcut {
  id: string;
  label: string;
  url: string;
  icon: any;
  category: string;
  description: string;
  keyboardShortcut?: string;
}

interface InteractiveElement {
  id: string;
  type: 'easter_egg' | 'game' | 'animation' | 'reward';
  title: string;
  description: string;
  action: () => void;
  unlocked: boolean;
  points?: number;
}

interface FeedbackData {
  type: 'helpful' | 'not_helpful' | 'suggestion';
  suggestion?: string;
  contact?: string;
  category?: string;
  rating?: number;
}

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Core state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [interactionCount, setInteractionCount] = useState(0);

  // Dialog states
  const [isBrokenLinkDialogOpen, setIsBrokenLinkDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);

  // Form states
  const [brokenLinkReport, setBrokenLinkReport] = useState<Partial<BrokenLinkReport>>({
    url: location.pathname,
    referrer: document.referrer || 'Direct navigation',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });

  const [feedbackData, setFeedbackData] = useState<Partial<FeedbackData>>({});

  // Interactive elements state
  const [unlockedElements, setUnlockedElements] = useState<string[]>([]);
  const [easterEggFound, setEasterEggFound] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  // Smart suggestions data
  const pageSuggestions: PageSuggestion[] = [
    {
      id: '1',
      title: 'Browse Fresh Products',
      description: 'Discover local farmers and their fresh produce',
      url: '/browse-products',
      category: 'shopping',
      relevanceScore: 0.95,
      icon: ShoppingCart,
      isPopular: true
    },
    {
      id: '2',
      title: 'Your Dashboard',
      description: 'View your orders, subscriptions, and account',
      url: '/dashboard',
      category: 'account',
      relevanceScore: 0.92,
      icon: User,
      isPopular: true
    },
    {
      id: '3',
      title: 'Order History',
      description: 'Track your past and current orders',
      url: '/order-history',
      category: 'orders',
      relevanceScore: 0.89,
      icon: Package
    },
    {
      id: '4',
      title: 'Help & Support',
      description: 'Get help with your account and orders',
      url: '/contact-support',
      category: 'help',
      relevanceScore: 0.87,
      icon: HelpCircle
    },
    {
      id: '5',
      title: 'How It Works',
      description: 'Learn how our platform connects you with farmers',
      url: '/how-it-works',
      category: 'help',
      relevanceScore: 0.85,
      icon: BookOpen,
      isNew: true
    },
    {
      id: '6',
      title: 'FAQ',
      description: 'Frequently asked questions and answers',
      url: '/faq',
      category: 'help',
      relevanceScore: 0.83,
      icon: Lightbulb
    },
    {
      id: '7',
      title: 'Wishlist',
      description: 'Your saved favorite products',
      url: '/wishlist',
      category: 'shopping',
      relevanceScore: 0.81,
      icon: Heart
    },
    {
      id: '8',
      title: 'Subscriptions',
      description: 'Manage your recurring orders',
      url: '/subscriptions',
      category: 'account',
      relevanceScore: 0.79,
      icon: Calendar
    },
    {
      id: '9',
      title: 'Shopping Cart',
      description: 'Review items in your cart',
      url: '/cart',
      category: 'shopping',
      relevanceScore: 0.77,
      icon: ShoppingCart
    },
    {
      id: '10',
      title: 'Track Your Order',
      description: 'Real-time tracking of your deliveries',
      url: '/track-order',
      category: 'orders',
      relevanceScore: 0.75,
      icon: MapPin
    }
  ];

  const navigationShortcuts: NavigationShortcut[] = [
    {
      id: 'home',
      label: 'Home',
      url: '/',
      icon: Home,
      category: 'main',
      description: 'Return to homepage',
      keyboardShortcut: 'Alt+H'
    },
    {
      id: 'products',
      label: 'Browse Products',
      url: '/browse-products',
      icon: ShoppingCart,
      category: 'shopping',
      description: 'Explore fresh produce'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      url: '/dashboard',
      icon: User,
      category: 'account',
      description: 'Your account overview'
    },
    {
      id: 'orders',
      label: 'Orders',
      url: '/order-history',
      icon: Package,
      category: 'account',
      description: 'Order history and tracking'
    },
    {
      id: 'support',
      label: 'Support',
      url: '/contact-support',
      icon: HelpCircle,
      category: 'help',
      description: 'Get help and support'
    },
    {
      id: 'settings',
      label: 'Settings',
      url: '/update-profile',
      icon: Settings,
      category: 'account',
      description: 'Account settings'
    }
  ];

  const interactiveElements: InteractiveElement[] = [
    {
      id: 'easter_egg',
      type: 'easter_egg',
      title: 'Hidden Farm',
      description: 'You found our secret digital farm!',
      action: () => triggerEasterEgg(),
      unlocked: false,
      points: 50
    },
    {
      id: 'click_game',
      type: 'game',
      title: 'Vegetable Clicker',
      description: 'Click to grow vegetables while you wait!',
      action: () => setIsGameDialogOpen(true),
      unlocked: false,
      points: 10
    },
    {
      id: 'confetti_celebration',
      type: 'animation',
      title: 'Celebration Mode',
      description: 'Turn this error into a party!',
      action: () => triggerConfetti(),
      unlocked: false,
      points: 25
    },
    {
      id: 'helpful_reward',
      type: 'reward',
      title: 'Helper Badge',
      description: 'Thanks for helping us improve!',
      action: () => showHelpfulReward(),
      unlocked: false,
      points: 75
    }
  ];

  // URL analysis for smart suggestions
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    analyzeURL();
    logPageNotFound();
    
    // Track user interactions
    const handleInteraction = () => {
      setInteractionCount(prev => {
        const newCount = prev + 1;
        if (newCount === 5 && !unlockedElements.includes('click_game')) {
          unlockElement('click_game');
        }
        if (newCount === 10 && !unlockedElements.includes('confetti_celebration')) {
          unlockElement('confetti_celebration');
        }
        return newCount;
      });
    };

    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, [location.pathname]);

  // Search functionality with debouncing
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const analyzeURL = () => {
    const path = location.pathname.toLowerCase();
    
    // Show suggestions based on URL patterns
    if (path.includes('product')) {
      setSelectedCategory('shopping');
    } else if (path.includes('order') || path.includes('track')) {
      setSelectedCategory('orders');
    } else if (path.includes('help') || path.includes('support') || path.includes('faq')) {
      setSelectedCategory('help');
    } else if (path.includes('profile') || path.includes('account') || path.includes('dashboard')) {
      setSelectedCategory('account');
    }
  };

  const logPageNotFound = () => {
    // Enhanced analytics logging
    console.log('404 Analytics:', {
      url: location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    
    // Simulate search - no backend search available, show empty results
    setTimeout(() => {
      setSearchResults([]);
      setIsSearching(false);
    }, 500);
  };

  const unlockElement = (elementId: string) => {
    if (!unlockedElements.includes(elementId)) {
      setUnlockedElements(prev => [...prev, elementId]);
      const element = interactiveElements.find(e => e.id === elementId);
      if (element) {
        toast({
          title: "🎉 Achievement Unlocked!",
          description: `${element.title} - ${element.description}`,
          duration: 4000
        });
      }
    }
  };

  const triggerEasterEgg = () => {
    if (!easterEggFound) {
      setEasterEggFound(true);
      
      toast({
        title: "🥕 Secret Farm Discovered!",
        description: "You found our hidden digital farm! Here's a special discount code: FARM404",
        duration: 6000
      });
      
      unlockElement('helpful_reward');
    }
  };

  const triggerConfetti = () => {
    toast({
      title: "🎊 Party Mode Activated!",
      description: "Every error is a chance to celebrate! Thanks for your positive attitude!",
      duration: 4000
    });
  };

  const showHelpfulReward = () => {
    toast({
      title: "🏆 Helper Badge Earned!",
      description: "Your feedback helps us improve. Thanks for being awesome!",
      duration: 5000
    });
  };

  const handleBrokenLinkReport = async () => {
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Report submitted",
        description: "Thanks for helping us improve! We'll investigate this broken link.",
        duration: 4000
      });
      
      setIsBrokenLinkDialogOpen(false);
      setBrokenLinkReport({
        url: location.pathname,
        referrer: document.referrer || 'Direct navigation',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      unlockElement('helpful_reward');
    }, 1000);
  };

  const handleFeedbackSubmit = async () => {
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Feedback received",
        description: "Thank you for your feedback! We appreciate your input.",
        duration: 4000
      });
      
      setIsFeedbackDialogOpen(false);
      setFeedbackData({});
      
      if (feedbackData.type === 'helpful') {
        unlockElement('helpful_reward');
      }
    }, 1000);
  };

  const copyCurrentURL = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "URL copied",
      description: "Current URL copied to clipboard",
      duration: 2000
    });
  };

  const shareCurrentPage = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Page Not Found - Farmers Bracket',
        text: 'Found an issue on Farmers Bracket',
        url: window.location.href
      });
    } else {
      copyCurrentURL();
    }
  };

  const filteredSuggestions = selectedCategory === 'all' 
    ? pageSuggestions 
    : pageSuggestions.filter(s => s.category === selectedCategory);

  const categorizedShortcuts = navigationShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, NavigationShortcut[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Fun Header with Interactive Elements */}
      <header className="relative overflow-hidden bg-white border-b shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-green-100/20" />
        
        <div className="container mx-auto px-4 py-6 relative">
          <div className="text-center space-y-4">
            <div className="relative">
              <h1 className="text-8xl font-bold text-primary mb-2">404</h1>
              
              {/* Hidden easter egg trigger */}
              <div 
                className="absolute top-0 right-0 w-8 h-8 cursor-pointer opacity-0 hover:opacity-20"
                onClick={() => triggerEasterEgg()}
                title="🥕"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Oops! Page Not Found</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Don't worry! Even the best farmers sometimes plant seeds in the wrong field. 
                Let's help you find what you're looking for.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/')} className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
              <Button variant="outline" onClick={() => navigate('/browse-products')} className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Browse Products
              </Button>
              <Button variant="outline" onClick={() => setIsBrokenLinkDialogOpen(true)} className="gap-2">
                <Flag className="h-4 w-4" />
                Report Issue
              </Button>
              <Button variant="outline" onClick={shareCurrentPage} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Live Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Our Platform
            </CardTitle>
            <CardDescription>
              Find pages, products, farmers, or help articles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-lg py-3"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(result.url)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{result.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.excerpt}</p>
                  </div>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="mt-4 text-center text-muted-foreground">
                <Clock className="h-5 w-5 mx-auto mb-2 animate-spin" />
                Searching...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Page Suggestions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>
              Based on your browsing history and the URL you tried to visit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Category filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === 'shopping' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('shopping')}
              >
                Shopping
              </Button>
              <Button
                variant={selectedCategory === 'account' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('account')}
              >
                Account
              </Button>
              <Button
                variant={selectedCategory === 'orders' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('orders')}
              >
                Orders
              </Button>
              <Button
                variant={selectedCategory === 'help' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('help')}
              >
                Help
              </Button>
            </div>

            {/* Suggestions grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuggestions.slice(0, 6).map((suggestion) => (
                <Card key={suggestion.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <suggestion.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                          {suggestion.isPopular && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                          {suggestion.isNew && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              <Sparkles className="h-3 w-3 mr-1" />
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => navigate(suggestion.url)}
                        >
                          Visit Page
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Shortcuts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Quick Navigation
            </CardTitle>
            <CardDescription>
              Fast access to popular sections of our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(categorizedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h4 className="font-semibold text-sm mb-3 capitalize">{category}</h4>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut) => (
                      <Button
                        key={shortcut.id}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto p-3"
                        onClick={() => navigate(shortcut.url)}
                      >
                        <shortcut.icon className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium text-sm">{shortcut.label}</div>
                          <div className="text-xs text-muted-foreground">{shortcut.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interactive Elements & Games */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              While You're Here...
              {interactionCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {interactionCount} interactions
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Turn this 404 into something fun! Discover hidden features and mini-games.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interactiveElements.map((element) => (
                <Card 
                  key={element.id} 
                  className={`cursor-pointer transition-all ${
                    unlockedElements.includes(element.id) 
                      ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{element.title}</h4>
                      {unlockedElements.includes(element.id) ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Award className="h-3 w-3 mr-1" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {element.points} pts
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{element.description}</p>
                    <Button
                      size="sm"
                      variant={unlockedElements.includes(element.id) ? "default" : "outline"}
                      className="w-full"
                      onClick={element.action}
                      disabled={!unlockedElements.includes(element.id) && element.type !== 'easter_egg'}
                    >
                      {unlockedElements.includes(element.id) ? 'Activate' : 'Locked'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Progress tracker */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Discovery Progress</span>
                <span className="text-sm text-muted-foreground">
                  {unlockedElements.length}/{interactiveElements.length}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className={`bg-blue-600 h-2 rounded-full transition-all duration-500 ${
                    unlockedElements.length === 0 ? 'w-0' :
                    unlockedElements.length === 1 ? 'w-1/4' :
                    unlockedElements.length === 2 ? 'w-2/4' :
                    unlockedElements.length === 3 ? 'w-3/4' : 'w-full'
                  }`}
                />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Keep interacting with the page to unlock more features! 
                {interactionCount < 5 && ` (${5 - interactionCount} more clicks to unlock first reward)`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help & Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Need Immediate Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/contact-support')}>
                  <MessageSquare className="h-4 w-4" />
                  Contact Support
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/faq')}>
                  <Lightbulb className="h-4 w-4" />
                  Browse FAQ
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/how-it-works')}>
                  <BookOpen className="h-4 w-4" />
                  How It Works
                </Button>
              </div>

              <div className="border-t pt-4">
                <h5 className="font-medium text-sm mb-2">Emergency Contact</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>+1 (555) 123-FARM</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>support@farmersbracket.com</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Help Us Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Was this page helpful in finding what you need?
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setFeedbackData({ type: 'helpful' });
                    handleFeedbackSubmit();
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Yes, helpful
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsFeedbackDialogOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Could be better
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsBrokenLinkDialogOpen(true)}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report Broken Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={copyCurrentURL}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Broken Link Report Dialog */}
      <Dialog open={isBrokenLinkDialogOpen} onOpenChange={setIsBrokenLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Report Broken Link
            </DialogTitle>
            <DialogDescription>
              Help us fix this issue by providing details about what you expected to find
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broken-url">URL</Label>
              <Input
                id="broken-url"
                value={brokenLinkReport.url}
                onChange={(e) => setBrokenLinkReport(prev => ({ ...prev, url: e.target.value }))}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected-content">What were you looking for?</Label>
              <Textarea
                id="expected-content"
                placeholder="Describe what you were looking for..."
                value={brokenLinkReport.expectedContent || ''}
                onChange={(e) => setBrokenLinkReport(prev => ({ ...prev, expectedContent: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-description">Additional details (optional)</Label>
              <Textarea
                id="issue-description"
                placeholder="Any other information that might help us..."
                value={brokenLinkReport.description || ''}
                onChange={(e) => setBrokenLinkReport(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Your report helps us improve the platform for everyone. Thank you for taking the time to help!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBrokenLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBrokenLinkReport}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Share Your Feedback
            </DialogTitle>
            <DialogDescription>
              Help us understand how we can improve this page
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>How would you rate this experience?</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={feedbackData.rating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedbackData(prev => ({ ...prev, rating }))}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>What type of feedback is this?</Label>
              <Select
                value={feedbackData.type}
                onValueChange={(value) => setFeedbackData(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">Suggestion for improvement</SelectItem>
                  <SelectItem value="not_helpful">Page wasn't helpful</SelectItem>
                  <SelectItem value="helpful">General feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-suggestion">Your feedback</Label>
              <Textarea
                id="feedback-suggestion"
                placeholder="Tell us how we can make this better..."
                value={feedbackData.suggestion || ''}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, suggestion: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-contact">Email (optional)</Label>
              <Input
                id="feedback-contact"
                type="email"
                placeholder="your@email.com"
                value={feedbackData.contact || ''}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, contact: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mini Game Dialog */}
      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Vegetable Clicker
            </DialogTitle>
            <DialogDescription>
              Click the vegetables to grow your farm while you wait!
            </DialogDescription>
          </DialogHeader>

          <div className="text-center space-y-6">
            <div className="text-4xl font-bold text-green-600">Score: {gameScore}</div>

            <div 
              className="text-6xl cursor-pointer hover:scale-110 transition-transform select-none"
              onClick={() => setGameScore(prev => prev + 1)}
            >
              🥕
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['🥬', '🌽', '🍅', '🥒', '🌶️', '🥔'].map((veggie, index) => (
                <div
                  key={index}
                  className="text-3xl cursor-pointer hover:scale-110 transition-transform select-none"
                  onClick={() => setGameScore(prev => prev + Math.floor(Math.random() * 3) + 1)}
                >
                  {veggie}
                </div>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              You've grown {gameScore} vegetables! 🌱
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsGameDialogOpen(false)} className="w-full">
              Back to Navigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotFound;
