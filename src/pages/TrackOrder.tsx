import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Order } from "@/types/order";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, Phone, MessageCircle, MapPin, Calendar, Info, Package2, ShoppingCart } from "lucide-react";

const TrackOrder = () => {
  const { orderId: paramOrderId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = paramOrderId || searchParams.get('orderId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && orderId) {
      loadOrder();
    } else if (!orderId) {
      setLoading(false);
    }
  }, [orderId, user]);

  const loadOrder = async () => {
    if (!orderId || !user?.id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            products (
              id,
              name,
              images,
              unit
            )
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading order:', error);
        throw error;
      }

      if (data) {
        setOrder({
          ...data,
          shipping_address: data.shipping_address ?? undefined,
        });
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
      navigate('/order-history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 25;
      case 'confirmed': case 'processing': return 50;
      case 'preparing': case 'ready': return 75;
      case 'out_for_delivery': case 'shipped': return 90;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 25;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'out_for_delivery': case 'shipped': return 'bg-blue-500';
      case 'processing': case 'preparing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return CheckCircle;
      case 'out_for_delivery': case 'shipped': return Truck;
      case 'processing': case 'preparing': return Package;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/order-history')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Track Order</h1>
          </div>
        </header>

        <main className="p-4">
          <Card className="text-center py-12">
            <CardContent>
              <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/order-history')}>
                  View Order History
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(order.status);
  const statusProgress = getStatusProgress(order.status);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/order-history')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Track Order</h1>
            <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className={`p-3 rounded-full ${getStatusColor(order.status)}`}>
                <StatusIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
            </CardTitle>
            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="mt-2">
              {order.payment_status === 'completed' ? 'Paid' : 'Pending Payment'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order Progress</span>
                <span>{statusProgress}%</span>
              </div>
              <Progress value={statusProgress} className="h-2" />
            </div>

            {order.estimated_delivery && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Estimated Delivery</p>
                  <p className="text-sm text-muted-foreground">{order.estimated_delivery}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Delivery Address</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address || 'No address provided'}</p>
                {order.delivery_instructions && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Instructions: {order.delivery_instructions}
                  </p>
                )}
              </div>
            </div>

            {order.phone_number && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Contact Number</p>
                  <p className="text-sm text-muted-foreground">{order.phone_number}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items?.map((item) => (
                item.products ? (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <img 
                      src={item.products.images?.[0] || "/placeholder.svg"} 
                      alt={item.products.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.products.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.products.unit} × R{item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R{(item.quantity * item.unit_price).toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">Unknown Product</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × R{item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R{(item.quantity * item.unit_price).toFixed(2)}</p>
                    </div>
                  </div>
                )
              ))}
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span>R{order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/contact-support')}>
                <Phone className="h-4 w-4" />
                Call Support
              </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/messages')}>
                <MessageCircle className="h-4 w-4" />
                Chat
              </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/faq')}>
                <Info className="h-4 w-4" />
                FAQ
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/order-history')}
            className="flex-1"
          >
            View All Orders
          </Button>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="flex-1"
          >
            Start Shopping
          </Button>
        </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong safe-area-bottom-nav" role="navigation" aria-label="Main navigation">
        <div className="flex items-center justify-around py-2">
          {[
            { icon: 'Home', label: 'Home', path: '/dashboard' },
            { icon: 'ShoppingCart', label: 'Cart', path: '/cart' },
            { icon: 'Package', label: 'Track', path: '/track-order' },
            { icon: 'Search', label: 'Browse', path: '/browse-products' },
            { icon: 'MessageCircle', label: 'Messages', path: '/messages' },
          ].map(item => {
            const Icon = require('lucide-react')[item.icon];
            const isActive = window.location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`flex flex-col items-center px-3 py-2 h-auto ${isActive ? 'text-primary font-bold bg-green-500/30' : 'text-muted-foreground'}`}
                onClick={() => navigate(item.path)}
                aria-label={`Navigate to ${item.label}`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
      </main>
    </div>
  );
};

export default TrackOrder;