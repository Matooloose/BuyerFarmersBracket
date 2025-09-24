import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Home,
  Package,
  MessageCircle,
  Search,
  Bookmark,
  Share2,
  Clock,
  MapPin,
  Gift,
  Calendar,
  Leaf,
  Star,
  TrendingUp,
  Users,
  Bell,
  Settings,
  CheckCircle,
  AlertCircle,
  Truck,
  X,
  Copy,
  QrCode,
  Heart,
  Zap,
  Target,
  Recycle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";

// Enhanced interfaces
interface SmartSuggestion {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  farmName: string;
  reason: string;
  confidence: number;
  bundleDiscount?: number;
}

interface DeliveryEstimate {
  itemId: string;
  estimatedDays: number;
  availability: 'in_stock' | 'low_stock' | 'pre_order';
  fastestOption: string;
  carbonFootprint: number; // kg CO2
}

interface BundleDeal {
  id: string;
  title: string;
  description: string;
  items: string[];
  discount: number;
  savings: number;
  validUntil: string;
}

interface DeliveryAddress {
  id: string;
  label: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
  instructions?: string;
}

interface RecurringOrder {
  id: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextDelivery: string;
  items: string[];
  active: boolean;
}

interface GiftOptions {
  itemId: string;
  isGift: boolean;
  wrapperType: 'eco_friendly' | 'premium' | 'basic';
  message: string;
  recipientName: string;
}

interface CartShare {
  id: string;
  shareCode: string;
  expiresAt: string;
  allowEditing: boolean;
  sharedWith: string[];
}

