import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Home,
  Phone,
  MessageCircle,
  Video,
  MapPin,
  Camera,
  Star,
  AlertTriangle,
  Bell,
  Shield,
  Calendar,
  Navigation,
  Info,
  Edit,
  Send,
  ImageIcon,
  FileText,
  User,
  ThumbsUp,
  ThumbsDown,
  Flag
} from "lucide-react";
import { format, addMinutes, isAfter, isBefore } from "date-fns";

// Enhanced interfaces
interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  estimatedDelivery: string;
  actualDelivery?: string;
  farmName: string;
  farmerId: string;
  farmerPhone: string;
  farmerImage?: string;
  trackingId: string;
  shippingAddress: string;
  deliveryInstructions: string;
  deliveryWindow: {
    start: string;
    end: string;
  };
  driver?: {
    name: string;
    phone: string;
    image?: string;
    vehicle: string;
    plateNumber: string;
  };
  statusHistory: StatusUpdate[];
  liveLocation?: {
    lat: number;
    lng: number;
    lastUpdated: string;
  };
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string;
}

interface StatusUpdate {
  id: string;
  status: string;
  message: string;
  timestamp: string;
  location?: string;
  image?: string;
}

interface DeliveryPhoto {
  id: string;
  type: 'package' | 'location' | 'safe_drop';
  url: string;
  caption: string;
  timestamp: string;
}

interface ContactOption {
  type: 'call' | 'message' | 'video';
  label: string;
  icon: any;
  available: boolean;
  action: () => void;
}

interface DeliveryIssue {
  type: 'damaged' | 'missing' | 'wrong_item' | 'late' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  images?: File[];
}

