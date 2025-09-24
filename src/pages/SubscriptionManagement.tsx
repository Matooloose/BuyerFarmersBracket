import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  Calendar,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Star,
  Edit,
  Trash2,
  Plus,
  Pause,
  Play,
  RefreshCw,
  Gift,
  Zap,
  TrendingUp,
  History,
  Settings,
  Bell,
  Users,
  Leaf,
  Apple,
  Carrot,
  Wheat,
  Milk,
  Heart,
  ShoppingCart,
  MapPin,
  Truck,
  DollarSign,
  Percent,
  Download,
  Upload,
  Copy,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatDistanceToNow, addDays, addWeeks, addMonths, format } from 'date-fns';

interface Subscription {
  id: string;
  name: string;
  description: string;
  farmer: {
    id: string;
    name: string;
    image_url?: string;
    farm_name: string;
    location: string;
  };
  products: {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    image_url?: string;
  }[];
  pricing: {
    base_price: number;
    discount_percentage: number;
    discounted_price: number;
    currency: string;
  };
  schedule: {
    frequency: 'weekly' | 'bi_weekly' | 'monthly';
    delivery_day: string;
    delivery_time: string;
    next_delivery: string;
  };
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  payment_method: {
    id: string;
    type: string;
    display_name: string;
    last_four?: string;
  };
  delivery_address: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
    instructions?: string;
  };
  preferences: {
    auto_renew: boolean;
    skip_if_unavailable: boolean;
    substitute_allowed: boolean;
    delivery_notifications: boolean;
  };
  statistics: {
    total_deliveries: number;
    successful_deliveries: number;
    total_spent: number;
    total_savings: number;
  };
  created_at: string;
  updated_at: string;
  next_billing_date: string;
  end_date?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  farmer: {
    id: string;
    name: string;
    farm_name: string;
    image_url?: string;
    rating: number;
    location: string;
  };
  category: string;
  products: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
  pricing: {
    weekly_price: number;
    monthly_price: number;
    discount_percentage: number;
    currency: string;
  };
  features: string[];
  delivery_options: {
    frequency: ('weekly' | 'bi_weekly' | 'monthly')[];
    delivery_days: string[];
    time_slots: string[];
  };
  minimum_commitment: number; // in weeks
  customizable: boolean;
  popular: boolean;
  created_at: string;
}

