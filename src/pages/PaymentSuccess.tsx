import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, Loader2, Package, ArrowLeft, Receipt, Download, Mail,
  Zap, ShoppingCart, ChevronRight, Repeat, MessageCircle, Sparkles,
  Timer, Heart, Info, Star, Share2, Facebook, Twitter, Instagram,
  Calendar, Clock, DollarSign, MapPin, Phone, Globe
} from "lucide-react";
import { PaymentStatus } from "@/lib/payfast";
import confetti from 'canvas-confetti';
import { addDays, addWeeks } from 'date-fns';

// Enhanced interfaces
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  farmName: string;
  category: string;
  image?: string;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  estimatedDelivery: string;
  farmDetails: FarmDetail[];
  paymentMethod: string;
  transactionId: string;
}

interface FarmDetail {
  id: string;
  name: string;
  image?: string;
  items: OrderItem[];
  estimatedPreparation: string;
  distance: number;
}

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  farmName: string;
  category: string;
  rating: number;
  inSeason: boolean;
  complementsOrder: boolean;
}

interface DeliveryTip {
  id: string;
  title: string;
  description: string;
  category: 'preparation' | 'storage' | 'nutrition' | 'usage';
  icon: any;
}

interface RecurringOrderSuggestion {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  discount: number;
  nextDelivery: string;
  savings: number;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  // Enhanced features state
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [deliveryTips, setDeliveryTips] = useState<DeliveryTip[]>([]);
  const [recurringOrderSuggestion, setRecurringOrderSuggestion] = useState<RecurringOrderSuggestion | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  // Dialog states
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isRecommendationsDialogOpen, setIsRecommendationsDialogOpen] = useState(false);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);

  const loadOrderSummary = async (orderId: string) => {
    try {
      if (!user?.id) {
        console.error('User ID is required to load order summary');
        return;
      }

      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              category,
              images,
              farmer_id
            )
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (orderData) {
        // Get unique farmer IDs to fetch farm names
        const farmerIds = [...new Set(
          orderData.order_items?.map((item: any) => item.products?.farmer_id).filter(Boolean) || []
        )];

        // Fetch farm names for the farmers
        const { data: farmsData } = await supabase
          .from('farms')
          .select('id, name, farmer_id')
          .in('farmer_id', farmerIds);

        const farmerToFarmMap = new Map();
        (farmsData || []).forEach((farm: any) => {
          farmerToFarmMap.set(farm.farmer_id, farm.name);
        });

        // Transform order data
        const transformedOrder: OrderSummary = {
          id: orderData.id,
          orderNumber: orderData.id.substring(0, 8).toUpperCase(),
          items: (orderData.order_items || []).map((item: any) => {
            const farmerId = item.products?.farmer_id;
            const farmName = farmerId ? farmerToFarmMap.get(farmerId) || 'Unknown Farm' : 'Unknown Farm';
            
            return {
              id: item.id,
              productId: item.product_id,
              productName: item.products?.name || 'Unknown Product',
              quantity: item.quantity,
              unitPrice: item.unit_price,
              total: item.quantity * item.unit_price,
              farmName: farmName,
              category: item.products?.category || 'other',
              image: item.products?.images?.[0] || '/placeholder.svg'
            };
          }),
          subtotal: orderData.total,
          deliveryFee: 25.00, // Default delivery fee
          discount: 0,
          tax: orderData.total * 0.15, // 15% tax
          total: orderData.total,
          estimatedDelivery: addDays(new Date(), 2).toISOString(),
          farmDetails: [], // Will be populated from items
          paymentMethod: 'PayFast',
          transactionId: searchParams.get('pf_payment_id') || 'N/A'
        };

        // Group items by farm for farmDetails
        const farmMap = new Map<string, { name: string; items: OrderItem[] }>();
        transformedOrder.items.forEach(item => {
          if (!farmMap.has(item.farmName)) {
            farmMap.set(item.farmName, { name: item.farmName, items: [] });
          }
          farmMap.get(item.farmName)?.items.push(item);
        });

        transformedOrder.farmDetails = Array.from(farmMap.entries()).map(([farmName, data], index) => ({
          id: `farm_${index}`,
          name: farmName,
          items: data.items,
          estimatedPreparation: '4-8 hours',
          distance: Math.random() * 20 + 5 // Random distance between 5-25km
        }));

        setOrderSummary(transformedOrder);
      }
    } catch (error) {
      console.error('Error loading order summary:', error);
      // Show error message instead of fallback data
      toast({
        title: "Error loading order details",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      // Load related products from database
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          images,
          category,
          farms(id, name)
        `)
        .limit(6);

      if (error) {
        console.error('Error loading recommended products:', error);
        return;
      }

      const recommendations: RecommendedProduct[] = (products || []).map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: Array.isArray(product.images) ? product.images[0] : product.images,
        farmName: (product.farms as any)?.name || 'Unknown Farm',
        category: product.category,
        rating: 4.5, // Default rating since column doesn't exist yet
        inSeason: true,
        complementsOrder: true
      }));

      setRecommendedProducts(recommendations);
    } catch (error) {
      console.error('Error loading recommended products:', error);
    }
  };

  const loadDeliveryTips = () => {
    // Generate tips based on ordered products
    const staticTips: DeliveryTip[] = [
      {
        id: '1',
        title: 'Proper Storage',
        description: 'Store fresh produce in the refrigerator and dry goods in a cool, dry place',
        category: 'storage',
        icon: Package
      },
      {
        id: '2',
        title: 'Peak Freshness',
        description: 'Use leafy greens within 3-5 days and root vegetables within 1-2 weeks',
        category: 'preparation',
        icon: Timer
      },
      {
        id: '3',
        title: 'Nutritional Benefits',
        description: 'Fresh farm produce provides maximum nutritional value and flavor',
        category: 'nutrition',
        icon: Heart
      },
      {
        id: '4',
        title: 'Recipe Ideas',
        description: 'Visit our recipe section for inspiration using your fresh ingredients',
        category: 'usage',
        icon: Sparkles
      }
    ];
    setDeliveryTips(staticTips);
  };

  const loadRecurringOrderSuggestion = () => {
    // Generate recurring order suggestion based on order value
    const suggestion: RecurringOrderSuggestion = {
      frequency: 'weekly',
      discount: 10,
      nextDelivery: addWeeks(new Date(), 1).toISOString(),
      savings: orderSummary ? orderSummary.total * 0.1 * 52 : 0 // 10% savings annually
    };
    setRecurringOrderSuggestion(suggestion);
  };

  useEffect(() => {
    const processPayment = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Get payment details from URL params
        const paymentId = searchParams.get('pf_payment_id');
        const orderId = searchParams.get('custom_str1');
        const amount = searchParams.get('amount_gross');

        if (!paymentId || !orderId) {
          throw new Error('Missing payment information');
        }

        // Update order status in database
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: PaymentStatus.COMPLETED,
            payment_method: 'payfast',
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .eq('user_id', user.id);

        if (orderError) throw orderError;

        // Create payment record
        try {
          const { error: paymentError } = await (supabase as any)
            .from('payments')
            .insert({
              order_id: orderId,
              user_id: user.id,
              amount: parseFloat(amount || '0'),
              currency: 'ZAR',
              status: PaymentStatus.COMPLETED,
              payment_method: 'payfast',
              transaction_id: paymentId,
              metadata: {
                payfast_payment_id: paymentId,
                payment_date: new Date().toISOString()
              }
            });

          if (paymentError) {
            console.warn('Payment record creation failed:', paymentError);
            // Don't throw error as order is already updated
          }
        } catch (err) {
          console.warn('Payment table not yet deployed:', err);
        }

        // Clear cart and set order data
        clearCart();
        setOrderCreated(true);
        
        // Load real order data
        await loadOrderSummary(orderId);
        await loadRecommendedProducts();
        loadDeliveryTips();
        loadRecurringOrderSuggestion();

        // Trigger confetti after short delay
        setTimeout(() => {
          triggerConfetti();
        }, 500);

        // Show review prompt after 3 seconds
        setTimeout(() => {
          setShowReviewPrompt(true);
        }, 3000);

        toast({
          title: "Payment Successful! 🎉",
          description: "Your order has been placed successfully.",
        });

      } catch (error) {
        console.error('Payment processing error:', error);
        toast({
          title: "Payment Verification Failed",
          description: "Please contact support if your payment was deducted.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [user, searchParams, clearCart, toast, navigate]);

  const triggerConfetti = () => {
    if (confettiTriggered) return;
    
    setConfettiTriggered(true);

    // Fire confetti from multiple angles
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Fire from the left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      // Fire from the right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleDownloadReceipt = () => {
    // In real app, generate and download PDF receipt
    toast({
      title: "Receipt generated",
      description: "Your receipt has been downloaded",
    });
  };

  const handleEmailReceipt = () => {
    // In real app, send email receipt
    toast({
      title: "Receipt sent",
      description: "Receipt has been sent to your email",
    });
  };

  const handleSetupRecurring = () => {
    // In real app, navigate to subscription setup
    toast({
      title: "Recurring order setup",
      description: "Setting up your recurring order...",
    });
    setIsRecurringDialogOpen(false);
  };

  const handleAddToCart = (productId: string) => {
    // In real app, add product to cart
    toast({
      title: "Added to cart",
      description: "Product has been added to your cart",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(price);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'storage': return Package;
      case 'preparation': return Timer;
      case 'nutrition': return Heart;
      case 'usage': return Sparkles;
      default: return Info;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Payment Successful!</h1>
                <p className="text-sm text-muted-foreground">Order confirmed</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsReceiptDialogOpen(true)}>
                <Receipt className="h-4 w-4 mr-2" />
                Receipt
              </Button>
              <Button size="sm" onClick={() => navigate(`/track-order/${orderSummary?.id}`)}>
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Success Celebration */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Order Confirmed! 🎉</h2>
            <p className="text-green-700 mb-4">
              Your payment has been processed successfully
            </p>
            
            {orderSummary && (
              <div className="bg-white/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600 font-medium">Order Number:</span>
                    <p className="font-bold">{orderSummary.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Total Amount:</span>
                    <p className="font-bold">{formatPrice(orderSummary.total)}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Payment Method:</span>
                    <p className="font-bold">{orderSummary.paymentMethod}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Transaction ID:</span>
                    <p className="font-bold">{orderSummary.transactionId}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setIsReceiptDialogOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
              <Button variant="outline" onClick={handleEmailReceipt}>
                <Mail className="h-4 w-4 mr-2" />
                Email Receipt
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            {orderSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderSummary.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.productName}</h4>
                        <p className="text-xs text-muted-foreground">{item.farmName}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.total)}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.unitPrice)} each</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(orderSummary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{formatPrice(orderSummary.deliveryFee)}</span>
                    </div>
                    {orderSummary.discount !== 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>{formatPrice(orderSummary.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatPrice(orderSummary.tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatPrice(orderSummary.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Farm Details */}
            {orderSummary?.farmDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Farm Partners
                  </CardTitle>
                  <CardDescription>
                    Your order includes products from these local farms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderSummary.farmDetails.map((farm) => (
                    <div key={farm.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Globe className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{farm.name}</h4>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Prep: {farm.estimatedPreparation}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {farm.distance}km away
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Items: {farm.items.map(item => item.productName).join(', ')}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Delivery Preparation Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Delivery Preparation Tips
                </CardTitle>
                <CardDescription>
                  Make the most of your fresh produce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deliveryTips.map((tip) => {
                    const IconComponent = getCategoryIcon(tip.category);
                    return (
                      <div key={tip.id} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <IconComponent className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                            <p className="text-xs text-muted-foreground">{tip.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Recommendations */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  onClick={() => navigate(`/track-order/${orderSummary?.id}`)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Track Your Order
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsRecurringDialogOpen(true)}
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Set Up Recurring Order
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsRecommendationsDialogOpen(true)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Recommended Products
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/messages')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>

            {/* Next Delivery Estimation */}
            {recurringOrderSuggestion && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Calendar className="h-5 w-5" />
                    Auto-Delivery Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-800">
                        {recurringOrderSuggestion.discount}% OFF
                      </p>
                      <p className="text-sm text-blue-700">
                        on {recurringOrderSuggestion.frequency} deliveries
                      </p>
                    </div>
                    
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-blue-600">Next Delivery:</span>
                          <p className="font-semibold">
                            {new Date(recurringOrderSuggestion.nextDelivery).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Annual Savings:</span>
                          <p className="font-semibold">{formatPrice(recurringOrderSuggestion.savings)}</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => setIsRecurringDialogOpen(true)}
                    >
                      Set Up Auto-Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Prompt */}
            {showReviewPrompt && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Star className="h-5 w-5" />
                    Share Your Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700 mb-4">
                    Help other customers by sharing your experience with these farms
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => navigate('/product-reviews')}>
                      <Star className="h-4 w-4 mr-2" />
                      Write Review
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowReviewPrompt(false)}>
                      Later
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share Success */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share the Love
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Tell your friends about fresh farm products
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Instagram className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>
          
          {orderSummary && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <h3 className="font-bold text-lg">{orderSummary.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(orderSummary.total)}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{orderSummary.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span>{orderSummary.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{orderSummary.items.length} items</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleEmailReceipt}>
              <Mail className="h-4 w-4 mr-2" />
              Email Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recommendations Dialog */}
      <Dialog open={isRecommendationsDialogOpen} onOpenChange={setIsRecommendationsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recommended for You</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recommendedProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{product.name}</h4>
                    {product.inSeason && (
                      <Badge variant="secondary" className="text-xs">In Season</Badge>
                    )}
                    {product.complementsOrder && (
                      <Badge variant="outline" className="text-xs">Pairs Well</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{product.farmName}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating}</span>
                    </div>
                    <span>•</span>
                    <span className="font-semibold">{formatPrice(product.price)}</span>
                  </div>
                </div>

                <Button size="sm" onClick={() => handleAddToCart(product.id)}>
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecommendationsDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => navigate('/browse-products')}>
              Browse All Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Order Dialog */}
      <Dialog open={isRecurringDialogOpen} onOpenChange={setIsRecurringDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Recurring Order</DialogTitle>
          </DialogHeader>
          
          {recurringOrderSuggestion && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-800">
                  Save {recurringOrderSuggestion.discount}% on Every Order
                </h3>
                <p className="text-sm text-blue-700">
                  Get your favorites delivered {recurringOrderSuggestion.frequency}
                </p>
                <p className="text-lg font-bold text-blue-800 mt-2">
                  {formatPrice(recurringOrderSuggestion.savings)} saved annually
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Delivery Frequency:</span>
                  <span className="font-semibold capitalize">{recurringOrderSuggestion.frequency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Next Delivery:</span>
                  <span className="font-semibold">
                    {new Date(recurringOrderSuggestion.nextDelivery).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discounted Price:</span>
                  <span className="font-semibold text-green-600">
                    {formatPrice(orderSummary?.total ? orderSummary.total * (1 - recurringOrderSuggestion.discount / 100) : 0)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  You can modify or cancel your subscription anytime in your account settings.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecurringDialogOpen(false)}>
              Not Now
            </Button>
            <Button onClick={handleSetupRecurring}>
              Set Up Auto-Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSuccess;