import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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


const TrackOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getTotalItems } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [farmName, setFarmName] = useState<string>("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        setOrders([]);
      } else {
        // You may need to map/format data to match the Order interface
        setOrders((data || []).map(order => ({
          id: order.id,
          orderNumber: order.id,
          status: order.status,
          total: order.total,
          items: 1, // Will be updated when fetching order items
          estimatedDelivery: '',
          farmName: '',
          trackingId: '',
          shippingAddress: order.shipping_address || '',
        })));
  // Fetch order items and farm info for selected order
  async function fetchOrderDetails(order: Order) {
    // Fetch order items with valid product columns
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_id, quantity, unit_price, products(name, farmer_id)')
      .eq('order_id', order.id);
    let items: OrderItem[] = [];
   
    if (!itemsError && itemsData) {
      items = itemsData.map((item: {
        id: string;
        product_id: string;
        quantity: number;
        unit_price: number;
        products?: {
          name?: string;
          farmer_id?: string;
        };
      }) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        product_name: item.products?.name || '',
        product_image: '',
        farm_id: item.products?.farmer_id || '',
      }));
      // Get farm name for the first product in the order
      if (items.length > 0 && items[0].farm_id) {
        const { data: farmData, error: farmError } = await supabase
          .from('farms')
          .select('name')
          .eq('id', items[0].farm_id)
          .maybeSingle();
        setFarmName(farmData?.name || "N/A");
      } else {
        setFarmName("N/A");
      }
    } else {
      setFarmName("N/A");
    }
    setOrderItems(items);
  }
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'processing':
        return 'bg-info/10 text-info border-info/20';
      case 'shipped':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'delivered':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const bottomNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Package, label: "Track", path: "/track-order", active: true },
    { icon: Search, label: "Browse", path: "/browse-products" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
  ];

  async function fetchOrderDetails(order: Order) {
    // Fetch order items with valid product columns
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_id, quantity, unit_price, products(name, farmer_id)')
      .eq('order_id', order.id);
    let items: OrderItem[] = [];
    let farmId = "";
    if (!itemsError && itemsData) {
      items = itemsData.map((item: {
        id: string;
        product_id: string;
        quantity: number;
        unit_price: number;
        products?: {
          name?: string;
          farmer_id?: string;
        };
      }) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        product_name: item.products?.name || '',
        product_image: '',
      }));
      if (itemsData.length > 0) {
        farmId = itemsData[0].products?.farmer_id || "";
      }
    }
    setOrderItems(items);
    // Fetch farm name
    if (farmId) {
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('name')
        .eq('farmer_id', farmId)
        .maybeSingle();
      setFarmName(farmData?.name || "");
    } else {
      setFarmName("");
    }
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Track Orders</h1>
            <p className="text-sm text-muted-foreground">{orders.length} orders</p>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {loading ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Loading orders...</h2>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-primary to-primary-light">
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
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center px-3 py-2 h-auto ${
                item.active ? 'text-primary' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <div className="relative">
                <item.icon className="h-5 w-5 mb-1" />
                {item.label === "Cart" && getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0.5 rounded-full bg-primary text-white">
                    {getTotalItems()}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default TrackOrder;