interface DeliveryRating {
  overall: number;
  timeliness: number;
  condition: number;
  communication: number;
  feedback: string;
}

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracking');

  // Enhanced features state
  const [deliveryPhotos, setDeliveryPhotos] = useState<DeliveryPhoto[]>([]);
  const [updatedInstructions, setUpdatedInstructions] = useState('');
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [deliveryWindowNotified, setDeliveryWindowNotified] = useState(false);

  // Dialog states
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<DeliveryPhoto | null>(null);

  // Form states
  const [deliveryRating, setDeliveryRating] = useState<DeliveryRating>({
    overall: 0,
    timeliness: 0,
    condition: 0,
    communication: 0,
    feedback: ''
  });
  
  const [deliveryIssue, setDeliveryIssue] = useState<DeliveryIssue>({
    type: 'damaged',
    description: '',
    severity: 'medium',
    images: []
  });

  useEffect(() => {
    if (user) {
      if (orderId) {
        loadOrder();
        loadDeliveryPhotos();
        checkDeliveryWindow();
      } else {
        // No orderId provided, set loading to false to show empty state
        setLoading(false);
      }
    }
  }, [orderId, user]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      
      if (!orderId) {
        toast({
          title: "Invalid Order",
          description: "Order ID is required",
          variant: "destructive",
        });
        navigate('/order-history');
        return;
      }

      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your orders",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              images,
              farmer_id
            )
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError) {
        console.error('Database error:', orderError);
        if (orderError.code === 'PGRST116') {
          throw new Error('Order not found');
        }
        throw orderError;
      }
      
      if (!orderData) {
        throw new Error('Order not found');
      }

      // Get unique farmer IDs to fetch farm names and details
      const farmerIds = [...new Set(
        (orderData.order_items || []).map((item: any) => item.products?.farmer_id).filter(Boolean)
      )];

      // Fetch farm names and farmer details
      let farmName = 'Unknown Farm';
      let farmerPhone = '';
      let farmerImage = '/placeholder.svg';

      if (farmerIds.length > 0) {
        const { data: farmsData } = await supabase
          .from('farms')
          .select(`
            name,
            farmer_id,
            profiles!farms_farmer_id_fkey (
              phone,
              avatar_url
            )
          `)
          .in('farmer_id', farmerIds)
          .limit(1)
          .single();

        if (farmsData) {
          farmName = farmsData.name;
          const profile = farmsData.profiles as any;
          farmerPhone = profile?.phone || '';
          farmerImage = profile?.avatar_url || '/placeholder.svg';
        }
      }

      // Map database status to component status
      const statusMap: Record<string, Order['status']> = {
        'pending': 'pending',
        'processing': 'preparing',
        'shipped': 'out_for_delivery',
        'delivered': 'delivered',
        'cancelled': 'cancelled'
      };

      // Transform the data to match our Order interface
      const transformedOrder: Order = {
        id: orderData.id,
        orderNumber: orderData.id.substring(0, 8).toUpperCase(),
        status: statusMap[orderData.status] || 'pending',
        total: orderData.total,
        items: (orderData.order_items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.quantity * item.unit_price,
          image: item.products?.images?.[0] || '/placeholder.svg'
        })),
        estimatedDelivery: orderData.updated_at,
        farmName: farmName,
        farmerId: farmerIds[0] || '',
        farmerPhone: farmerPhone,
        farmerImage: farmerImage,
        trackingId: `TRK${orderData.id.substring(0, 8).toUpperCase()}`,
        shippingAddress: orderData.shipping_address || '',
        deliveryInstructions: 'Leave at front door if no answer.',
        deliveryWindow: {
          start: orderData.updated_at,
          end: orderData.updated_at
        },
        driver: {
          name: 'Driver assigned',
          phone: '',
          image: '/placeholder.svg',
          vehicle: 'Delivery vehicle',
          plateNumber: 'N/A'
        },
        statusHistory: [
          {
            id: '1',
            status: 'Order Confirmed',
            message: 'Your order has been confirmed',
            timestamp: orderData.created_at,
            location: farmName
          }
        ],
        liveLocation: undefined
      };

      setOrder(transformedOrder);
      setUpdatedInstructions(transformedOrder.deliveryInstructions);
      
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: "Error loading order",
        description: "Order not found or access denied",
        variant: "destructive",
      });
      navigate('/order-history');
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryPhotos = async () => {
    if (!orderId) return;
    
    try {
      const { data, error } = await supabase
        .from('delivery_photos')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const photos: DeliveryPhoto[] = (data || []).map(photo => ({
        id: photo.id,
        type: photo.type as any,
        url: photo.url,
        caption: photo.caption || '',
        timestamp: photo.created_at
      }));

      setDeliveryPhotos(photos);
    } catch (error) {
      console.error('Error loading delivery photos:', error);
    }
  };

  const checkDeliveryWindow = () => {
    if (!order) return;
    
    const now = new Date();
    const windowStart = new Date(order.deliveryWindow.start);
    const windowEnd = new Date(order.deliveryWindow.end);
    const notificationTime = addMinutes(windowStart, -30); // 30 minutes before window

    if (isAfter(now, notificationTime) && isBefore(now, windowEnd) && !deliveryWindowNotified) {
      setDeliveryWindowNotified(true);
      toast({
        title: "Delivery Window Alert",
        description: "Your delivery is expected within the next 30 minutes!",
      });
    }
  };

  const handleUpdateInstructions = async () => {
    if (!order) return;

    try {
      // In real app, update in Supabase
      setOrder(prev => prev ? { ...prev, deliveryInstructions: updatedInstructions } : null);
      setIsEditingInstructions(false);
      
      toast({
        title: "Instructions updated",
        description: "Your delivery instructions have been updated",
      });
    } catch (error) {
      toast({
        title: "Error updating instructions",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleContactAction = (type: 'call' | 'message' | 'video', target: 'farmer' | 'driver') => {
    const contact = target === 'farmer' 
      ? { name: order?.farmName, phone: order?.farmerPhone }
      : { name: order?.driver?.name, phone: order?.driver?.phone };

    switch (type) {
      case 'call':
        window.open(`tel:${contact.phone}`);
        break;
      case 'message':
        navigate(`/messages?contact=${target}&orderId=${orderId}`);
        break;
      case 'video':
        // In real app, initiate video call
        toast({
          title: "Video call requested",
          description: `Requesting video call with ${contact.name}`,
        });
        break;
    }
    
    setIsContactDialogOpen(false);
  };

  const handleSubmitRating = async () => {
    if (!order || deliveryRating.overall === 0) {
      toast({
        title: "Rating required",
        description: "Please provide an overall rating",
        variant: "destructive",
      });
      return;
    }

    try {
      // In real app, save to Supabase
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
      
      setIsRatingDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error submitting rating",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleReportIssue = async () => {
    if (!deliveryIssue.description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the issue",
        variant: "destructive",
      });
      return;
    }

    try {
      // In real app, save to Supabase and notify support
      toast({
        title: "Issue reported",
        description: "Our support team will contact you shortly",
      });
      
      setIsIssueDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error reporting issue",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const getStatusProgress = (status: string) => {
    const statusMap = {
      'pending': 0,
      'confirmed': 25,
      'preparing': 50,
      'out_for_delivery': 75,
      'delivered': 100,
      'cancelled': 0
    };
    return statusMap[status as keyof typeof statusMap] || 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'preparing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <Home className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const contactOptions: ContactOption[] = [
    {
      type: 'call',
      label: 'Phone Call',
      icon: Phone,
      available: true,
      action: () => handleContactAction('call', 'farmer')
    },
    {
      type: 'message',
      label: 'Send Message',
      icon: MessageCircle,
      available: true,
      action: () => handleContactAction('message', 'farmer')
    },
    {
      type: 'video',
      label: 'Video Call',
      icon: Video,
      available: order?.status === 'out_for_delivery',
      action: () => handleContactAction('video', 'driver')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="flex items-center px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="ml-2 text-lg font-semibold">Track Order</h1>
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

  if (!order && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="flex items-center px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="ml-2 text-lg font-semibold">Track Order</h1>
          </div>
        </header>
        <main className="p-4 space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {orderId ? "Order not found" : "No Order to Track"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {orderId 
                  ? "The order you're looking for doesn't exist or you don't have permission to view it."
                  : "Enter an order ID or select an order from your order history to track its progress."
                }
              </p>
              
              {!orderId && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter order number (e.g., ORD12345)" 
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value) {
                            navigate(`/track-order/${value}`);
                          }
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        const input = document.querySelector('input[placeholder*="order number"]') as HTMLInputElement;
                        const value = input?.value.trim();
                        if (value) {
                          navigate(`/track-order/${value}`);
                        }
                      }}
                    >
                      Track
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Don't have your order number? Check your email confirmation or view your order history.
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={() => navigate('/order-history')}>
                  <Package className="h-4 w-4 mr-2" />
                  Order History
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!order) {
    return null; // This should not happen due to earlier checks, but handles the TypeScript null case
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
            <div>
              <h1 className="text-lg font-semibold">Track Order</h1>
              <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsContactDialogOpen(true)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
            {order.status === 'delivered' && (
              <Button size="sm" onClick={() => setIsRatingDialogOpen(true)}>
                <Star className="h-4 w-4 mr-2" />
                Rate
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Status Overview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">{order.farmName}</h2>
                <p className="text-muted-foreground">
                  {order.items.length} items • R{order.total.toFixed(2)}
                </p>
              </div>
              
              <Badge variant="outline" className="gap-2">
                {getStatusIcon(order.status)}
                {order.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{getStatusProgress(order.status)}%</span>
              </div>
              <Progress value={getStatusProgress(order.status)} className="h-2" />
            </div>

            {/* Delivery Window */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Delivery Window</span>
              </div>
              <p className="text-blue-700 text-sm">
                {format(new Date(order.deliveryWindow.start), 'h:mm a')} - {format(new Date(order.deliveryWindow.end), 'h:mm a')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            {/* Live Location */}
            {order.status === 'out_for_delivery' && order.liveLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Live Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 h-48 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm">Live map would be shown here</p>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {format(new Date(order.liveLocation.lastUpdated), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  {order.driver && (
                    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                      <Avatar>
                        <AvatarImage src={order.driver.image} alt={order.driver.name} />
                        <AvatarFallback>{order.driver.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{order.driver.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.driver.vehicle} • {order.driver.plateNumber}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleContactAction('call', 'driver')}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status History */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.statusHistory.map((status, index) => (
                    <div key={status.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {getStatusIcon(status.status)}
                        </div>
                        {index < order.statusHistory.length - 1 && (
                          <div className="w-px h-12 bg-border mt-2" />
                        )}
                      </div>
                      
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{status.status}</h4>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(status.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{status.message}</p>
                        
                        {status.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {status.location}
                          </div>
                        )}
                        
                        {status.image && (
                          <img
                            src={status.image}
                            alt="Status update"
                            className="mt-2 w-32 h-24 object-cover rounded-lg cursor-pointer"
                            onClick={() => {
                              setSelectedPhoto({
                                id: status.id,
                                type: 'package',
                                url: status.image!,
                                caption: status.message,
                                timestamp: status.timestamp
                              });
                              setIsPhotoDialogOpen(true);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} • R{item.unitPrice.toFixed(2)} each
                        </p>
                      </div>
                      <span className="font-medium">R{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Delivery Instructions
                  {order.status !== 'delivered' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingInstructions(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingInstructions ? (
                  <div className="space-y-4">
                    <Textarea
                      value={updatedInstructions}
                      onChange={(e) => setUpdatedInstructions(e.target.value)}
                      placeholder="Enter delivery instructions..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateInstructions}>
                        <Send className="h-4 w-4 mr-2" />
                        Update
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingInstructions(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm">{order.deliveryInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.shippingAddress}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Delivery Photos
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Photos taken during the delivery process for your peace of mind
                </p>
              </CardHeader>
              <CardContent>
                {deliveryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {deliveryPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group cursor-pointer"
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setIsPhotoDialogOpen(true);
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <div className="text-white text-center">
                            <Camera className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs">{photo.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {photo.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No photos yet</h3>
                    <p className="text-muted-foreground">
                      Photos will appear here once your delivery is in progress
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            {/* Farmer Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Farm Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={order.farmerImage} alt={order.farmName} />
                    <AvatarFallback>{order.farmName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{order.farmName}</h4>
                    <p className="text-sm text-muted-foreground">{order.farmerPhone}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {contactOptions.map((option) => (
                    <Button
                      key={option.type}
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={option.action}
                      disabled={!option.available}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Driver Contact */}
            {order.driver && order.status === 'out_for_delivery' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Driver
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={order.driver.image} alt={order.driver.name} />
                      <AvatarFallback>{order.driver.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{order.driver.name}</h4>
                      <p className="text-sm text-muted-foreground">{order.driver.phone}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.driver.vehicle} • {order.driver.plateNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleContactAction('call', 'driver')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Driver
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleContactAction('message', 'driver')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issue Reporting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Report an Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Having problems with your delivery? Let us know and we'll help resolve it quickly.
                </p>
                <Button variant="outline" onClick={() => setIsIssueDialogOpen(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Contact Options Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Options</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Contact {order.farmName}</h4>
              <div className="grid grid-cols-1 gap-2">
                {contactOptions.map((option) => (
                  <Button
                    key={option.type}
                    variant="outline"
                    className="justify-start"
                    onClick={option.action}
                    disabled={!option.available}
                  >
                    <option.icon className="h-4 w-4 mr-2" />
                    {option.label}
                    {!option.available && <span className="ml-auto text-xs text-muted-foreground">(Not available)</span>}
                  </Button>
                ))}
              </div>
            </div>
            
            {order.driver && order.status === 'out_for_delivery' && (
              <div>
                <h4 className="font-medium mb-3">Contact Driver</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => handleContactAction('call', 'driver')}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" onClick={() => handleContactAction('message', 'driver')}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Delivery</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Overall Rating */}
            <div>
              <Label>Overall Experience</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeliveryRating(prev => ({ ...prev, overall: rating }))}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= deliveryRating.overall 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Detailed Ratings */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Timeliness</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeliveryRating(prev => ({ ...prev, timeliness: rating }))}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          rating <= deliveryRating.timeliness 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Product Condition</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeliveryRating(prev => ({ ...prev, condition: rating }))}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          rating <= deliveryRating.condition 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Communication</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeliveryRating(prev => ({ ...prev, communication: rating }))}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          rating <= deliveryRating.communication 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <Label htmlFor="feedback">Additional Feedback</Label>
              <Textarea
                id="feedback"
                value={deliveryRating.feedback}
                onChange={(e) => setDeliveryRating(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Tell us about your delivery experience..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRating}>
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Reporting Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Delivery Issue</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="issueType">Issue Type</Label>
              <Select
                value={deliveryIssue.type}
                onValueChange={(value) => setDeliveryIssue(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Damaged Items</SelectItem>
                  <SelectItem value="missing">Missing Items</SelectItem>
                  <SelectItem value="wrong_item">Wrong Items</SelectItem>
                  <SelectItem value="late">Late Delivery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={deliveryIssue.severity}
                onValueChange={(value) => setDeliveryIssue(prev => ({ ...prev, severity: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                  <SelectItem value="medium">Medium - Moderate issue</SelectItem>
                  <SelectItem value="high">High - Serious problem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={deliveryIssue.description}
                onChange={(e) => setDeliveryIssue(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please describe the issue in detail..."
                rows={4}
              />
            </div>

            <div>
              <Label>Attach Photos (Optional)</Label>
              <Button variant="outline" className="w-full mt-2">
                <Camera className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportIssue}>
              Report Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Photo</DialogTitle>
          </DialogHeader>
          
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="w-full h-96 object-cover rounded-lg"
              />
              <div>
                <h4 className="font-medium">{selectedPhoto.caption}</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedPhoto.timestamp), 'MMM d, yyyy h:mm a')}
                </p>
                <Badge variant="outline" className="mt-2">
                  {selectedPhoto.type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhotoDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackOrder;