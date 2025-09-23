import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Search, 
  Filter, 
  Calendar,
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  BarChart3,
  Receipt,
  RefreshCw
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  deliveryDate?: string;
  farmName: string;
  itemCount: number;
  items: OrderItem[];
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingAddress: string | null;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        setError('Please log in to view your order history.');
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        // Check if orders table exists and fetch order data with related items and farm info
        // Note: Adjust column names based on your actual database schema
        const { data: ordersData, error: ordersError } = await supabase
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
                farmer_id,
                farms!products_farmer_id_fkey (
                  id,
                  name
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          setError('Failed to load order history. Please check your connection and try again.');
          setOrders([]);
          return;
        }

        // Transform the data to match our interface
        const transformedOrders: Order[] = (ordersData || []).map((order, index) => {
          // Get farm name from the first product's farm
          const firstProduct = order.order_items?.[0]?.products;
          const farmName = 'Local Farm'; // Simplified for now
          
          return {
            id: order.id,
            orderNumber: order.id, // Using order ID as order number since order_number doesn't exist
            status: order.status,
            total: order.total,
            createdAt: order.created_at,
            deliveryDate: undefined, // No delivery_date in schema
            farmName: farmName,
            itemCount: order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0,
            items: order.order_items?.map((item: any) => ({
              id: item.id,
              productName: item.products?.name || 'Product',
              quantity: item.quantity,
              unitPrice: item.unit_price,
              total: item.quantity * item.unit_price
            })) || [],
            paymentStatus: order.payment_status,
            shippingAddress: order.shipping_address || 'No address provided'
          };
        });

        setOrders(transformedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('An unexpected error occurred while loading your orders.');
        setOrders([]);
        toast({
          title: "Error",
          description: "Failed to load order history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, toast]);

  // Refresh function
  const refreshOrders = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load order history. Please check your connection and try again.');
        setOrders([]);
        return;
      }

      // Transform the data to match our interface
      const transformedOrders: Order[] = (data || []).map((order, index) => ({
        id: order.id,
        orderNumber: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.created_at,
        deliveryDate: undefined,
        farmName: 'Local Farm',
        itemCount: 1,
        items: [],
        paymentStatus: order.payment_status,
        shippingAddress: order.shipping_address || 'No address provided'
      }));

      setOrders(transformedOrders);
      toast({
        title: "Refreshed",
        description: "Order history has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing orders:', error);
      setError('An unexpected error occurred while refreshing your orders.');
      toast({
        title: "Error",
        description: "Failed to refresh order history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-primary" />;
      case 'processing':
        return <Package className="h-4 w-4 text-warning" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-info" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      delivered: 'default',
      shipped: 'secondary',
      processing: 'outline',
      pending: 'outline',
      cancelled: 'destructive'
    };
    return variants[status as keyof typeof variants] || 'outline';
  };

  const downloadReceipt = async (order: Order) => {
    try {
      // Simulate receipt generation and download
      const receiptContent = generateReceiptContent(order);
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${order.orderNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Receipt Downloaded",
        description: `Receipt for order ${order.orderNumber} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  const generateReceiptContent = (order: Order) => {
    return `
FARMERS BRACKET RECEIPT
======================
Order Number: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Farm: ${order.farmName}
Status: ${order.status.toUpperCase()}

ITEMS:
------
${order.items.map(item => 
  `${item.productName} x${item.quantity} @ R${item.unitPrice.toFixed(2)} = R${item.total.toFixed(2)}`
).join('\n')}

------
Total: R${order.total.toFixed(2)}

Thank you for supporting local farmers!
    `;
  };

  const generateReport = () => {
    const reportData = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
      topFarms: [...new Set(orders.map(o => o.farmName))]
    };

    const reportContent = `
FARMERS BRACKET - ORDER SUMMARY REPORT
======================================
Generated: ${new Date().toLocaleDateString()}

OVERVIEW:
---------
Total Orders: ${reportData.totalOrders}
Completed Orders: ${reportData.completedOrders}
Total Spent: R${reportData.totalSpent.toFixed(2)}
Average Order Value: R${reportData.averageOrderValue.toFixed(2)}

FARMS ORDERED FROM:
------------------
${reportData.topFarms.join('\n')}

RECENT ORDERS:
--------------
${orders.slice(0, 5).map(order => 
  `${order.orderNumber} - ${order.farmName} - R${order.total.toFixed(2)} - ${order.status}`
).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Report Generated",
      description: "Your order summary report has been downloaded",
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const matchesDate = dateFilter === 'all' || (() => {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      switch (dateFilter) {
        case 'week':
          return (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        case 'month':
          return (now.getTime() - orderDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        case 'year':
          return (now.getTime() - orderDate.getTime()) <= 365 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Order History</h1>
              <p className="text-sm text-muted-foreground">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={refreshOrders}
              disabled={loading}
              className="gap-2"
              aria-label="Refresh orders"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateReport}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number or farm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{orders.length}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                R{orders.reduce((sum, order) => sum + order.total, 0).toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                R{orders.length > 0 ? (orders.reduce((sum, order) => sum + order.total, 0) / orders.length).toFixed(0) : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Avg. Order</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-destructive/10 to-destructive/20 rounded-full flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Unable to load orders</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {error}
            </p>
            <Button 
              onClick={refreshOrders} 
              variant="outline" 
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders found</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? "Try adjusting your filters to see more orders."
                : "You haven't placed any orders yet. Start shopping to see your order history here."
              }
            </p>
            <Button onClick={() => navigate('/dashboard')} className="gap-2">
              <Package className="h-4 w-4" />
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{order.orderNumber}</h3>
                        <Badge variant={getStatusBadge(order.status) as any} className="gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p>Farm: {order.farmName}</p>
                        <p>{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</p>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-lg font-semibold text-primary">R{order.total.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadReceipt(order)}
                        className="gap-2"
                      >
                        <Receipt className="h-4 w-4" />
                        Receipt
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/track-order?orderId=${order.id}`)}
                        className="gap-2"
                      >
                        <Truck className="h-4 w-4" />
                        Track
                      </Button>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <Separator className="my-3" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Items:</p>
                    {order.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                        <span>{item.productName} x{item.quantity}</span>
                        <span>R{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-muted-foreground">
                        +{order.items.length - 2} more {order.items.length - 2 === 1 ? 'item' : 'items'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;