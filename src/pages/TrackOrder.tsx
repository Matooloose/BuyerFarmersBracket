import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Order } from "@/types/order";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, Phone, MessageCircle, MapPin, Calendar, Info, Package2, ShoppingCart } from "lucide-react";
import BottomNavBar from "@/components/BottomNavBar";
=======

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import LiveTrackingDialog from "@/components/LiveTrackingDialog";
import BottomNav from "@/components/BottomNav";
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Home,
  ShoppingCart,
  MessageCircle,
  Search,
  MapPin
} from "lucide-react";


  interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    items: number;
    estimatedDelivery: string;
    farmName?: string;
    trackingId?: string;
    shippingAddress?: string;
  }

  interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    product_name?: string;
    product_image?: string;
    farm_id?: string; // Added farm_id property
  }

>>>>>>> aeb7aacc8daba24402f7cfa7daf6ee404e6afaef

const TrackOrder = () => {
  const { orderId: paramOrderId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = paramOrderId || searchParams.get('orderId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<any>(null);
  const [recurring, setRecurring] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);

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
      // Fetch order with items and product details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`*, order_items (*, products (id, name, description, images, price, category, farmer_id, unit))`)
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();
      if (orderError || !orderData) {
        toast({ title: "Error", description: orderError?.message || "Order not found.", variant: "destructive" });
        setOrder(null);
        setLoading(false);
        navigate('/order-history');
        return;
      }
      // Fetch farm name
      let farmName = "Unknown Farm";
      const firstItem = orderData.order_items?.[0];
      const farmerId = firstItem?.products?.farmer_id;
      if (farmerId) {
        const { data: farmData } = await supabase
          .from("farms")
          .select("name")
          .eq("farmer_id", farmerId)
          .single();
        if (farmData?.name) farmName = farmData.name;
      }
      // Fetch customer profile from 'profiles' table
      let customerObj = {
        name: "",
        email: user?.email || "",
        phone: "",
        shippingAddress: orderData.shipping_address || "",
      };
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, phone")
        .eq("id", user.id)
        .single();
      if (profileData) {
        customerObj.name = profileData.name || "";
        customerObj.phone = profileData.phone || "";
      }
      setCustomer(customerObj);
      // Calculate pricing breakdown
      const subtotal = orderData.order_items?.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0) || 0;
      const shipping = 0; // Add logic if available
      const tax = 0; // Add logic if available
      const discount = 0; // Add logic if available
      const grandTotal = orderData.total || subtotal;
      // Prepare products list
      const products = (orderData.order_items || []).map((item: any) => ({
        name: item.products?.name || "Unknown Product",
        description: item.products?.description || "",
        image: item.products?.images?.[0] || "/placeholder.svg",
        quantity: item.quantity,
        price: item.unit_price,
        total: item.unit_price * item.quantity,
        unit: item.products?.unit || "",
      }));
      setOrder({
        ...orderData,
        farmName,
        products,
        pricing: { subtotal, shipping, tax, discount, grandTotal },
      });
      // Fetch recurring order info
      const { data: recurringData } = await supabase
        .from('recurring_orders')
        .select('frequency, next_delivery, is_active')
        .eq('order_id', orderId)
        .single();
      if (recurringData) setRecurring(recurringData);
    } catch (error) {
      console.error('Error loading order:', error);
      toast({ title: "Error", description: "Failed to load order details", variant: "destructive" });
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
<<<<<<< HEAD
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Track Order</h1>
            <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
=======
          <h2 className="text-xl font-semibold text-foreground">Track Your Order</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/home')}>
              <Home className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
>>>>>>> aeb7aacc8daba24402f7cfa7daf6ee404e6afaef
          </div>
        </div>
      </header>

<<<<<<< HEAD
      <main className="p-4 space-y-6">
        {/* Order Summary */}
        {recurring && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Recurring Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><strong>Frequency:</strong> {recurring.frequency}</div>
                <div><strong>Next Delivery:</strong> {recurring.next_delivery ? new Date(recurring.next_delivery).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Status:</strong> {recurring.is_active ? 'Active' : 'Inactive'}</div>
              </div>
              <Button variant="outline" className="mt-3">Manage Recurring Order</Button>
            </CardContent>
          </Card>
=======
      {/* Main Content */}
      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loader"></span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/home')} className="bg-gradient-to-r from-primary to-primary-light">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground">{farmName && selectedOrder?.id === order.id ? farmName : order.farmName}</p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} border`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items:</span>
                    <span>{order.items} item{order.items !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">R{order.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {order.status === 'delivered' ? 'Status:' : 'Estimated Delivery:'}
                    </span>
                    <span className={order.status === 'delivered' ? 'text-success font-medium' : ''}>
                      {order.estimatedDelivery}
                    </span>
                  </div>

                  {order.trackingId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tracking ID:</span>
                      <span className="font-mono text-xs">{order.trackingId}</span>
                    </div>
                  )}

                  {order.status === 'shipped' && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Out for delivery</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your order is on its way and will arrive soon
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {order.status === 'delivered' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Delivered successfully</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Rate Order
                      </Button>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={async () => {
                            setSelectedOrder(order);
                            await fetchOrderDetails(order);
                            setDetailsOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Order Details</DialogTitle>
                          <DialogDescription>
                            <div className="rounded-lg bg-card/80 p-4 shadow-md border">
                              <div className="mb-4 flex items-center gap-4">
                                <Package className="h-8 w-8 text-primary" />
                                <div>
                                  <div className="font-bold text-lg">Order #{selectedOrder?.orderNumber}</div>
                                  <div className="text-sm text-muted-foreground">{selectedOrder?.status}</div>
                                </div>
                              </div>
                              <div className="mb-2 flex items-center gap-2">
                                <span className="font-semibold">Farm:</span>
                                <span>{farmName}</span>
                              </div>
                              <div className="mb-2 flex items-center gap-2">
                                <span className="font-semibold">Shipping Address:</span>
                                <span>{selectedOrder?.shippingAddress || "N/A"}</span>
                              </div>
                              <div className="mb-2 flex items-center gap-2">
                                <span className="font-semibold">Total:</span>
                                <span className="font-bold text-primary">R{selectedOrder?.total.toFixed(2)}</span>
                              </div>
                              <div className="mb-2">
                                <span className="font-semibold">Items:</span>
                                <div className="mt-2 space-y-2">
                                  {orderItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-muted/40">
                                      <div className="font-medium text-foreground">{item.product_name}</div>
                                      <div className="text-xs text-muted-foreground">x{item.quantity}</div>
                                      <div className="text-xs text-muted-foreground">@ R{item.unit_price.toFixed(2)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {order.status !== 'delivered' && (
                      <LiveTrackingDialog 
                        orderId={order.id}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            Track Live
                          </Button>
                        }
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
>>>>>>> aeb7aacc8daba24402f7cfa7daf6ee404e6afaef
        )}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div><strong>Order ID:</strong> {order.id}</div>
                <div><strong>Date:</strong> {order.created_at}</div>
                <div><strong>Status:</strong> {order.status}</div>
                <div><strong>Payment:</strong> {order.payment_status}</div>
                <div><strong>Farm:</strong> {order.farmName}</div>
              </div>
              <div>
                <div><strong>Customer:</strong> {customer?.name}</div>
                <div><strong>Email:</strong> {customer?.email}</div>
                <div><strong>Phone:</strong> {customer?.phone}</div>
                <div><strong>Shipping Address:</strong> {customer?.shippingAddress}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Progress */}
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
                <p className="text-sm text-muted-foreground">{customer?.shippingAddress || 'No address provided'}</p>
                {order.delivery_instructions && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Instructions: {order.delivery_instructions}
                  </p>
                )}
              </div>
            </div>

            {customer?.phone && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Contact Number</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Product</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td className="flex items-center gap-2">
                      {p.image && <img src={p.image} alt={p.name} className="w-10 h-10 rounded" />}
                      {p.name}
                    </td>
                    <td>{p.description}</td>
                    <td>{p.quantity}</td>
                    <td>R{p.price.toFixed(2)}</td>
                    <td>R{p.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Pricing Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div><strong>Subtotal:</strong> R{order.pricing.subtotal.toFixed(2)}</div>
              <div><strong>Shipping:</strong> R{order.pricing.shipping.toFixed(2)}</div>
              <div><strong>Tax:</strong> R{order.pricing.tax.toFixed(2)}</div>
              <div><strong>Discount:</strong> -R{order.pricing.discount.toFixed(2)}</div>
              <div className="font-bold"><strong>Grand Total:</strong> R{order.pricing.grandTotal.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping & Delivery */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Shipping & Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div><strong>Method:</strong> {order.payment_method || ''}</div>
            <div><strong>Estimated Delivery:</strong> {order.updated_at || ''}</div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div><strong>Method:</strong> {order.payment_method_selected || order.payment_method || ''}</div>
            <div><strong>Confirmation:</strong> {order.payment_status || ''}</div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(order.status === "pending" || order.status === "processing") && <Button variant="outline">Cancel Order</Button>}
              {order.status === "delivered" && <Button variant="outline">Request Return</Button>}
              {order.status === "delivered" && <Button variant="outline">Request Refund</Button>}
              <Button variant="default" onClick={() => window.print()}>Print Invoice</Button>
            </div>
          </CardContent>
        </Card>

        {/* Help & Navigation */}
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
        <div>
          <BottomNavBar />
        </div>
      </main>
    </div>
  );
};

export default TrackOrder;