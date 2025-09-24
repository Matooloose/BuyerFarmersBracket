import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  RefreshCw,
  TrendingUp,
  Star,
  Heart,
  ShoppingCart,
  Users,
  MapPin,
  DollarSign,
  PieChart,
  Activity,
  Target,
  Lightbulb,
  Award,
  Timer
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

// Enhanced interfaces
interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  deliveryDate?: string;
  farmName: string;
  farmerId: string;
  itemCount: number;
  items: OrderItem[];
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingAddress: string | null;
  deliveryRating?: number;
  deliveryFeedback?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  deliveryPerformance?: 'early' | 'on-time' | 'late';
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
  farmName: string;
  image?: string;
}

interface OrderAnalytics {
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  favoriteCategories: { category: string; count: number; percentage: number }[];
  favoriteProducts: { productName: string; orders: number; totalSpent: number }[];
  spendingTrend: { month: string; amount: number }[];
  deliveryPerformance: {
    onTime: number;
    early: number;
    late: number;
    averageRating: number;
  };
  topFarmers: { farmName: string; orders: number; totalSpent: number; rating: number }[];
  seasonalPatterns: { season: string; orders: number; amount: number }[];
}

interface ReorderSuggestion {
  productId: string;
  productName: string;
  farmName: string;
  lastOrderDate: string;
  frequency: number; // days between orders
  confidence: number; // 0-100
  reason: string;
  image?: string;
  price: number;
  category: string;
}

interface DeliveryPerformance {
  orderId: string;
  farmName: string;
  estimatedDate: string;
  actualDate: string;
  performance: 'early' | 'on-time' | 'late';
  rating: number;
  feedback?: string;
}

const EnhancedOrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Enhanced features state
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [deliveryPerformance, setDeliveryPerformance] = useState<DeliveryPerformance[]>([]);
  const [activeTab, setActiveTab] = useState('orders');

  // Dialog states
  // Dialog states
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [isAnalyticsDetailOpen, setIsAnalyticsDetailOpen] = useState(false);
  const [selectedAnalyticType, setSelectedAnalyticType] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadOrders();
      loadAnalytics();
      loadReorderSuggestions();
      loadDeliveryPerformance();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('User ID is required to load orders');
        return;
      }
      
      const { data: ordersData, error: ordersError } = await supabase
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get unique farmer IDs to fetch farm names
      const farmerIds = [...new Set(
        (ordersData || []).flatMap(order => 
          order.order_items?.map((item: any) => item.products?.farmer_id).filter(Boolean) || []
        )
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

      const transformedOrders: Order[] = (ordersData || []).map(order => {
        const firstItem = order.order_items?.[0];
        const farmerId = firstItem?.products?.farmer_id;
        const farmName = farmerId ? farmerToFarmMap.get(farmerId) || 'Unknown Farm' : 'Unknown Farm';

        return {
          id: order.id,
          orderNumber: order.id.substring(0, 8).toUpperCase(),
          status: order.status as any,
          total: order.total,
          createdAt: order.created_at,
          farmName: farmName,
          farmerId: farmerId || '',
          itemCount: order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
          items: (order.order_items || []).map((item: any) => {
            const itemFarmerId = item.products?.farmer_id;
            const itemFarmName = itemFarmerId ? farmerToFarmMap.get(itemFarmerId) || 'Unknown Farm' : 'Unknown Farm';
            
            return {
              id: item.id,
              productId: item.product_id,
              productName: item.products?.name || 'Unknown Product',
              quantity: item.quantity,
              unitPrice: item.unit_price,
              total: item.quantity * item.unit_price,
              category: item.products?.category || 'other',
              farmName: itemFarmName,
              image: item.products?.images?.[0] || '/placeholder.svg'
            };
          }),
          paymentStatus: order.payment_status as any,
          shippingAddress: order.shipping_address,
          estimatedDelivery: order.updated_at,
          actualDelivery: order.status === 'delivered' ? order.updated_at : undefined,
          deliveryPerformance: order.status === 'delivered' ? 'on-time' : undefined
        };
      });

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      
      // Set empty orders array when database fails
      setOrders([]);
      
      toast({
        title: "Error Loading Orders",
        description: "Could not load your order history. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Calculate analytics from orders
      if (orders.length === 0) {
        // Set default analytics when no orders
        const defaultAnalytics: OrderAnalytics = {
          totalSpent: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          favoriteCategories: [],
          favoriteProducts: [],
          spendingTrend: Array.from({ length: 6 }, (_, i) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            const monthIndex = (currentMonth - 5 + i + 12) % 12;
            return {
              month: months[monthIndex],
              amount: 0
            };
          }),
          deliveryPerformance: {
            onTime: 0,
            early: 0,
            late: 0,
            averageRating: 0
          },
          topFarmers: [],
          seasonalPatterns: []
        };
        setAnalytics(defaultAnalytics);
        return;
      }

      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalSpent / totalOrders;

      // Calculate favorite categories
      const categoryStats: Record<string, number> = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          categoryStats[item.category] = (categoryStats[item.category] || 0) + item.quantity;
        });
      });

      const totalItems = Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
      const favoriteCategories = Object.entries(categoryStats)
        .map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / totalItems) * 100 * 10) / 10
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate favorite products
      const productStats: Record<string, { orders: number; totalSpent: number }> = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!productStats[item.productName]) {
            productStats[item.productName] = { orders: 0, totalSpent: 0 };
          }
          productStats[item.productName].orders += 1;
          productStats[item.productName].totalSpent += item.total;
        });
      });

      const favoriteProducts = Object.entries(productStats)
        .map(([productName, stats]) => ({ productName, ...stats }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Generate spending trend for last 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const spendingTrend = Array.from({ length: 6 }, (_, i) => {
        const monthIndex = (currentMonth - 5 + i + 12) % 12;
        const monthOrders = orders.filter(order => {
          const orderMonth = new Date(order.createdAt).getMonth();
          return orderMonth === monthIndex;
        });
        return {
          month: months[monthIndex],
          amount: monthOrders.reduce((sum, order) => sum + order.total, 0)
        };
      });

      const analytics: OrderAnalytics = {
        totalSpent,
        totalOrders,
        averageOrderValue,
        favoriteCategories,
        favoriteProducts,
        spendingTrend,
        deliveryPerformance: {
          onTime: orders.filter(o => o.deliveryPerformance === 'on-time').length,
          early: orders.filter(o => o.deliveryPerformance === 'early').length,
          late: orders.filter(o => o.deliveryPerformance === 'late').length,
          averageRating: 4.5 // Could be calculated from actual ratings
        },
        topFarmers: [], // Would need separate query for farmer stats
        seasonalPatterns: [] // Would need more complex calculation
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const loadReorderSuggestions = async () => {
    try {
      if (orders.length === 0) return;

      // Analyze order patterns to generate suggestions
      const productFrequency: Record<string, { lastOrder: string; frequency: number; totalOrders: number; avgPrice: number; category: string; farmName: string }> = {};
      
      const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      sortedOrders.forEach(order => {
        order.items.forEach(item => {
          if (!productFrequency[item.productId]) {
            productFrequency[item.productId] = {
              lastOrder: order.createdAt,
              frequency: 0,
              totalOrders: 0,
              avgPrice: item.unitPrice,
              category: item.category,
              farmName: item.farmName
            };
          }
          productFrequency[item.productId].lastOrder = order.createdAt;
          productFrequency[item.productId].totalOrders += 1;
        });
      });

      // Generate suggestions based on frequency and recency
      const suggestions: ReorderSuggestion[] = Object.entries(productFrequency)
        .filter(([_, stats]) => stats.totalOrders >= 2)
        .map(([productId, stats]) => {
          const daysSinceLastOrder = Math.floor(
            (new Date().getTime() - new Date(stats.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
          );
          const confidence = Math.max(50, 100 - daysSinceLastOrder * 2);
          
          return {
            productId,
            productName: orders.find(o => o.items.some(i => i.productId === productId))?.items.find(i => i.productId === productId)?.productName || '',
            farmName: stats.farmName,
            lastOrderDate: stats.lastOrder,
            frequency: Math.ceil(daysSinceLastOrder / stats.totalOrders),
            confidence: Math.min(95, confidence),
            reason: stats.totalOrders >= 3 ? 'Frequently ordered item' : 'Previously ordered',
            price: stats.avgPrice,
            category: stats.category
          };
        })
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 6);

      setReorderSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating reorder suggestions:', error);
    }
  };

  const loadDeliveryPerformance = async () => {
    try {
      const deliveredOrders = orders.filter(order => order.status === 'delivered');
      const performance: DeliveryPerformance[] = deliveredOrders.map(order => ({
        orderId: order.id,
        farmName: order.farmName,
        estimatedDate: order.estimatedDelivery || order.createdAt,
        actualDate: order.actualDelivery || order.createdAt,
        performance: order.deliveryPerformance || 'on-time',
        rating: order.deliveryRating || 4,
        feedback: order.deliveryFeedback
      }));
      
      setDeliveryPerformance(performance);
    } catch (error) {
      console.error('Error loading delivery performance:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = parseISO(order.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'week':
          matchesDate = orderDate >= subDays(now, 7);
          break;
        case 'month':
          matchesDate = orderDate >= subDays(now, 30);
          break;
        case 'quarter':
          matchesDate = orderDate >= subDays(now, 90);
          break;
        case 'year':
          matchesDate = orderDate >= subDays(now, 365);
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkReorder = async () => {
    const selectedOrderData = orders.filter(order => selectedOrders.includes(order.id));
    const allItems = selectedOrderData.flatMap(order => order.items);
    
    // In real app, add items to cart
    toast({
      title: "Items added to cart",
      description: `${allItems.length} items from ${selectedOrders.length} orders added to cart`,
    });
    
    setSelectedOrders([]);
    setIsBulkActionOpen(false);
  };

  const handleReorderSuggestion = async (suggestion: ReorderSuggestion) => {
    // In real app, add to cart
    toast({
      title: "Added to cart",
      description: `${suggestion.productName} has been added to your cart`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'early':
        return 'text-green-600';
      case 'on-time':
        return 'text-blue-600';
      case 'late':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="flex items-center px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="ml-2 text-lg font-semibold">Order History</h1>
          </div>
        </header>
        <main className="p-4">
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </main>
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
            <h1 className="text-lg font-semibold">Order History</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedOrders.length > 0 && (
              <Button variant="outline" onClick={() => setIsBulkActionOpen(true)}>
                Bulk Actions ({selectedOrders.length})
              </Button>
            )}
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">R{analytics.totalSpent.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold">R{analytics.averageOrderValue.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Rating</p>
                    <p className="text-2xl font-bold">{analytics.deliveryPerformance.averageRating}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="suggestions">Reorder</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders, farms, or products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Bulk Selection */}
                {filteredOrders.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    <Checkbox
                      checked={selectedOrders.length === filteredOrders.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm">
                      Select all ({filteredOrders.length} orders)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <Badge variant="outline" className="gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </Badge>
                            {order.deliveryPerformance && (
                              <Badge variant="secondary" className={getPerformanceColor(order.deliveryPerformance)}>
                                {order.deliveryPerformance}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(order.createdAt), 'MMM d, yyyy h:mm a')} • {order.farmName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold">R{order.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{order.itemCount} items</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span className="text-sm">{item.quantity}x {item.productName}</span>
                          <span className="text-sm font-medium">R{item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    {/* Delivery Performance */}
                    {order.deliveryRating && (
                      <div className="flex items-center gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{order.deliveryRating}/5</span>
                        </div>
                        {order.deliveryFeedback && (
                          <p className="text-sm text-muted-foreground flex-1">
                            "{order.deliveryFeedback}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Receipt className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reorder
                      </Button>
                      {order.status === 'delivered' && !order.deliveryRating && (
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-2" />
                          Rate Delivery
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredOrders.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'You haven\'t placed any orders yet'}
                    </p>
                    <Button onClick={() => navigate('/browse-products')}>
                      Start Shopping
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                {/* Spending Patterns */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Spending Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Favorite Categories */}
                      <div>
                        <h4 className="font-medium mb-3">Favorite Categories</h4>
                        <div className="space-y-3">
                          {analytics.favoriteCategories.map((category) => (
                            <div key={category.category} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="capitalize">{category.category}</span>
                                <span>{category.count} orders ({category.percentage}%)</span>
                              </div>
                              <Progress value={category.percentage} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Products */}
                      <div>
                        <h4 className="font-medium mb-3">Favorite Products</h4>
                        <div className="space-y-3">
                          {analytics.favoriteProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{product.productName}</p>
                                <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                              </div>
                              <span className="font-medium">R{product.totalSpent.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.deliveryPerformance.early}</div>
                        <div className="text-sm text-muted-foreground">Early Deliveries</div>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.deliveryPerformance.onTime}</div>
                        <div className="text-sm text-muted-foreground">On-Time Deliveries</div>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{analytics.deliveryPerformance.late}</div>
                        <div className="text-sm text-muted-foreground">Late Deliveries</div>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{analytics.deliveryPerformance.averageRating}</div>
                        <div className="text-sm text-muted-foreground">Average Rating</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Farmers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Your Top Farmers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topFarmers.map((farmer, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{farmer.farmName}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{farmer.orders} orders</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{farmer.rating}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="font-medium">R{farmer.totalSpent.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Reorder Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Smart Reorder Suggestions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on your ordering patterns, we suggest these items for reordering
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reorderSuggestions.map((suggestion) => (
                    <Card key={suggestion.productId} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{suggestion.productName}</h4>
                            <p className="text-sm text-muted-foreground">{suggestion.farmName}</p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {suggestion.confidence}% match
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span>Every {suggestion.frequency} days</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span>Last: {format(parseISO(suggestion.lastOrderDate), 'MMM d')}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-medium">R{suggestion.price.toFixed(2)}</span>
                          <Button size="sm" onClick={() => handleReorderSuggestion(suggestion)}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Performance Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Delivery Performance History
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track how well your deliveries have performed over time
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deliveryPerformance.map((delivery) => (
                    <div key={delivery.orderId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{delivery.farmName}</h4>
                          <p className="text-sm text-muted-foreground">Order #{delivery.orderId}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={getPerformanceColor(delivery.performance)}
                          >
                            {delivery.performance}
                          </Badge>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{delivery.rating}/5</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Estimated: </span>
                          <span>{format(parseISO(delivery.estimatedDate), 'MMM d, h:mm a')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual: </span>
                          <span>{format(parseISO(delivery.actualDate), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>

                      {delivery.feedback && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm">"{delivery.feedback}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bulk Actions Dialog */}
      <Dialog open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have selected {selectedOrders.length} orders. What would you like to do?
            </p>
            
            <div className="space-y-2">
              <Button className="w-full justify-start" onClick={handleBulkReorder}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reorder All Items
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Selected Orders
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Heart className="h-4 w-4 mr-2" />
                Add All to Favorites
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkActionOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedOrderHistory;