import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Leaf, 
  ShoppingCart, 
  Package, 
  MessageCircle, 
  CreditCard,
  Search,
  Calendar,
  Smartphone,
  Globe,
  Play,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Award,
  HelpCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Star,
  Filter,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

// Enhanced interfaces
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  videoUrl?: string;
  imageUrl?: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  completed?: boolean;
  tips: string[];
  commonMistakes: string[];
  nextSteps: string[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: TutorialStep[];
  prerequisites?: string[];
  tools?: string[];
  featured?: boolean;
}

interface CommunityQuestion {
  id: string;
  question: string;
  answer: string;
  author: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down';
  verified: boolean;
  createdAt: string;
  helpful: number;
  replies: CommunityReply[];
}

interface CommunityReply {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  helpful: number;
  verified?: boolean;
}

const HowItWorks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core state
  const [activeTab, setActiveTab] = useState('tutorials');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Dialog states
  const [isTutorialDialogOpen, setIsTutorialDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);

  // Form states
  const [newQuestion, setNewQuestion] = useState('');
  const [questionCategory, setQuestionCategory] = useState('');

  // Tutorial data
  const tutorials: Tutorial[] = [
    {
      id: 'getting-started',
      title: 'Getting Started Guide',
      description: 'Complete beginner tutorial for new users',
      category: 'Basics',
      duration: 15,
      difficulty: 'beginner',
      featured: true,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to FarmersBracket',
          description: 'Learn about our platform and what makes us special',
          icon: Leaf,
          duration: 3,
          difficulty: 'beginner',
          category: 'Introduction',
          tips: [
            'Take your time to explore each section',
            'Use the search feature to find specific farms',
            'Check farmer ratings and reviews'
          ],
          commonMistakes: [
            'Skipping the profile setup',
            'Not reading delivery policies',
            'Forgetting to check seasonal availability'
          ],
          nextSteps: [
            'Complete your profile',
            'Browse featured farms',
            'Read about our quality guarantee'
          ]
        },
        {
          id: 'browse-products',
          title: 'Browsing Fresh Produce',
          description: 'Discover how to find the best products for your needs',
          icon: Search,
          duration: 5,
          difficulty: 'beginner',
          category: 'Shopping',
          tips: [
            'Use filters to narrow down options',
            'Check seasonal recommendations',
            'Read product descriptions carefully'
          ],
          commonMistakes: [
            'Not checking delivery areas',
            'Ignoring organic certifications',
            'Missing bulk pricing options'
          ],
          nextSteps: [
            'Create your wishlist',
            'Set up price alerts',
            'Follow your favorite farms'
          ]
        },
        {
          id: 'place-order',
          title: 'Placing Your First Order',
          description: 'Step-by-step guide to completing your purchase',
          icon: ShoppingCart,
          duration: 7,
          difficulty: 'beginner',
          category: 'Orders',
          tips: [
            'Review quantities before checkout',
            'Choose the right delivery option',
            'Save payment methods for faster checkout'
          ],
          commonMistakes: [
            'Not applying available discounts',
            'Missing delivery instructions',
            'Forgetting to confirm order details'
          ],
          nextSteps: [
            'Track your order',
            'Prepare for delivery',
            'Rate your experience'
          ]
        }
      ]
    },
    {
      id: 'advanced-shopping',
      title: 'Advanced Shopping Features',
      description: 'Master the advanced features for power users',
      category: 'Advanced',
      duration: 25,
      difficulty: 'advanced',
      steps: [
        {
          id: 'subscriptions',
          title: 'Setting Up Subscriptions',
          description: 'Create recurring orders for your favorite products',
          icon: Calendar,
          duration: 8,
          difficulty: 'intermediate',
          category: 'Subscriptions',
          tips: [
            'Start with small quantities',
            'Choose flexible delivery dates',
            'Monitor seasonal availability'
          ],
          commonMistakes: [
            'Over-subscribing initially',
            'Not adjusting for seasons',
            'Forgetting to update quantities'
          ],
          nextSteps: [
            'Set up notifications',
            'Create backup preferences',
            'Monitor subscription analytics'
          ]
        },
        {
          id: 'bulk-ordering',
          title: 'Bulk Ordering for Families',
          description: 'Learn to order efficiently for larger households',
          icon: Package,
          duration: 10,
          difficulty: 'intermediate',
          category: 'Orders',
          tips: [
            'Calculate weekly consumption',
            'Consider storage capacity',
            'Look for bulk discounts'
          ],
          commonMistakes: [
            'Ordering too much at once',
            'Not checking storage requirements',
            'Missing group buying opportunities'
          ],
          nextSteps: [
            'Set up family profiles',
            'Create shopping lists',
            'Join community groups'
          ]
        },
        {
          id: 'farmer-relationships',
          title: 'Building Farmer Relationships',
          description: 'Connect directly with your favorite farmers',
          icon: MessageCircle,
          duration: 7,
          difficulty: 'advanced',
          category: 'Community',
          tips: [
            'Ask about farming practices',
            'Request custom orders',
            'Provide feedback regularly'
          ],
          commonMistakes: [
            'Being too demanding',
            'Not respecting farming seasons',
            'Forgetting to communicate changes'
          ],
          nextSteps: [
            'Visit farms in person',
            'Join farmer newsletters',
            'Participate in farm events'
          ]
        }
      ]
    },
    {
      id: 'mobile-app',
      title: 'Mobile App Mastery',
      description: 'Get the most out of our mobile application',
      category: 'Mobile',
      duration: 20,
      difficulty: 'intermediate',
      steps: [
        {
          id: 'app-setup',
          title: 'Setting Up the Mobile App',
          description: 'Configure notifications and preferences',
          icon: Smartphone,
          duration: 5,
          difficulty: 'beginner',
          category: 'Setup',
          tips: [
            'Enable location services',
            'Set up notifications',
            'Sync with your account'
          ],
          commonMistakes: [
            'Disabling important notifications',
            'Not syncing preferences',
            'Missing location permissions'
          ],
          nextSteps: [
            'Customize your dashboard',
            'Set up quick orders',
            'Enable biometric login'
          ]
        },
        {
          id: 'offline-features',
          title: 'Using Offline Features',
          description: 'Shop even without internet connection',
          icon: Globe,
          duration: 8,
          difficulty: 'intermediate',
          category: 'Features',
          tips: [
            'Cache favorite products',
            'Save shopping lists',
            'Download farm information'
          ],
          commonMistakes: [
            'Not updating cache regularly',
            'Missing sync opportunities',
            'Forgetting to check for updates'
          ],
          nextSteps: [
            'Set up auto-sync',
            'Manage storage space',
            'Configure sync preferences'
          ]
        },
        {
          id: 'mobile-payments',
          title: 'Mobile Payment Options',
          description: 'Secure and fast payment methods on mobile',
          icon: CreditCard,
          duration: 7,
          difficulty: 'intermediate',
          category: 'Payments',
          tips: [
            'Set up payment shortcuts',
            'Enable biometric authentication',
            'Use mobile wallets'
          ],
          commonMistakes: [
            'Not securing payment methods',
            'Missing payment confirmations',
            'Forgetting to update card details'
          ],
          nextSteps: [
            'Set up auto-pay',
            'Monitor transactions',
            'Enable spending alerts'
          ]
        }
      ]
    }
  ];

  // Community Q&A data
  const communityQuestions: CommunityQuestion[] = [
    {
      id: 'q1',
      question: 'How do I know if a farm is organic certified?',
      answer: 'Look for the green "Organic Certified" badge on product listings. You can also check the farm\'s profile page for certification details and documentation.',
      author: 'Sarah Miller',
      authorAvatar: '',
      category: 'Organic',
      tags: ['organic', 'certification', 'quality'],
      upvotes: 24,
      downvotes: 2,
      verified: true,
      createdAt: '2025-09-20',
      helpful: 89,
      replies: [
        {
          id: 'r1',
          content: 'Also, you can filter products by "Organic" in the search filters to see only certified organic options.',
          author: 'Farm Expert',
          createdAt: '2025-09-20',
          helpful: 12,
          verified: true
        }
      ]
    },
    {
      id: 'q2',
      question: 'What happens if my delivery is delayed?',
      answer: 'You\'ll receive automatic notifications about any delays. Most farms offer compensation or replacement for significantly delayed orders. Contact the farm directly or our support team.',
      author: 'Mike Johnson',
      category: 'Delivery',
      tags: ['delivery', 'delays', 'support'],
      upvotes: 18,
      downvotes: 1,
      verified: true,
      createdAt: '2025-09-19',
      helpful: 76,
      replies: []
    },
    {
      id: 'q3',
      question: 'Can I customize my subscription orders?',
      answer: 'Yes! You can pause, modify quantities, skip deliveries, or change products in your subscription at any time. Visit the Subscriptions page to manage all your recurring orders.',
      author: 'Emma Davis',
      category: 'Subscriptions',
      tags: ['subscriptions', 'customization', 'recurring'],
      upvotes: 31,
      downvotes: 0,
      verified: true,
      createdAt: '2025-09-18',
      helpful: 95,
      replies: [
        {
          id: 'r2',
          content: 'You can also set seasonal preferences so your subscription automatically adjusts for different times of year.',
          author: 'Subscription Pro',
          createdAt: '2025-09-18',
          helpful: 8
        }
      ]
    },
    {
      id: 'q4',
      question: 'How do I find farms near me?',
      answer: 'Use the location filter or enable GPS to automatically show farms in your delivery area. You can also search by postal code or area name.',
      author: 'Local Foodie',
      category: 'Location',
      tags: ['location', 'nearby', 'delivery'],
      upvotes: 15,
      downvotes: 0,
      verified: false,
      createdAt: '2025-09-17',
      helpful: 67,
      replies: []
    }
  ];

  const categories = ['all', 'Basics', 'Advanced', 'Mobile', 'Payments', 'Community'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];
  const questionCategories = ['General', 'Organic', 'Delivery', 'Subscriptions', 'Location', 'Payments', 'Mobile'];

  useEffect(() => {
    // Load user progress
    const savedProgress = localStorage.getItem('tutorialProgress');
    if (savedProgress) {
      setCompletedSteps(new Set(JSON.parse(savedProgress)));
    }
  }, []);

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || tutorial.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const filteredQuestions = communityQuestions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || question.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleStartTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setCurrentStep(0);
    setIsTutorialDialogOpen(true);
  };

  const handleCompleteStep = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    
    // Save progress
    localStorage.setItem('tutorialProgress', JSON.stringify(Array.from(newCompleted)));
    
    toast({
      title: "Step completed!",
      description: "Great job! You're making progress.",
    });
  };

  const handleNextStep = () => {
    if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleVoteQuestion = (questionId: string, voteType: 'up' | 'down') => {
    // In real app, send vote to backend
    toast({
      title: "Vote recorded",
      description: `Thanks for your ${voteType}vote!`,
    });
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim() || !questionCategory) {
      toast({
        title: "Missing information",
        description: "Please provide a question and select a category",
        variant: "destructive"
      });
      return;
    }

    // In real app, submit to backend
    toast({
      title: "Question submitted",
      description: "Your question will be answered by our community experts",
    });
    
    setIsQuestionDialogOpen(false);
    setNewQuestion('');
    setQuestionCategory('');
  };

  const getTutorialProgress = (tutorial: Tutorial) => {
    const completed = tutorial.steps.filter(step => completedSteps.has(step.id)).length;
    return (completed / tutorial.steps.length) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  // Legacy step data for backward compatibility
  const steps = [
    {
      icon: <Leaf className="h-8 w-8 text-primary" />,
      title: "Browse Fresh Produce",
      description: "Discover fresh, local produce from verified farmers in your area. Filter by organic, seasonal, or category preferences."
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      title: "Add to Cart",
      description: "Select your desired quantities and add items to your cart. See real-time availability and pricing from each farm."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      title: "Secure Checkout",
      description: "Complete your purchase with secure payment options. Choose delivery or pickup based on farmer availability."
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Track Your Order",
      description: "Monitor your order status from harvest to delivery. Get notifications when your fresh produce is ready."
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: "Connect with Farmers",
      description: "Chat directly with farmers about their products, farming practices, and get personalized recommendations."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">How It Works</h1>
                <p className="text-sm text-muted-foreground">Learn everything about FarmersBracket</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsQuestionDialogOpen(true)}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Ask Question
              </Button>
              <Button size="sm" onClick={() => navigate('/browse-products')}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Start Shopping
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Welcome Hero */}
        <Card className="mb-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to FarmersBracket</h2>
                <p className="text-primary-foreground/90 mb-4">
                  Your complete guide to connecting with local farmers and enjoying fresh produce
                </p>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>1,000+ Active Users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>500+ Local Farms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>99% Satisfaction</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <Leaf className="h-24 w-24 text-primary-foreground/30" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={activeTab === 'tutorials' ? "Search tutorials..." : "Search questions..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(activeTab === 'tutorials' ? categories : questionCategories).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {activeTab === 'tutorials' && (
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tutorials">Interactive Tutorials</TabsTrigger>
            <TabsTrigger value="community">Community Q&A</TabsTrigger>
          </TabsList>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-6">
            {/* Featured Tutorials */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Featured Tutorials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tutorials.filter(t => t.featured).map((tutorial) => (
                  <Card key={tutorial.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge className={getDifficultyColor(tutorial.difficulty)}>
                          {tutorial.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {tutorial.duration}m
                        </div>
                      </div>
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                      <CardDescription>{tutorial.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round(getTutorialProgress(tutorial))}%</span>
                          </div>
                          <Progress value={getTutorialProgress(tutorial)} className="h-2" />
                        </div>
                        <Button 
                          onClick={() => handleStartTutorial(tutorial)}
                          className="w-full"
                          variant={getTutorialProgress(tutorial) > 0 ? "outline" : "default"}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {getTutorialProgress(tutorial) > 0 ? 'Continue' : 'Start'} Tutorial
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Tutorials */}
            <div>
              <h3 className="text-xl font-semibold mb-4">All Tutorials</h3>
              <div className="space-y-4">
                {filteredTutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{tutorial.title}</h4>
                            <Badge className={getDifficultyColor(tutorial.difficulty)}>
                              {tutorial.difficulty}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {tutorial.duration}m
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-3">{tutorial.description}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16">
                                <Progress value={getTutorialProgress(tutorial)} className="h-2" />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(getTutorialProgress(tutorial))}% complete
                              </span>
                            </div>
                            <Badge variant="outline">{tutorial.category}</Badge>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button 
                            onClick={() => handleStartTutorial(tutorial)}
                            variant={getTutorialProgress(tutorial) > 0 ? "outline" : "default"}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {getTutorialProgress(tutorial) > 0 ? 'Continue' : 'Start'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Start Steps (Legacy) */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Start Guide</h3>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            {step.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-primary bg-primary/10 rounded-full px-2 py-1">
                              Step {index + 1}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">247</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">189</div>
                  <div className="text-sm text-muted-foreground">Answered</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">4.8</div>
                  <div className="text-sm text-muted-foreground">Avg. Rating</div>
                </CardContent>
              </Card>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Question Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{question.question}</h4>
                            {question.verified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span>by {question.author}</span>
                            <span>{formatTimeAgo(question.createdAt)}</span>
                            <Badge variant="outline">{question.category}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {question.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-foreground">{question.answer}</p>
                      </div>

                      {/* Voting and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVoteQuestion(question.id, 'up')}
                              className="text-muted-foreground hover:text-green-600"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {question.upvotes}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVoteQuestion(question.id, 'down')}
                              className="text-muted-foreground hover:text-red-600"
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              {question.downvotes}
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {question.helpful}% found this helpful
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {question.replies.length > 0 && (
                            <Badge variant="outline">
                              {question.replies.length} replies
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Replies */}
                      {question.replies.length > 0 && (
                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                          {question.replies.map((reply) => (
                            <div key={reply.id} className="bg-muted/30 p-3 rounded">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">{reply.author}</span>
                                {reply.verified && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                    Expert
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Benefits Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Why Choose FarmersBracket?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-primary mb-2">🌱</div>
                <h4 className="font-semibold mb-1">Fresh & Local</h4>
                <p className="text-sm text-muted-foreground">Direct from farm to your table</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-primary mb-2">🤝</div>
                <h4 className="font-semibold mb-1">Support Farmers</h4>
                <p className="text-sm text-muted-foreground">Help local farmers thrive</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-primary mb-2">💚</div>
                <h4 className="font-semibold mb-1">Sustainable</h4>
                <p className="text-sm text-muted-foreground">Environmentally responsible</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-primary mb-2">📱</div>
                <h4 className="font-semibold mb-1">Convenient</h4>
                <p className="text-sm text-muted-foreground">Easy ordering and delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4 mt-8">
          <Button onClick={() => navigate('/browse-products')} className="w-full">
            Start Shopping Fresh Produce
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </main>

      {/* Tutorial Dialog */}
      <Dialog open={isTutorialDialogOpen} onOpenChange={setIsTutorialDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              {selectedTutorial?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTutorial && (
            <div className="space-y-6 overflow-y-auto">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{currentStep + 1} of {selectedTutorial.steps.length}</span>
                </div>
                <Progress value={((currentStep + 1) / selectedTutorial.steps.length) * 100} />
              </div>

              {/* Current Step */}
              {selectedTutorial.steps[currentStep] && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {(() => {
                        const IconComponent = selectedTutorial.steps[currentStep].icon;
                        return <IconComponent className="h-8 w-8 text-primary" />;
                      })()}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {selectedTutorial.steps[currentStep].title}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedTutorial.steps[currentStep].description}
                    </p>
                  </div>

                  {/* Step Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tips */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Pro Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {selectedTutorial.steps[currentStep].tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Common Mistakes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Avoid These Mistakes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {selectedTutorial.steps[currentStep].commonMistakes.map((mistake, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                              {mistake}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Next Steps */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          Next Steps
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {selectedTutorial.steps[currentStep].nextSteps.map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (selectedTutorial) {
                    handleCompleteStep(selectedTutorial.steps[currentStep].id);
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!selectedTutorial || currentStep === selectedTutorial.steps.length - 1}
                className="flex-1"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsTutorialDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ask Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask the Community</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="questionCategory">Category</Label>
              <Select value={questionCategory} onValueChange={setQuestionCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {questionCategories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="newQuestion">Your Question</Label>
              <Textarea
                id="newQuestion"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What would you like to know about FarmersBracket?"
                rows={4}
              />
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tips for great questions:</strong>
                <br />• Be specific and clear
                <br />• Include relevant details
                <br />• Search existing questions first
                <br />• Use appropriate tags
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitQuestion}>
              <Send className="h-4 w-4 mr-2" />
              Submit Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HowItWorks;