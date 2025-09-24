import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, ArrowLeft, MessageCircle, Crown, Calendar, Zap, CreditCard, Settings, Gift, TrendingUp, Users, Clock, AlertTriangle, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, addMonths, differenceInDays } from "date-fns";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  features: string[];
  is_active: boolean | null;
}

interface UserSubscription {
  id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  subscription_plan_id: string;
  payment_method: string | null;
}

const Subscriptions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Dialog states
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setPlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features.map(String) : []
      })));
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      setUserSubscription(data);
    } catch (error) {
      console.error('Error fetching user subscription:', error);
    }
  };

  const handleSubscribe = async (planId: string, plan: SubscriptionPlan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const endDate = plan.duration_months > 0 
        ? new Date(Date.now() + plan.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          subscription_plan_id: planId,
          end_date: endDate,
          payment_method: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You can now access chat features!",
      });

      await fetchUserSubscription();
      setActiveTab('manage');
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', userSubscription.id);

      if (error) throw error;

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled",
      });

      setUserSubscription(null);
      setIsCancelDialogOpen(false);
      setActiveTab('plans');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  };

  const getPlanIcon = (name: string) => {
    if (name.toLowerCase().includes('monthly')) return <Calendar className="h-6 w-6" />;
    if (name.toLowerCase().includes('annual')) return <Crown className="h-6 w-6" />;
    return <Zap className="h-6 w-6" />;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(price);
  };

  const getCurrentPlan = () => {
    return plans.find(plan => plan.id === userSubscription?.subscription_plan_id);
  };

  const isSubscriptionActive = () => {
    if (!userSubscription) return false;
    if (userSubscription.status !== 'active') return false;
    if (!userSubscription.end_date) return true;
    return new Date(userSubscription.end_date) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="ml-2 text-lg font-semibold">Subscriptions</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Subscriptions</h1>
                <p className="text-sm text-muted-foreground">Manage your FarmFresh membership</p>
              </div>
            </div>
            
            {userSubscription && isSubscriptionActive() && (
              <Badge variant="outline" className="gap-2">
                <Crown className="h-4 w-4" />
                {getCurrentPlan()?.name || 'Active'}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            {/* Current Subscription Status */}
            {userSubscription && isSubscriptionActive() && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary">
                    <Check className="h-5 w-5 mr-2" />
                    Active Subscription
                  </CardTitle>
                  <CardDescription>
                    You have access to chat features. Your subscription is active.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/messages')} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Subscription Plans */}
            {(!userSubscription || !isSubscriptionActive()) && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold mb-2">Choose Your Plan</h2>
                  <p className="text-muted-foreground">
                    Subscribe to chat with farmers and get priority support
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <Card 
                      key={plan.id} 
                      className={`relative ${plan.duration_months === 12 ? 'border-primary shadow-lg' : ''}`}
                    >
                      {plan.duration_months === 12 && (
                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          Most Popular
                        </Badge>
                      )}
                      
                      <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                          {getPlanIcon(plan.name)}
                        </div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-4">
                          <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                          {plan.duration_months > 0 && (
                            <span className="text-muted-foreground">
                              /{plan.duration_months === 1 ? 'month' : plan.duration_months === 12 ? 'year' : `${plan.duration_months} months`}
                            </span>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <ul className="space-y-3 mb-6">
                          {(Array.isArray(plan.features) ? plan.features : []).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <Check className="h-4 w-4 text-primary mr-3" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button 
                          className="w-full" 
                          variant={plan.duration_months === 12 ? 'default' : 'outline'}
                          onClick={() => handleSubscribe(plan.id, plan)}
                        >
                          Subscribe Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Features Info */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>All subscription plans include these features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Direct Chat with Farmers</h4>
                      <p className="text-sm text-muted-foreground">
                        Ask questions about products, availability, and farming practices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Crown className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Priority Support</h4>
                      <p className="text-sm text-muted-foreground">
                        Get help from our support team with orders and issues
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {userSubscription && isSubscriptionActive() ? (
              <>
                {/* Current Subscription Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Current Subscription
                    </CardTitle>
                    <CardDescription>
                      Manage your active subscription
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Plan</h4>
                        <p className="text-sm text-muted-foreground">{getCurrentPlan()?.name}</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Status</h4>
                        <Badge variant="outline" className="text-green-600">
                          {userSubscription.status}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">Started</h4>
                        <p className="text-sm text-muted-foreground">
                          {userSubscription.start_date ? format(new Date(userSubscription.start_date), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {userSubscription.end_date ? 'Expires' : 'Duration'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {userSubscription.end_date 
                            ? format(new Date(userSubscription.end_date), 'MMM d, yyyy')
                            : 'Lifetime'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={() => navigate('/messages')} className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chatting
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCancelDialogOpen(true)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" onClick={() => navigate('/messages')}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat with Farmers
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/contact-support')}>
                        <Crown className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
                  <p className="text-muted-foreground mb-4">
                    Subscribe to access chat features and priority support
                  </p>
                  <Button onClick={() => setActiveTab('plans')}>
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to chat features immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancelSubscription}
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Subscriptions;