interface PriceAlert {
  itemId: string;
  targetPrice: number;
  enabled: boolean;
  currentPrice: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cartItems, updateQuantity, removeItem, getTotalPrice, getTotalItems, addToCart } = useCart();

  // Enhanced state management
  const [activeTab, setActiveTab] = useState('cart');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [deliveryEstimates, setDeliveryEstimates] = useState<DeliveryEstimate[]>([]);
  const [bundleDeals, setBundleDeals] = useState<BundleDeal[]>([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [recurringOrders, setRecurringOrders] = useState<RecurringOrder[]>([]);
  const [giftOptions, setGiftOptions] = useState<Record<string, GiftOptions>>({});
  const [cartShare, setCartShare] = useState<CartShare | null>(null);
  const [priceAlerts, setPriceAlerts] = useState<Record<string, PriceAlert>>({});
  
  // Existing state
  const [savedItems, setSavedItems] = useState(() => {
    const stored = localStorage.getItem('savedItems');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [notes, setNotes] = useState(() => {
    const stored = localStorage.getItem('cartNotes');
    return stored ? JSON.parse(stored) : {};
  });
  
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  
  // Dialog states
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false);

  // Load enhanced data on component mount
  useEffect(() => {
    if (cartItems.length > 0) {
      loadSmartSuggestions();
      loadDeliveryEstimates();
      loadBundleDeals();
      loadDeliveryAddresses();
      loadPriceAlerts();
    }
  }, [cartItems]);

  // Smart suggestions based on cart items
  const loadSmartSuggestions = useCallback(async () => {
    try {
      const cartCategories = [...new Set(cartItems.map(item => item.category || 'Other'))];
      const cartFarmers = [...new Set(cartItems.map(item => item.farmName || ''))];
      const cartItemIds = cartItems.map(item => item.id);

      // Get frequently bought together items
      let query = supabase
        .from('products')
        .select('*')
        .limit(6);

      // Only filter by category if we have categories
      if (cartCategories.length > 0) {
        query = query.in('category', cartCategories as any);
      }

      const { data: suggestions } = await query;

      // Filter out cart items on the client side
      const filteredSuggestions = suggestions?.filter(product => 
        !cartItemIds.includes(product.id)
      ) || [];

      if (filteredSuggestions.length > 0) {
        const enhancedSuggestions = filteredSuggestions.slice(0, 6).map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit || 'piece',
          image: product.images?.[0] || undefined,
          farmName: 'Local Farm',
          reason: "Frequently bought together",
          confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
          bundleDiscount: Math.random() > 0.5 ? 0.1 : undefined
        }));
        setSmartSuggestions(enhancedSuggestions);
      }
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
    }
  }, [cartItems]);

  // Calculate delivery estimates
  const loadDeliveryEstimates = useCallback(() => {
    const estimates = cartItems.map(item => {
      const baseDelivery = Math.floor(Math.random() * 3) + 1; // 1-3 days
      const availability: 'in_stock' | 'low_stock' | 'pre_order' = item.quantity > 50 ? 'in_stock' : 
                          item.quantity > 10 ? 'low_stock' : 'pre_order';
      
      return {
        itemId: item.id,
        estimatedDays: availability === 'pre_order' ? baseDelivery + 2 : baseDelivery,
        availability,
        fastestOption: availability === 'in_stock' ? 'Same day delivery' : 'Standard delivery',
        carbonFootprint: (item.quantity * 0.5 + Math.random() * 2) // Estimate in kg CO2
      };
    });
    setDeliveryEstimates(estimates);
  }, [cartItems]);

  // Load bundle deals
  const loadBundleDeals = useCallback(() => {
    const deals: BundleDeal[] = [
      {
        id: '1',
        title: '🥗 Fresh Salad Bundle',
        description: 'Complete salad ingredients with 15% off',
        items: cartItems.slice(0, 3).map(item => item.id),
        discount: 0.15,
        savings: cartItems.slice(0, 3).reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.15,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: '🌱 Organic Starter Pack',
        description: 'Best organic products combo with 20% off',
        items: cartItems.filter(item => item.name.toLowerCase().includes('organic')).map(item => item.id),
        discount: 0.20,
        savings: cartItems.filter(item => item.name.toLowerCase().includes('organic')).reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.20,
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ].filter(deal => deal.items.length >= 2);
    
    setBundleDeals(deals);
  }, [cartItems]);

  // Load delivery addresses
  const loadDeliveryAddresses = useCallback(async () => {
    try {
      const stored = localStorage.getItem(`delivery_addresses_${user?.id}`);
      if (stored) {
        const addresses = JSON.parse(stored);
        setDeliveryAddresses(addresses);
        const defaultAddr = addresses.find((addr: DeliveryAddress) => addr.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      } else {
        // Default address
        const defaultAddress: DeliveryAddress = {
          id: '1',
          label: 'Home',
          name: user?.user_metadata?.full_name || 'User',
          address: '123 Main Street',
          city: 'Cape Town',
          postalCode: '8001',
          phone: '+27 123 456 789',
          isDefault: true,
          instructions: 'Please ring the bell'
        };
        setDeliveryAddresses([defaultAddress]);
        setSelectedAddress(defaultAddress.id);
      }
    } catch (error) {
      console.error('Error loading delivery addresses:', error);
    }
  }, [user]);

  // Load price alerts
  const loadPriceAlerts = useCallback(() => {
    const alerts = cartItems.reduce((acc, item) => {
      acc[item.id] = {
        itemId: item.id,
        targetPrice: item.price * 0.9, // 10% discount target
        enabled: true,
        currentPrice: item.price
      };
      return acc;
    }, {} as Record<string, PriceAlert>);
    setPriceAlerts(alerts);
  }, [cartItems]);

  // Calculate total carbon footprint
  const calculateCarbonFootprint = useCallback(() => {
    return deliveryEstimates.reduce((total, estimate) => total + estimate.carbonFootprint, 0);
  }, [deliveryEstimates]);

  // Generate cart share code
  const generateShareCode = useCallback(async () => {
    if (!user) return;

    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const share: CartShare = {
      id: Date.now().toString(),
      shareCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      allowEditing: false,
      sharedWith: []
    };

    // Store in localStorage (in real app, save to database)
    localStorage.setItem(`cart_share_${shareCode}`, JSON.stringify({
      items: cartItems,
      sharedBy: user.id,
      createdAt: new Date().toISOString()
    }));

    setCartShare(share);
    
    toast({
      title: "Cart shared successfully!",
      description: `Share code: ${shareCode}`,
    });
  }, [user, cartItems, toast]);

  // Save for later functionality
  const saveForLater = useCallback((item: any) => {
    setSavedItems((prev: any[]) => {
      const updated = [...prev, item];
      localStorage.setItem('savedItems', JSON.stringify(updated));
      return updated;
    });
    removeItem(item.id);
    toast({
      title: "Item saved for later",
      description: `${item.name} moved to saved items`,
    });
  }, [removeItem, toast]);

  // Move back to cart
  const moveToCart = useCallback((item: any) => {
    addToCart(item);
    setSavedItems((prev: any[]) => {
      const updated = prev.filter((i: any) => i.id !== item.id);
      localStorage.setItem('savedItems', JSON.stringify(updated));
      return updated;
    });
    toast({
      title: "Item moved to cart",
      description: `${item.name} added back to cart`,
    });
  }, [addToCart, toast]);

  // Handle note changes
  const handleNoteChange = useCallback((id: string, value: string) => {
    setNotes((prev: any) => {
      const updated = { ...prev, [id]: value };
      localStorage.setItem('cartNotes', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Toggle gift wrapping
  const toggleGiftWrapping = useCallback((itemId: string) => {
    setGiftOptions(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        itemId,
        isGift: !prev[itemId]?.isGift,
        wrapperType: 'eco_friendly',
        message: prev[itemId]?.message || '',
        recipientName: prev[itemId]?.recipientName || ''
      }
    }));
  }, []);

  // Apply bundle deal
  const applyBundleDeal = useCallback((deal: BundleDeal) => {
    toast({
      title: "Bundle deal applied!",
      description: `You saved R${deal.savings.toFixed(2)} with ${deal.title}`,
    });
  }, [toast]);

  const validCodes = { "FRESH10": 0.1, "FARM5": 0.05 };
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (validCodes[code as keyof typeof validCodes]) {
      setDiscount(validCodes[code as keyof typeof validCodes]);
      setPromoApplied(true);
      toast({
        title: "Promo code applied!",
        description: `You saved ${(validCodes[code as keyof typeof validCodes] * 100)}%`,
      });
    } else {
      setDiscount(0);
      setPromoApplied(false);
      toast({
        title: "Invalid promo code",
        description: "Please check your code and try again",
        variant: "destructive"
      });
    }
  };

  const bottomNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: ShoppingCart, label: "Cart", path: "/cart", active: true },
    { icon: Package, label: "Track", path: "/track-order" },
    { icon: Search, label: "Browse", path: "/browse-products" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Smart Cart</h1>
            <p className="text-sm text-muted-foreground">
              {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} • R{getTotalPrice().toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Your Cart</DialogTitle>
                  <DialogDescription>
                    Share your cart with family or friends for group orders
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Share your cart with family or friends for group orders
                  </p>
                  {cartShare ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Cart Shared!</span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <code className="text-sm font-mono">{cartShare.shareCode}</code>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(cartShare.shareCode);
                              toast({ title: "Code copied!", description: "Share code copied to clipboard" });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Expires in 24 hours
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={generateShareCode} className="w-full">
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate Share Code
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-80">  {/* Increased padding to account for fixed bottom sections */}
        {cartItems.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some fresh products to get started</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-primary to-primary-light">
              Start Shopping
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="sticky top-16 z-40 bg-background border-b">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cart">Cart ({getTotalItems()})</TabsTrigger>
                <TabsTrigger value="suggestions">Smart</TabsTrigger>
                <TabsTrigger value="bundles">Deals</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="cart" className="space-y-4 p-4">
              {/* Delivery Estimate Banner */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Truck className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800">Delivery Estimate</h3>
                      <p className="text-sm text-green-700">
                        {Math.min(...deliveryEstimates.map(e => e.estimatedDays))} - {Math.max(...deliveryEstimates.map(e => e.estimatedDays))} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600">Carbon Footprint</p>
                      <p className="text-sm font-semibold text-green-800">
                        {calculateCarbonFootprint().toFixed(1)} kg CO₂
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const estimate = deliveryEstimates.find(e => e.itemId === item.id);
                  const gift = giftOptions[item.id];
                  
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-primary/40" />
                              )}
                            </div>
                            {gift?.isGift && (
                              <div className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full">
                                <Gift className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-foreground">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.farmName || 'Local Farm'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="font-semibold text-primary">R{item.price.toFixed(2)}/{item.unit}</p>
                                  {estimate && (
                                    <Badge variant={estimate.availability === 'in_stock' ? 'default' : 'secondary'} className="text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {estimate.estimatedDays}d
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Item actions */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-xs"
                                onClick={() => toggleGiftWrapping(item.id)}
                              >
                                <Gift className="h-3 w-3 mr-1" />
                                {gift?.isGift ? 'Remove Gift' : 'Gift Wrap'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-xs"
                                onClick={() => saveForLater(item)}
                              >
                                <Heart className="h-3 w-3 mr-1" />
                                Save Later
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                            
                            {/* Special notes */}
                            <Input
                              type="text"
                              placeholder="Special instructions for farmer..."
                              value={notes[item.id] || ''}
                              onChange={(e) => handleNoteChange(item.id, e.target.value)}
                              className="text-sm"
                            />
                            
                            {/* Gift wrapping options */}
                            {gift?.isGift && (
                              <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                                <h4 className="text-sm font-medium text-red-800">Gift Options</h4>
                                <Input
                                  placeholder="Recipient name"
                                  value={gift.recipientName}
                                  onChange={(e) => setGiftOptions(prev => ({
                                    ...prev,
                                    [item.id]: { ...gift, recipientName: e.target.value }
                                  }))}
                                  className="text-sm"
                                />
                                <Input
                                  placeholder="Gift message"
                                  value={gift.message}
                                  onChange={(e) => setGiftOptions(prev => ({
                                    ...prev,
                                    [item.id]: { ...gift, message: e.target.value }
                                  }))}
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Subtotal: <span className="font-semibold text-foreground">R{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          {estimate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Leaf className="h-3 w-3 text-green-500" />
                              {estimate.carbonFootprint.toFixed(1)} kg CO₂
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Smart Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4 p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Frequently Bought Together</h2>
                <p className="text-sm text-muted-foreground">Complete your order with these popular combinations</p>
              </div>
              
              <div className="grid gap-3">
                {smartSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
                          {suggestion.image ? (
                            <img 
                              src={suggestion.image} 
                              alt={suggestion.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-primary/40" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{suggestion.name}</h3>
                          <p className="text-xs text-muted-foreground">{suggestion.farmName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-semibold text-primary text-sm">R{suggestion.price.toFixed(2)}</p>
                            {suggestion.bundleDiscount && (
                              <Badge variant="secondary" className="text-xs">
                                10% off in bundle
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-blue-600 mt-1">{suggestion.reason}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            addToCart(suggestion);
                            toast({ title: "Added to cart", description: `${suggestion.name} added successfully` });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Bundle Deals Tab */}
            <TabsContent value="bundles" className="space-y-4 p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Bundle Deals</h2>
                <p className="text-sm text-muted-foreground">Save more with these curated bundles</p>
              </div>
              
              <div className="space-y-4">
                {bundleDeals.map((deal) => (
                  <Card key={deal.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-green-800">{deal.title}</h3>
                          <p className="text-sm text-muted-foreground">{deal.description}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Save R{deal.savings.toFixed(2)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Discount: </span>
                          <span className="font-semibold text-green-600">{(deal.discount * 100)}%</span>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => applyBundleDeal(deal)}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Apply Deal
                        </Button>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Valid until {new Date(deal.validUntil).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Saved Items Tab */}
            <TabsContent value="saved" className="space-y-4 p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Saved for Later</h2>
                <p className="text-sm text-muted-foreground">Items you saved for future purchase</p>
              </div>
              
              {savedItems.length === 0 ? (
                <div className="text-center py-8">
                  <Bookmark className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No saved items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedItems.map((item: any) => (
                    <Card key={item.id} className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-primary/40" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{item.name}</h3>
                            <p className="text-xs text-muted-foreground">{item.farmName || 'Local Farm'}</p>
                            <p className="font-semibold text-primary text-sm">R{item.price.toFixed(2)}/{item.unit}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSavedItems((prev: any[]) => prev.filter((i: any) => i.id !== item.id));
                                localStorage.setItem('savedItems', JSON.stringify(savedItems.filter((i: any) => i.id !== item.id)));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => moveToCart(item)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Enhanced Bottom Summary and Checkout */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-card border-t shadow-strong">
          <ScrollArea className="max-h-48">
            <div className="p-4 space-y-4">
              {/* Quick Actions */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <MapPin className="h-4 w-4 mr-1" />
                      Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Delivery Address</DialogTitle>
                      <DialogDescription>
                        Choose your delivery address
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      {deliveryAddresses.map((address) => (
                        <div 
                          key={address.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAddress === address.id ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => setSelectedAddress(address.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{address.label}</span>
                                {address.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{address.name}</p>
                              <p className="text-sm">{address.address}</p>
                              <p className="text-sm">{address.city}, {address.postalCode}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Address
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <Calendar className="h-4 w-4 mr-1" />
                      Recurring
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Set Up Recurring Order</DialogTitle>
                      <DialogDescription>
                        Schedule automatic deliveries for your regular orders
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Get your favorite items delivered automatically
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Weekly delivery</span>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Bi-weekly delivery</span>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Monthly delivery</span>
                          <Switch />
                        </div>
                      </div>
                      <Button className="w-full">
                        <Target className="h-4 w-4 mr-2" />
                        Set Up Recurring Order
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={alertsDialogOpen} onOpenChange={setAlertsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <Bell className="h-4 w-4 mr-1" />
                      Alerts
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Price Drop Alerts</DialogTitle>
                      <DialogDescription>
                        Get notified when prices drop on your cart items
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Get notified when items in your cart go on sale
                      </p>
                      <div className="space-y-3">
                        {cartItems.map((item) => {
                          const alert = priceAlerts[item.id];
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Alert when below R{alert?.targetPrice.toFixed(2)}
                                </p>
                              </div>
                              <Switch 
                                checked={alert?.enabled}
                                onCheckedChange={(checked) => {
                                  setPriceAlerts(prev => ({
                                    ...prev,
                                    [item.id]: { ...alert!, enabled: checked }
                                  }));
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Promo Code */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1"
                  disabled={promoApplied}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={promoApplied}
                >
                  {promoApplied ? "Applied" : "Apply"}
                </Button>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>R{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee:</span>
                  <span>R2.99</span>
                </div>
                {Object.values(giftOptions).some(g => g?.isGift) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gift Wrapping (5%):</span>
                    <span>R{(getTotalPrice() * 0.05).toFixed(2)}</span>
                  </div>
                )}
                {promoApplied && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promo Discount:</span>
                    <span>-R{(getTotalPrice() * discount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>
                    R{(
                      getTotalPrice() + 
                      2.99 + 
                      (Object.values(giftOptions).some(g => g?.isGift) ? getTotalPrice() * 0.05 : 0) - 
                      (promoApplied ? getTotalPrice() * discount : 0)
                    ).toFixed(2)}
                  </span>
                </div>
                
                {/* Carbon Footprint Display */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Recycle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Carbon Impact:</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {calculateCarbonFootprint().toFixed(1)} kg CO₂
                  </span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-primary to-primary-light"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong">
        <div className="flex items-center justify-around py-2">
          {[
            { icon: Home, label: "Home", path: "/dashboard" },
            { icon: ShoppingCart, label: "Cart", path: "/cart", active: true },
            { icon: Package, label: "Track", path: "/track-order" },
            { icon: Search, label: "Browse", path: "/browse-products" },
            { icon: MessageCircle, label: "Messages", path: "/messages" },
          ].map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center px-3 py-2 h-auto ${item.active ? 'text-primary' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Cart;