interface SubscriptionDelivery {
  id: string;
  subscription_id: string;
  delivery_date: string;
  status: 'scheduled' | 'preparing' | 'delivered' | 'missed' | 'cancelled';
  products: {
    id: string;
    name: string;
    quantity: number;
    delivered_quantity: number;
    substituted?: boolean;
    substitute_product?: string;
  }[];
  delivery_notes?: string;
  rating?: number;
  feedback?: string;
  total_amount: number;
}

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<SubscriptionDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-subscriptions' | 'browse-plans' | 'delivery-history' | 'settings'>('my-subscriptions');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showCreateCustom, setShowCreateCustom] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'price' | 'rating'>('popularity');

  const [customSubscription, setCustomSubscription] = useState({
    name: '',
    frequency: 'weekly' as 'weekly' | 'bi_weekly' | 'monthly',
    delivery_day: 'monday',
    products: [] as { id: string; name: string; quantity: number; unit: string; price: number }[],
    farmer_id: '',
    delivery_address: ''
  });

  const categories = [
    { id: 'vegetables', name: 'Vegetables', icon: Carrot },
    { id: 'fruits', name: 'Fruits', icon: Apple },
    { id: 'dairy', name: 'Dairy', icon: Milk },
    { id: 'grains', name: 'Grains', icon: Wheat },
    { id: 'mixed', name: 'Mixed Box', icon: Package },
    { id: 'organic', name: 'Organic', icon: Leaf }
  ];

  const deliveryDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly', description: 'Every week' },
    { value: 'bi_weekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Once a month' }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadSubscriptions();
    loadAvailablePlans();
    loadDeliveryHistory();
  }, [user]);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      // No subscription tables exist - show empty state
      setSubscriptions([]);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: "Error Loading Subscriptions",
        description: "Failed to load your subscriptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      // No subscription plan tables exist - show empty state
      setAvailablePlans([]);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const loadDeliveryHistory = async () => {
    try {
      // No delivery history tables exist - show empty state
      setDeliveryHistory([]);
    } catch (error) {
      console.error('Error loading delivery history:', error);
    }
  };

  const pauseSubscription = async (subscriptionId: string) => {
    try {
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: 'paused' as const } : sub
      ));

      toast({
        title: "Subscription Paused",
        description: "Your subscription has been paused. You can resume it anytime.",
      });
    } catch (error) {
      toast({
        title: "Error Pausing Subscription",
        description: "Failed to pause subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    try {
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: 'active' as const } : sub
      ));

      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed and will continue as scheduled.",
      });
    } catch (error) {
      toast({
        title: "Error Resuming Subscription",
        description: "Failed to resume subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: 'cancelled' as const } : sub
      ));

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You won't be charged again.",
      });
    } catch (error) {
      toast({
        title: "Error Cancelling Subscription",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const subscribeToPlan = async (planId: string) => {
    try {
      navigate(`/payment-processing?context=subscription&plan_id=${planId}`);
    } catch (error) {
      toast({
        title: "Error Starting Subscription",
        description: "Failed to start subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : Package;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Subscriptions</h1>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-sm">
            {subscriptions.filter(s => s.status === 'active').length} active
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="my-subscriptions" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Subscriptions
            </TabsTrigger>
            <TabsTrigger value="browse-plans" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Browse Plans
            </TabsTrigger>
            <TabsTrigger value="delivery-history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Deliveries
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* My Subscriptions Tab */}
          <TabsContent value="my-subscriptions" className="space-y-6">
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Active Subscriptions</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Subscribe to regular deliveries from your favorite farms to save time and money.
                </p>
                <Button onClick={() => setActiveTab('browse-plans')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Subscription Plans
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {subscriptions.map((subscription) => (
                  <Card key={subscription.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={subscription.farmer.image_url} />
                              <AvatarFallback>
                                <Leaf className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold">{subscription.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                from {subscription.farmer.farm_name}
                              </p>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(subscription.status)}
                                <Badge className={getStatusColor(subscription.status)}>
                                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {subscription.schedule.frequency}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              R{subscription.pricing.discounted_price.toFixed(2)}
                            </div>
                            {subscription.pricing.discount_percentage > 0 && (
                              <div className="text-sm text-muted-foreground">
                                <span className="line-through">R{subscription.pricing.base_price.toFixed(2)}</span>
                                <span className="ml-2 text-green-600">
                                  {subscription.pricing.discount_percentage}% off
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Next Delivery */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-blue-900">Next Delivery</p>
                                <p className="text-sm text-blue-700">
                                  {format(new Date(subscription.schedule.next_delivery), 'EEEE, MMMM d')} • {subscription.schedule.delivery_time}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-blue-700">
                              <MapPin className="h-4 w-4" />
                              {subscription.delivery_address.city}
                            </div>
                          </div>
                        </div>

                        {/* Products */}
                        <div>
                          <h4 className="font-medium mb-3">Included Products</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {subscription.products.map((product) => (
                              <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={product.image_url} />
                                  <AvatarFallback>
                                    {React.createElement(getCategoryIcon(product.category), { className: "h-5 w-5" })}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {product.quantity} {product.unit} • R{product.price_per_unit}/{product.unit}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                              {subscription.statistics.total_deliveries}
                            </div>
                            <div className="text-sm text-muted-foreground">Deliveries</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              R{subscription.statistics.total_savings.toFixed(0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Saved</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              R{subscription.statistics.total_spent.toFixed(0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Spent</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                              {Math.round((subscription.statistics.successful_deliveries / subscription.statistics.total_deliveries) * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Success Rate</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                          {subscription.status === 'active' && (
                            <Button 
                              variant="outline" 
                              onClick={() => pauseSubscription(subscription.id)}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </Button>
                          )}
                          {subscription.status === 'paused' && (
                            <Button 
                              variant="default" 
                              onClick={() => resumeSubscription(subscription.id)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </Button>
                          )}
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Modify
                          </Button>
                          <Button variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />
                            Skip Next
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => cancelSubscription(subscription.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button variant="outline">
                            <Share2 className="h-4 w-4 mr-2" />
                            Gift
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Browse Plans Tab */}
          <TabsContent value="browse-plans" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Category:</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label>Sort by:</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availablePlans.map((plan) => (
                <Card key={plan.id} className="relative">
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={plan.farmer.image_url} />
                          <AvatarFallback>
                            {React.createElement(getCategoryIcon(plan.category), { className: "h-5 w-5" })}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">{plan.farmer.farm_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {plan.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">R{plan.pricing.weekly_price}</div>
                        <div className="text-xs text-muted-foreground">per week</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    
                    {/* Products */}
                    <div>
                      <h5 className="font-medium mb-2">What's included:</h5>
                      <div className="space-y-2">
                        {plan.products.map((product) => (
                          <div key={product.id} className="flex justify-between text-sm">
                            <span>{product.name}</span>
                            <span className="text-muted-foreground">
                              {product.quantity} {product.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div>
                      <h5 className="font-medium mb-2">Features:</h5>
                      <div className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Pricing */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Monthly Price:</span>
                        <div className="text-right">
                          <span className="text-lg font-bold">R{plan.pricing.monthly_price}</span>
                          {plan.pricing.discount_percentage > 0 && (
                            <div className="text-sm text-green-600">
                              Save {plan.pricing.discount_percentage}%
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Minimum {plan.minimum_commitment} weeks commitment
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={() => subscribeToPlan(plan.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Subscribe Now
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Delivery History Tab */}
          <TabsContent value="delivery-history" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Delivery History</h2>
                <p className="text-muted-foreground">Track all your subscription deliveries</p>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export History
              </Button>
            </div>

            <div className="space-y-4">
              {deliveryHistory.map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              Delivery #{delivery.id.split('-')[1]}
                            </h3>
                            <Badge className={
                              delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              delivery.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              delivery.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(delivery.delivery_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold">R{delivery.total_amount.toFixed(2)}</div>
                        {delivery.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < delivery.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-2 mb-4">
                      {delivery.products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span>{product.name}</span>
                            {product.substituted && (
                              <Badge variant="outline" className="text-xs">
                                Substituted
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {product.delivered_quantity}/{product.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {delivery.delivery_notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">{delivery.delivery_notes}</p>
                      </div>
                    )}

                    {delivery.feedback && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 italic">"{delivery.feedback}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Preferences</CardTitle>
                <CardDescription>
                  Configure default settings for your subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-renew-default">Auto-renew by Default</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically renew new subscriptions
                    </p>
                  </div>
                  <Switch id="auto-renew-default" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="substitutions-default">Allow Substitutions</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow farmers to substitute unavailable items
                    </p>
                  </div>
                  <Switch id="substitutions-default" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="delivery-notifications">Delivery Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming deliveries
                    </p>
                  </div>
                  <Switch id="delivery-notifications" defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-delivery-time">Preferred Delivery Time</Label>
                  <Select defaultValue="morning">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12PM - 4PM)</SelectItem>
                      <SelectItem value="evening">Evening (4PM - 8PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing & Payments</CardTitle>
                <CardDescription>
                  Manage your subscription billing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card1">Visa ending in 4242</SelectItem>
                      <SelectItem value="bank1">Standard Bank Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-receipts">Email Receipts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email receipts for subscription payments
                    </p>
                  </div>
                  <Switch id="email-receipts" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payment-reminders">Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded before subscription renewals
                    </p>
                  </div>
                  <Switch id="payment-reminders" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SubscriptionManagement;