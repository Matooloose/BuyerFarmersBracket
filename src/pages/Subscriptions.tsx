import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, MessageCircle, Crown, Calendar, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  features: string[];
}

interface UserSubscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  subscription_plan_id: string;
}

const Subscriptions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

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
        .eq('is_active', true);

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
        .select('*')
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

      navigate('/messages');
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getPlanIcon = (name: string) => {
    if (name.includes('Monthly')) return <Calendar className="h-6 w-6" />;
    if (name.includes('Annual')) return <Crown className="h-6 w-6" />;
    return <Zap className="h-6 w-6" />;
  };

// Currency formatting for South African Rand
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(price);
};

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="text-center">Loading subscription plans...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Chat Subscriptions</h1>
          <div></div>
        </div>

        {/* Current Subscription Status */}
        {userSubscription && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
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
        {!userSubscription && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">
                Subscribe to chat with farmers and get support from our admin team
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative ${plan.name.includes('Annual') ? 'border-primary shadow-lg' : ''}`}
                >
                  {plan.name.includes('Annual') && (
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
                          /{plan.duration_months === 1 ? 'month' : 'year'}
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
                      variant={plan.name.includes('Annual') ? 'default' : 'outline'}
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
                    Get help from our admin team with orders and issues
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscriptions;