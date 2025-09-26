import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Search, 
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ShoppingCart,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Eye,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Star,
  Heart,
  BarChart3,
  Users,
  Award,
  MapPin
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";

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
  shippingAddress: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  deliveryPerformance?: 'early' | 'on-time' | 'late';
  deliveryRating?: number;
  deliveryFeedback?: string;
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
  seasonalPatterns: { season: string; orders: number; totalSpent: number }[];
}

interface ReorderSuggestion {
  productId: string;
  productName: string;
  farmName: string;
  lastOrderDate: string;
  frequency: number;
  confidence: number;
  reason: string;
  price: number;
  category: string;
  image?: string;
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

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
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
  // Helper: undelivered order statuses
  const undeliveredStatuses = ['pending', 'processing', 'shipped', 'out_for_delivery', 'preparing', 'ready', 'confirmed'];
  const undeliveredOrders = orders.filter(order => undeliveredStatuses.includes(order.status));
  // Tracking helpers (from TrackOrder)
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
  const getStatusIconTrack = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return CheckCircle;
      case 'out_for_delivery': case 'shipped': return Truck;
      case 'processing': case 'preparing': return Package;
      default: return Clock;
    }
  };

  // Dialog states
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  useEffect(() => {
    if (orders.length > 0) {
      loadAnalytics();
      loadReorderSuggestions();
      loadDeliveryPerformance();
    }
  }, [orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        toast({ title: 'User Error', description: 'User ID is required to load orders', variant: 'destructive' });
        console.error('User ID is required to load orders');
        setLoading(false);
        return;
      }
      const { data: ordersData, error: ordersError, status } = await supabase
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
              farmer_id,
              price
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (ordersError || status === 400) {
        toast({ title: 'Order Fetch Error', description: ordersError?.message || 'Failed to fetch orders. Please try again.', variant: 'destructive' });
        console.error('Supabase orders error:', ordersError);
        setLoading(false);
        return;
      }
      // Get unique farmer IDs to fetch farm names
      const farmerIds = [...new Set(
        (ordersData || []).flatMap(order => 
          order.order_items?.map((item: any) => item.products?.farmer_id).filter(Boolean) || []
        )
      )];
      // Fetch farm names for the farmers
      const { data: farmsData, error: farmsError, status: farmsStatus } = await supabase
        .from('farms')
        .select('id, name, farmer_id')
        .in('farmer_id', farmerIds);
      if (farmsError || farmsStatus === 400) {
        toast({ title: 'Farm Fetch Error', description: farmsError?.message || 'Failed to fetch farm names.', variant: 'destructive' });
        console.error('Supabase farms error:', farmsError);
        setLoading(false);
        return;
      }
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
          shippingAddress: order.shipping_address || '',
          estimatedDelivery: order.updated_at,
          actualDelivery: order.status === 'delivered' ? order.updated_at : undefined,
          deliveryPerformance: order.status === 'delivered' ? 'on-time' : undefined
        };
      });

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
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
      if (orders.length === 0) {
        setAnalytics(null);
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

      // Calculate top farmers
      const farmerStats: Record<string, { orders: number; totalSpent: number }> = {};
      orders.forEach(order => {
        if (!farmerStats[order.farmName]) {
          farmerStats[order.farmName] = { orders: 0, totalSpent: 0 };
        }
        farmerStats[order.farmName].orders += 1;
        farmerStats[order.farmName].totalSpent += order.total;
      });

      const topFarmers = Object.entries(farmerStats)
        .map(([farmName, stats]) => ({ 
          farmName, 
          ...stats, 
          rating: 4.5 + Math.random() * 0.5
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

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
          averageRating: 4.5
        },
        topFarmers,
        seasonalPatterns: []
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const loadReorderSuggestions = async () => {
    try {
      if (orders.length === 0) return;

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
            category: stats.category,
            image: orders.find(o => o.items.some(i => i.productId === productId))?.items.find(i => i.productId === productId)?.image
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
        rating: order.deliveryRating || (4 + Math.random()),
        feedback: order.deliveryFeedback
      }));
      
      setDeliveryPerformance(performance);
    } catch (error) {
      console.error('Error loading delivery performance:', error);
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      const { data: orderWithItems, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              price,
              images,
              farmer_id,
              category,
              unit
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        toast({
          title: "Error",
          description: "Failed to fetch order details",
          variant: "destructive",
        });
        return;
      }

      if (!orderWithItems?.order_items?.length) {
        toast({
          title: "Error",
          description: "No items found in this order",
          variant: "destructive",
        });
        return;
      }

      let itemsAdded = 0;
      for (const item of orderWithItems.order_items) {
        if (item.products) {
          const cartItem = {
            id: item.products.id,
            name: item.products.name,
            price: item.products.price,
            images: item.products.images,
            farmer_id: item.products.farmer_id,
            category: item.products.category,
            unit: item.products.unit || 'kg',
            quantity: item.quantity
          };
          
          await addToCart(cartItem);
          itemsAdded++;
        }
      }

      if (itemsAdded > 0) {
        toast({
          title: "Success",
          description: `${itemsAdded} items added to cart`,
        });
        navigate("/cart");
      } else {
        toast({
          title: "Notice",
          description: "No items could be added",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error reordering:", error);
      toast({
        title: "Error",
        description: "Failed to reorder items",
        variant: "destructive",
      });
    }
  };

  // Only show last 3 orders by default
  const filteredOrders = orders
    .filter(order => {
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
    })
    .slice(0, 3); // Show only last 3 orders

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
    
    for (const item of allItems) {
      const cartItem = {
        id: item.productId,
        name: item.productName,
        price: item.unitPrice,
        images: [item.image || '/placeholder.svg'],
        farmer_id: 'unknown',
        category: item.category,
        unit: 'kg',
        quantity: item.quantity
      };
      
      try {
        await addToCart(cartItem);
      } catch (error) {
        console.error('Error adding item to cart:', error);
      }
    }
    
    toast({
      title: "Items added to cart",
      description: `${allItems.length} items from ${selectedOrders.length} orders added to cart`,
    });
    
    setSelectedOrders([]);
    setIsBulkActionOpen(false);
    navigate('/cart');
  };

  const handleReorderSuggestion = async (suggestion: ReorderSuggestion) => {
    const cartItem = {
      id: suggestion.productId,
      name: suggestion.productName,
      price: suggestion.price,
      images: [suggestion.image || '/placeholder.svg'],
      farmer_id: 'unknown',
      category: suggestion.category,
      unit: 'kg',
      quantity: 1
    };
    
    try {
      await addToCart(cartItem);
      toast({
        title: "Added to cart",
        description: `${suggestion.productName} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding suggestion to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
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

  const exportToPDF = async () => {
    try {
      const doc = document.createElement('div');
      // Use CSS classes for styling
      doc.innerHTML = `
        <div class="order-history-report" style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center; margin-bottom: 30px;">Order History Report</h1>
          ${filteredOrders.map(order => `
            <div class="order-history-order" style="border: 1px solid #ddd; margin: 20px 0; padding: 15px;">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Total:</strong> R${order.total.toFixed(2)}</p>
              <p><strong>Items:</strong> ${order.itemCount}</p>
            </div>
          `).join('')}
          ${analytics && analytics.spendingTrend ? `
            <h2 style="margin-top: 40px;">Spending Trend (Last 6 Months)</h2>
            <div class="order-history-spending-bars">
              ${(() => {
                const maxAmount = Math.max(...analytics.spendingTrend.map(m => m.amount));
                return analytics.spendingTrend.map(month => {
                  const barHeight = Math.max(20, (month.amount / maxAmount) * 100);
                  return `
                    <div class="spending-bar" style="height: auto;">
                      <div class="spending-bar" style="height: ${barHeight}px;"></div>
                      <span class="spending-bar-label">${month.month}</span>
                      <span class="spending-bar-value">R${month.amount.toFixed(0)}</span>
                    </div>
                  `;
                }).join('');
              })()}
            </div>
          ` : ''}
        </div>
      `;
      // Add CSS file for PDF print
      const style = document.createElement('style');
      style.textContent = `@import url('order-history.css');`;
      doc.appendChild(style);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(doc.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
      toast({
        title: "Success",
        description: "PDF export initiated",
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export to PDF",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Order Number', 'Date', 'Status', 'Total Amount', 'Items Count', 'Farm Name'];
      const csvData = filteredOrders.map(order => [
        order.orderNumber,
        new Date(order.createdAt).toLocaleDateString(),
        order.status,
        order.total.toFixed(2),
        order.itemCount,
        order.farmName
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "CSV file downloaded",
      });
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        title: "Error",
        description: "Failed to export to CSV",
        variant: "destructive",
      });
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
            <Button variant="outline" onClick={exportToPDF}>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Delivery Rating</p>
                    <p className="text-2xl font-bold">{analytics.deliveryPerformance.averageRating.toFixed(1)}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="track">Track Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="suggestions">Reorder</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
          {/* Track Orders Tab */}
          <TabsContent value="track" className="space-y-6">
            {undeliveredOrders.length > 0 ? (
              <div className="space-y-4">
                {undeliveredOrders.map(order => {
                  const StatusIcon = getStatusIconTrack(order.status);
                  const statusProgress = getStatusProgress(order.status);
                  return (
                    <Card key={order.id} className="border-2 border-primary/30">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}> <StatusIcon className="h-6 w-6 text-white" /> </div>
                          <div>
                            <h2 className="font-bold text-lg text-primary">Order #{order.orderNumber}</h2>
                            <p className="text-sm text-muted-foreground">{order.farmName}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                          </div>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Order Progress</span>
                          <span>{statusProgress}%</span>
                        </div>
                        <Progress value={statusProgress} className="h-2" />
                        {order.estimatedDelivery && (
                          <div className="flex items-center gap-3 p-2 bg-muted rounded-lg mt-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Estimated Delivery</p>
                              <p className="text-sm text-muted-foreground">{order.estimatedDelivery}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3 p-2 bg-muted rounded-lg">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Delivery Address</p>
                            <p className="text-sm text-muted-foreground">{order.shippingAddress || 'No address provided'}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {order.items.map(item => (
                            <div key={item.id} className="flex flex-col items-center w-20">
                              <img src={item.image || '/placeholder.svg'} alt={item.productName} className="w-10 h-10 object-cover rounded" />
                              <span className="text-xs text-center mt-1">{item.productName}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-lg font-semibold mt-2">
                          <span>Total</span>
                          <span>R{order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/track-order/${order.id}`)}>
                            View Details
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate('/browse-products')}>
                            Start Shopping
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No undelivered orders</h3>
                  <p className="text-muted-foreground mb-6">All your orders have been delivered or cancelled.</p>
                  <Button onClick={() => navigate('/browse-products')}>Start Shopping</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders, products, or farms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background text-sm"
                      title="Filter orders by status"
                      aria-label="Filter orders by status"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background text-sm"
                      title="Filter orders by date range"
                      aria-label="Filter orders by date range"
                    >
                      <option value="all">All Time</option>
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="quarter">Last Quarter</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>
                </div>
                
                {filteredOrders.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    <Checkbox
                      checked={selectedOrders.length === filteredOrders.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select all ({filteredOrders.length} orders)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orders List */}
            <div className="space-y-4">
              {/* Group orders by farm */}
              {Array.from(new Set(filteredOrders.map(o => o.farmName))).map(farmName => {
                const farmOrders = filteredOrders.filter(o => o.farmName === farmName);
                // Get the farmerId from the first order for this farm
                const farmerId = farmOrders[0]?.farmerId || '';
                // Collect all products from this farm across orders
                const farmProducts = farmOrders.flatMap(o => o.items.filter(i => i.farmName === farmName));
                return (
                  <Card key={farmName} className="border-2 border-primary/30">
                    <CardHeader className="cursor-pointer" onClick={() => navigate(`/farmer/${farmerId}`)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-bold text-lg text-primary hover:underline">{farmName}</h2>
                          <p className="text-sm text-muted-foreground">{farmOrders.length} order{farmOrders.length > 1 ? 's' : ''}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={e => {e.stopPropagation();navigate(`/farmer/${farmerId}`);}}>
                          View Farm
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Products from this farm */}
                      <div className="mb-2 font-semibold text-base">Products from {farmName}:</div>
                      <div className="flex flex-wrap gap-3">
                        {farmProducts.length > 0 ? farmProducts.map(product => (
                          <div key={product.id} className="flex flex-col items-center w-24">
                            <img src={product.image || '/placeholder.svg'} alt={product.productName} className="w-12 h-12 object-cover rounded" />
                            <span className="text-xs text-center mt-1">{product.productName}</span>
                          </div>
                        )) : <span className="text-muted-foreground">No products found</span>}
                      </div>
                      {/* List orders for this farm */}
                      <div className="mt-4">
                        {farmOrders.map(order => (
                          <div key={order.id} className="border-b py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Order #{order.orderNumber}</span>
                              <span className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                              <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                              </Badge>
                              <span className="font-bold">R{order.total.toFixed(2)}</span>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/track-order/${order.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />View
                              </Button>
                              {order.status === 'delivered' && (
                                <Button variant="outline" size="sm" onClick={() => handleReorder(order.id)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />Reorder
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredOrders.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                        ? "Try adjusting your search or filter criteria"
                        : "Start shopping to see your orders here"
                      }
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
                {/* Spending Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Spending Trend (Last 6 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-4">
                      {analytics.spendingTrend.map((month, index) => (
                        <div key={month.month} className="text-center">
                          {(() => {
                            const maxAmount = Math.max(...analytics.spendingTrend.map(m => m.amount));
                            const barHeight = Math.max(20, (month.amount / maxAmount) * 100);
                            return (
                              <div
                                className="bg-primary/10 rounded-t bar-chart-bar"
                                style={{ '--bar-height': `${barHeight}px` } as React.CSSProperties}
                                title={`${month.month}: R${month.amount.toFixed(2)}`}
                              ></div>
                            );
                          })()}
                          <p className="text-xs mt-2">{month.month}</p>
                          <p className="text-xs font-medium">R{month.amount.toFixed(0)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Favorite Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle>Favorite Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.favoriteCategories.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <span className="capitalize">{category.category}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={category.percentage} className="w-20" />
                            <span className="text-sm text-muted-foreground w-12">
                              {category.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Farmers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Top Farmers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topFarmers.map((farmer, index) => (
                        <div key={farmer.farmName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{farmer.farmName}</p>
                            <p className="text-sm text-muted-foreground">
                              {farmer.orders} orders • R{farmer.totalSpent.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{farmer.rating.toFixed(1)}</span>
                          </div>
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
                  <RefreshCw className="h-5 w-5" />
                  Smart Reorder Suggestions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on your order history and preferences
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reorderSuggestions.map((suggestion) => (
                    <Card key={suggestion.productId} className="p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={suggestion.image || '/placeholder.svg'}
                          alt={suggestion.productName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{suggestion.productName}</h4>
                          <p className="text-sm text-muted-foreground">{suggestion.farmName}</p>
                          <p className="text-sm text-muted-foreground">
                            Last ordered: {format(new Date(suggestion.lastOrderDate), 'MMM dd')}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.confidence}% confidence
                            </Badge>
                            <span className="text-sm font-medium">R{suggestion.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-3"
                        variant="outline"
                        onClick={() => handleReorderSuggestion(suggestion)}
                      >
                        Add to Cart
                      </Button>
                    </Card>
                  ))}
                </div>
                
                {reorderSuggestions.length === 0 && (
                  <div className="text-center py-8">
                    <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No reorder suggestions available. Place more orders to see personalized recommendations.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Performance Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Delivery Performance
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track delivery times and rate your experience
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deliveryPerformance.map((delivery) => (
                    <div key={delivery.orderId} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{delivery.farmName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Order #{delivery.orderId.substring(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expected: {format(new Date(delivery.estimatedDate), 'MMM dd')} • 
                          Delivered: {format(new Date(delivery.actualDate), 'MMM dd')}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={getPerformanceColor(delivery.performance)}
                        >
                          {delivery.performance.charAt(0).toUpperCase() + delivery.performance.slice(1)}
                        </Badge>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{delivery.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {deliveryPerformance.length === 0 && (
                  <div className="text-center py-8">
                    <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No delivery data available yet.
                    </p>
                  </div>
                )}
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
              
              <Button variant="outline" className="w-full justify-start" onClick={exportToPDF}>
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

export default OrderHistory;