import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle,
  Package,
  Truck,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Receipt,
  Share2,
  MessageSquare,
  Clock,
  ArrowRight,
  Home,
  RefreshCw,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    images: string[];
    farmer_id: string;
    farmer: {
      name: string | null;
      image_url: string | null;
    };
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  payment_method: string | null;
  payment_status: string;
  shipping_address: string | null;
  order_items: OrderItem[];
  user_id: string;
}

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (orderId) {
      fetchOrder();
    }
  }, [user, orderId]);

  const fetchOrder = async () => {
    if (!orderId || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              name,
              images,
              farmer_id,
              farmer:profiles!products_farmer_id_fkey (
                name,
                image_url
              )
            )
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error Loading Order",
        description: "Unable to load order details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyOrderNumber = async () => {
    if (!order) return;

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(order.id);
      toast({
        title: "Copied!",
        description: "Order ID copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy order ID.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  const shareOrder = async () => {
    if (!order) return;

    const shareData = {
      title: `Order ${order.id} - FarmersBracket`,
      text: `I just placed an order on FarmersBracket! Order #${order.id}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied",
          description: "Order link copied to clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'pending':
        return 25;
      case 'processing':
        return 50;
      case 'shipped':
        return 75;
      case 'delivered':
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  const getStatusSteps = () => [
    { label: 'Order Confirmed', icon: CheckCircle, completed: true },
    { label: 'Processing', icon: Package, completed: ['processing', 'shipped', 'delivered', 'completed'].includes(order?.status?.toLowerCase() || '') },
    { label: 'Shipped', icon: Truck, completed: ['shipped', 'delivered', 'completed'].includes(order?.status?.toLowerCase() || '') },
    { label: 'Delivered', icon: CheckCircle, completed: ['delivered', 'completed'].includes(order?.status?.toLowerCase() || '') }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="text-6xl">🛒</div>
          <h1 className="text-2xl font-bold">Order Not Found</h1>
          <p className="text-muted-foreground">
            We couldn't find the order you're looking for. It may have been removed or you may not have permission to view it.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/orders')}>
              View All Orders
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold">
              Order Confirmed!
            </h1>
            
            <p className="text-xl opacity-90">
              Thank you for supporting local farming! Your order has been confirmed and is being prepared.
            </p>
            
            <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg px-4 py-2 inline-flex">
              <span className="font-medium">Order ID:</span>
              <span className="font-mono font-bold">{order.id.slice(0, 8)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyOrderNumber}
                disabled={isCopying}
                className="h-auto p-1 hover:bg-white/20"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => navigate('/orders')} className="bg-primary">
              <Receipt className="h-4 w-4 mr-2" />
              View All Orders
            </Button>
            <Button variant="outline" onClick={shareOrder}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Order
            </Button>
            <Button variant="outline" onClick={() => navigate('/support')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>

          {/* Order Status Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Status</span>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{getStatusProgress(order.status)}%</span>
                </div>
                <Progress value={getStatusProgress(order.status)} className="h-2" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {getStatusSteps().map((step, index) => (
                  <div key={index} className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                      step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <p className={`text-sm font-medium ${
                      step.completed ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Estimated Delivery</h4>
                    <p className="text-sm text-blue-700">{format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                    <Clock className="h-4 w-4 mr-2" />
                    Track Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Order Date:</span>
                  <span>{format(new Date(order.created_at), 'MMMM d, yyyy')}</span>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="text-sm space-y-1">
                    {order.shipping_address ? (
                      <p className="bg-gray-50 p-3 rounded-lg">{order.shipping_address}</p>
                    ) : (
                      <p className="text-muted-foreground">No shipping address provided</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment Method</span>
                  <span className="capitalize">{order.payment_method || 'Not specified'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment Status</span>
                  <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                    {order.payment_status}
                  </Badge>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>R{order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.order_items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={item.product.images[0] || '/placeholder.svg'}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.product.farmer.name || 'Unknown Farmer'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-medium">R{(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/products/${item.product_id}`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">1</span>
                </div>
                <p>Our farmers will begin preparing your fresh products</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">2</span>
                </div>
                <p>You'll receive updates via email and push notifications</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">3</span>
                </div>
                <p>Your order will be shipped and you'll get tracking information</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">4</span>
                </div>
                <p>Enjoy your fresh farm products!</p>
              </div>
            </CardContent>
          </Card>

          {/* Continue Shopping */}
          <div className="text-center py-8">
            <Button 
              onClick={() => navigate('/browse')}
              size="lg"
              className="bg-primary"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;