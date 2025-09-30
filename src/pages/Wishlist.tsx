import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  Heart, 
  ShoppingCart, 
  Package, 
  Trash2, 
  Bell, 
  TrendingDown, 
  Star, 
  Move,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Share2,
  DollarSign,
  Calendar,
  Sparkles
} from "lucide-react";

// Enhanced interfaces for wishlist features
interface PriceAlert {
  id: string;
  productId: string;
  userId: string;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: Date;
}

interface StockAlert {
  id: string;
  productId: string;
  userId: string;
  isActive: boolean;
  createdAt: Date;
}

interface WishlistPriority {
  [key: string]: 'high' | 'medium' | 'low';
}

interface EnhancedWishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image?: string;
  farmName: string;
  category: string;
  addedAt: Date;
  priority: 'high' | 'medium' | 'low';
  inStock: boolean;
  priceHistory: Array<{ price: number; date: Date }>;
  hasActiveAlert: boolean;
  targetPrice?: number;
}

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  // Enhanced state management
  const [enhancedItems, setEnhancedItems] = useState<EnhancedWishlistItem[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [priorities, setPriorities] = useState<WishlistPriority>({});
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'priority' | 'name'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'high' | 'medium' | 'low' | 'alerts'>('all');
  const [priceTrackingEnabled, setPriceTrackingEnabled] = useState(true);
  const [stockTrackingEnabled, setStockTrackingEnabled] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EnhancedWishlistItem | null>(null);
  const [targetPrice, setTargetPrice] = useState<number>(0);

  // Load enhanced wishlist data
  useEffect(() => {
    loadEnhancedWishlistData();
    loadPriceAlerts();
    loadStockAlerts();
  }, [wishlistItems, user]);

  const loadEnhancedWishlistData = useCallback(async () => {
    const enhanced = await Promise.all(wishlistItems.map(async (item) => {
      // Get price history (simulated)
      const priceHistory = generatePriceHistory(item.price);
      
      // Check stock status
      const stockStatus = await checkStockStatus(item.id);
      
      // Get priority from localStorage
      const priority = priorities[item.id] || 'medium';
      
      // Check for active alerts
      const hasActiveAlert = priceAlerts.some(alert => 
        alert.productId === item.id && alert.isActive
      ) || stockAlerts.some(alert => 
        alert.productId === item.id && alert.isActive
      );

      return {
        ...item,
        priority,
        inStock: stockStatus,
        priceHistory,
        hasActiveAlert,
        originalPrice: priceHistory.length > 0 ? priceHistory[0].price : item.price
      } as EnhancedWishlistItem;
    }));

    setEnhancedItems(enhanced);
  }, [wishlistItems, priorities, priceAlerts, stockAlerts]);

  const generatePriceHistory = (currentPrice: number): Array<{ price: number; date: Date }> => {
    const history: Array<{ price: number; date: Date }> = [];
    let price = currentPrice;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate price fluctuations
      price = price + (Math.random() - 0.5) * (price * 0.1);
      price = Math.max(price, currentPrice * 0.7); // Don't go below 70% of current
      
      history.push({ price: Math.round(price * 100) / 100, date });
    }
    
    return history;
  };

  const checkStockStatus = async (productId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single();
      
      if (error) return true; // Assume in stock if error
      return data.quantity > 0;
    } catch {
      return true;
    }
  };

  const loadPriceAlerts = useCallback(async () => {
    if (!user) return;
    
    const savedAlerts = localStorage.getItem(`price_alerts_${user.id}`);
    if (savedAlerts) {
      setPriceAlerts(JSON.parse(savedAlerts));
    }
  }, [user]);

  const loadStockAlerts = useCallback(async () => {
    if (!user) return;
    
    const savedAlerts = localStorage.getItem(`stock_alerts_${user.id}`);
    if (savedAlerts) {
      setStockAlerts(JSON.parse(savedAlerts));
    }
  }, [user]);

  const setPriority = (itemId: string, priority: 'high' | 'medium' | 'low') => {
    const newPriorities = { ...priorities, [itemId]: priority };
    setPriorities(newPriorities);
    localStorage.setItem(`wishlist_priorities_${user?.id}`, JSON.stringify(newPriorities));
  };

  const createPriceAlert = (item: EnhancedWishlistItem, targetPrice: number) => {
    if (!user) return;

    const alert: PriceAlert = {
      id: `alert_${Date.now()}`,
      productId: item.id,
      userId: user.id,
      targetPrice,
      currentPrice: item.price,
      isActive: true,
      createdAt: new Date()
    };

    const newAlerts = [...priceAlerts, alert];
    setPriceAlerts(newAlerts);
    localStorage.setItem(`price_alerts_${user.id}`, JSON.stringify(newAlerts));

    toast({
      title: "Price Alert Set",
      description: `You'll be notified when ${item.name} drops to R${targetPrice}`,
    });
  };

  const createStockAlert = (item: EnhancedWishlistItem) => {
    if (!user) return;

    const alert: StockAlert = {
      id: `stock_alert_${Date.now()}`,
      productId: item.id,
      userId: user.id,
      isActive: true,
      createdAt: new Date()
    };

    const newAlerts = [...stockAlerts, alert];
    setStockAlerts(newAlerts);
    localStorage.setItem(`stock_alerts_${user.id}`, JSON.stringify(newAlerts));

    toast({
      title: "Stock Alert Set",
      description: `You'll be notified when ${item.name} is back in stock`,
    });
  };

  const exportWishlist = (format: 'json' | 'csv' | 'pdf') => {
    const data = enhancedItems.map(item => ({
      name: item.name,
      price: item.price,
      farmName: item.farmName,
      category: item.category,
      priority: item.priority,
      addedAt: item.addedAt.toISOString(),
      inStock: item.inStock
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadFile(blob, 'wishlist.json');
    } else if (format === 'csv') {
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadFile(blob, 'wishlist.csv');
    }

    toast({
      title: "Wishlist Exported",
      description: `Your wishlist has been exported as ${format.toUpperCase()}`,
    });
  };

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareWishlist = async () => {
    const shareData = {
      title: 'My Wishlist - FarmersBracket',
      text: `Check out my wishlist of ${enhancedItems.length} amazing products from local farms!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback to copying link
        copyToClipboard(window.location.href);
      }
    } else {
      copyToClipboard(window.location.href);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link Copied",
      description: "Wishlist link copied to clipboard",
    });
  };

  const getFilteredAndSortedItems = () => {
    let filtered = enhancedItems;

    // Apply filters
    if (filterBy !== 'all') {
      if (filterBy === 'alerts') {
        filtered = filtered.filter(item => item.hasActiveAlert);
      } else {
        filtered = filtered.filter(item => item.priority === filterBy);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'priority': {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculatePriceDrop = (item: EnhancedWishlistItem) => {
    if (!item.originalPrice || item.originalPrice <= item.price) return 0;
    return ((item.originalPrice - item.price) / item.originalPrice * 100);
  };

  const handleAddToCart = (item: EnhancedWishlistItem) => {
    addToCart(item);
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const handleRemoveFromWishlist = (itemId: string, itemName: string) => {
    removeFromWishlist(itemId);
    toast({
      title: "Removed from Wishlist",
      description: `${itemName} has been removed from your wishlist`,
    });
  };

  const handleClearWishlist = () => {
    clearWishlist();
    toast({
      title: "Wishlist Cleared",
      description: "All items have been removed from your wishlist",
    });
  };

  const filteredItems = getFilteredAndSortedItems();

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
              <h1 className="text-lg font-semibold text-foreground">My Wishlist</h1>
              <p className="text-sm text-muted-foreground">
                {enhancedItems.length} {enhancedItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Wishlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Share your wishlist with friends and family
                  </p>
                  <Button onClick={shareWishlist} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Wishlist
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Wishlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Export your wishlist in different formats
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => exportWishlist('json')} variant="outline">
                      JSON
                    </Button>
                    <Button onClick={() => exportWishlist('csv')} variant="outline">
                      CSV
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {enhancedItems.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearWishlist}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Controls */}
        {enhancedItems.length > 0 && (
          <div className="px-4 pb-3 space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{enhancedItems.filter(i => i.priority === 'high').length}</div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
              <div className="bg-yellow-100 rounded-lg p-2">
                <div className="text-lg font-bold text-yellow-700">{priceAlerts.filter(a => a.isActive).length}</div>
                <div className="text-xs text-muted-foreground">Price Alerts</div>
              </div>
              <div className="bg-green-100 rounded-lg p-2">
                <div className="text-lg font-bold text-green-700">{enhancedItems.filter(i => i.inStock).length}</div>
                <div className="text-xs text-muted-foreground">In Stock</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-2">
                <div className="text-lg font-bold text-blue-700">
                  {Math.round(enhancedItems.reduce((sum, item) => sum + calculatePriceDrop(item), 0) / enhancedItems.length)}%
                </div>
                <div className="text-xs text-muted-foreground">Avg. Savings</div>
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Added</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="alerts">With Alerts</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAlertDialogOpen(true)}
              >
                <Bell className="h-4 w-4 mr-1" />
                Alerts
              </Button>
            </div>

            {/* Alert Settings */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={priceTrackingEnabled} 
                    onCheckedChange={setPriceTrackingEnabled}
                    id="price-tracking"
                  />
                  <Label htmlFor="price-tracking" className="text-sm">Price Tracking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={stockTrackingEnabled} 
                    onCheckedChange={setStockTrackingEnabled}
                    id="stock-tracking"
                  />
                  <Label htmlFor="stock-tracking" className="text-sm">Stock Alerts</Label>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={loadEnhancedWishlistData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {enhancedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start adding items to your wishlist by clicking the heart icon on products you love.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enhanced Wishlist Items */}
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Image with Status */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover rounded-lg" 
                          />
                        ) : (
                          <Package className="h-8 w-8 text-primary/40" />
                        )}
                      </div>
                      
                      {/* Stock Status Indicator */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                        item.inStock ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      
                      {/* Price Drop Indicator */}
                      {calculatePriceDrop(item) > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-green-600 text-white text-xs px-1 rounded">
                          -{Math.round(calculatePriceDrop(item))}%
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.farmName}</p>
                          
                          {/* Price Information */}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-primary">
                                R{item.price.toFixed(2)}/{item.unit}
                              </p>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <p className="text-sm text-muted-foreground line-through">
                                  R{item.originalPrice.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Tags and Status */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {item.category}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs border ${getPriorityColor(item.priority)}`}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {item.priority}
                            </Badge>
                            {item.hasActiveAlert && (
                              <Badge variant="outline" className="text-xs border-yellow-200 bg-yellow-50 text-yellow-700">
                                <Bell className="h-3 w-3 mr-1" />
                                Alert Active
                              </Badge>
                            )}
                            {!item.inStock && (
                              <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-700">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Priority Selector */}
                        <Select
                          value={item.priority}
                          onValueChange={(value: any) => setPriority(item.id, value)}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <Move className="h-3 w-3" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => handleAddToCart(item)}
                          className="gap-2"
                          disabled={!item.inStock}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setTargetPrice(item.price * 0.9);
                              }}
                            >
                              <TrendingDown className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Set Price Alert</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Target Price (R)</Label>
                                <Input
                                  type="number"
                                  value={targetPrice}
                                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                                  min={0}
                                  max={item.price}
                                  step={0.01}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                  Current price: R{item.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => {
                                    if (selectedItem) {
                                      createPriceAlert(selectedItem, targetPrice);
                                    }
                                  }}
                                  className="flex-1"
                                >
                                  Set Alert
                                </Button>
                                {!item.inStock && (
                                  <Button 
                                    onClick={() => createStockAlert(item)}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    Stock Alert
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRemoveFromWishlist(item.id, item.name)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add All to Cart Button */}
            {filteredItems.length > 1 && (
              <Card>
                <CardContent className="p-4">
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={() => {
                      const inStockItems = filteredItems.filter(item => item.inStock);
                      inStockItems.forEach(item => addToCart(item));
                      toast({
                        title: "Added to Cart",
                        description: `${inStockItems.length} items have been added to your cart`,
                      });
                    }}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add All In-Stock Items to Cart ({filteredItems.filter(i => i.inStock).length} items)
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Alert Management Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Alerts</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="price" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="price">Price Alerts</TabsTrigger>
              <TabsTrigger value="stock">Stock Alerts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="price" className="space-y-4 mt-4">
              {priceAlerts.filter(alert => alert.isActive).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active price alerts
                </p>
              ) : (
                <div className="space-y-3">
                  {priceAlerts.filter(alert => alert.isActive).map(alert => {
                    const item = enhancedItems.find(i => i.id === alert.productId);
                    return (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{item?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Alert when ≤ R{alert.targetPrice} (currently R{alert.currentPrice})
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updatedAlerts = priceAlerts.map(a => 
                              a.id === alert.id ? { ...a, isActive: false } : a
                            );
                            setPriceAlerts(updatedAlerts);
                            localStorage.setItem(`price_alerts_${user?.id}`, JSON.stringify(updatedAlerts));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stock" className="space-y-4 mt-4">
              {stockAlerts.filter(alert => alert.isActive).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active stock alerts
                </p>
              ) : (
                <div className="space-y-3">
                  {stockAlerts.filter(alert => alert.isActive).map(alert => {
                    const item = enhancedItems.find(i => i.id === alert.productId);
                    return (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{item?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Alert when back in stock
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updatedAlerts = stockAlerts.map(a => 
                              a.id === alert.id ? { ...a, isActive: false } : a
                            );
                            setStockAlerts(updatedAlerts);
                            localStorage.setItem(`stock_alerts_${user?.id}`, JSON.stringify(updatedAlerts));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wishlist;