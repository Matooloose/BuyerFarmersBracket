import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useDebounce } from "@/hooks/useDebounce";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { supabase } from "../integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  Home,
  ShoppingCart,
  Package,
  MessageCircle,
  Search,
  User,
  Moon,
  Sun,
  LogOut,
  Leaf,
  Bell,
  MapPin,
  Plus,
  Info,
  Headphones,
  CreditCard,
  Grid3X3,
  List,
  Eye,
  Loader2,
  Filter,
  Heart,
  BarChart3
} from "lucide-react";
import { NotificationIcon } from "@/components/NotificationIcon";
import AvailableFarms from "@/components/AvailableFarms";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProductCardSkeleton, ProductListSkeleton, QuickActionSkeleton } from "@/components/SkeletonLoaders";
import ProductQuickView from "@/components/ProductQuickView";
import AdvancedFilters, { FilterOptions } from "@/components/AdvancedFilters";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";

interface Product {
id: string;
name: string;
description: string | null;
price: number;
unit: string;
category: string;
images: string[];
is_organic: boolean;
is_featured: boolean;
farmer_id: string;
quantity: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  itemCount: number;
}

const Dashboard: React.FC = () => {
// Navigation & Auth
const navigate = useNavigate();
const { signOut, user } = useAuth();
const { toast } = useToast();
const { addToCart, cartItems, getTotalItems } = useCart();
const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

// UI State
const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
const [isGridView, setIsGridView] = useState(true);

// Data State
const [products, setProducts] = useState<Product[]>([]);
const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
const [addingToCart, setAddingToCart] = useState<string | null>(null);
const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
const [farmNames, setFarmNames] = useState<Record<string, string>>({});

// Filter State
const [filters, setFilters] = useState<FilterOptions>({
  categories: [],
  isOrganic: null,
  isFeatured: null,
  priceRange: [0, 1000],
  availability: 'all'
});
const [filtersOpen, setFiltersOpen] = useState(false);

// Settings State
const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') !== 'false');

// Debounced search term
const debouncedSearchTerm = useDebounce(searchTerm, 300);

// Fetch products with retry logic and infinite scroll
const fetchProducts = async () => {
  try {
    setLoading(true);
    
    let query = supabase
      .from('products')
      .select('id, name, description, price, unit, category, images, is_organic, is_featured, farmer_id, quantity')
      .gt('quantity', 0);

    // Apply search filter
    if (debouncedSearchTerm) {
      query = query.or(`name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`);
    }

    // Apply filters
    if (filters.categories.length > 0) {
      query = query.in('category', filters.categories as ('vegetables' | 'fruits' | 'dairy' | 'meat' | 'grains' | 'herbs' | 'other')[]);
    }
    if (filters.isOrganic !== null) {
      query = query.eq('is_organic', filters.isOrganic);
    }
    if (filters.isFeatured !== null) {
      query = query.eq('is_featured', filters.isFeatured);
    }
    query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
    
    if (filters.availability === 'inStock') {
      query = query.gt('quantity', 10);
    } else if (filters.availability === 'lowStock') {
      query = query.gte('quantity', 1).lte('quantity', 10);
    }

    const { data: productsData, error: productsError } = await query
      .order('created_at', { ascending: false })
      .limit(50); // Get more products for manual scrolling

    if (productsError) throw productsError;

    const newProducts = productsData || [];
    setProducts(newProducts);
    
    // Fetch farm names for new products
    const farmerIds = newProducts.map(p => p.farmer_id).filter(Boolean);
    if (farmerIds.length > 0) {
      const { data: farms } = await supabase
        .from('farms')
        .select('farmer_id, name')
        .in('farmer_id', farmerIds);
      
      if (farms) {
        const farmNameMap: Record<string, string> = {};
        farms.forEach(farm => {
          farmNameMap[farm.farmer_id] = farm.name;
        });
        setFarmNames(farmNameMap);
      }
    }
    
  } catch (error) {
    console.error('Error loading products:', error);
    toast({
      title: "Error loading products",
      description: "Please try again later",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

// Fetch recent orders
const fetchRecentOrders = async () => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.warn('Error fetching recent orders:', error);
      return;
    }

    const transformedOrders: RecentOrder[] = (data || []).map(order => ({
      id: order.id,
      orderNumber: `ORD${order.id.slice(-6).toUpperCase()}`,
      status: order.status as RecentOrder['status'],
      total: order.total,
      createdAt: order.created_at,
      itemCount: 1 // Placeholder until we have order_items
    }));

    setRecentOrders(transformedOrders);
  } catch (error) {
    console.warn('Error fetching recent orders:', error);
  }
};

useEffect(() => {
  const fetchData = async (retryCount = 0) => {
    setLoading(true);
    try {
      await fetchProducts();
      await fetchRecentOrders();
    } catch (error) {
      // Retry logic - attempt up to 2 retries
      if (retryCount < 2) {
        setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      toast({
        title: "Error loading data",
        description: "Failed to load products after multiple attempts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [toast, filters]);

// Pull to refresh
const handleRefresh = async () => {
  try {
    await fetchProducts();
    await fetchRecentOrders();
    toast({
      title: "Refreshed",
      description: "Data updated successfully",
    });
  } catch (error) {
    toast({
      title: "Refresh failed",
      description: "Could not refresh products",
      variant: "destructive",
    });
  }
};

const pullToRefresh = usePullToRefresh({
  onRefresh: handleRefresh,
  threshold: 80
});

// Fetch products when search term or filters change
useEffect(() => {
  const timer = setTimeout(() => {
    fetchProducts();
  }, 300);
  
  return () => clearTimeout(timer);
}, [debouncedSearchTerm, filters]);

// Theme sync
useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}, [darkMode]);

// Handlers
const handleNavigation = (path: string) => {
  navigate(path);
  setIsDrawerOpen(false);
};

const handleLogout = async () => {
  await signOut();
  setLogoutDialogOpen(false);
  navigate('/login');
};

const handleNotificationsChange = (value: boolean) => {
  setNotifications(value);
  localStorage.setItem('notifications', value ? 'true' : 'false');
};

const handleDarkModeChange = (value: boolean) => setDarkMode(value);

const addProductToCart = async (productId: string, quantity: number = 1) => {
  const product = products.find(p => p.id === productId);
  if (!product || addingToCart === productId) return;
  
  setAddingToCart(productId);
  
  try {
    const farmName = farmNames[product.farmer_id] || 'Local Farm';
    
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.images[0] || '',
        farmName,
        category: product.category
      });
    }
    
    toast({
      title: "Added to Cart",
      description: `${quantity} x ${product.name} added to your cart`,
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    toast({
      title: "Error",
      description: "Failed to add item to cart",
      variant: "destructive",
    });
  } finally {
    setAddingToCart(null);
  }
};

const handleWishlistToggle = (productId: string) => {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (isInWishlist(productId)) {
    removeFromWishlist(productId);
    toast({
      title: "Removed from Wishlist",
      description: `${product.name} removed from wishlist`,
    });
  } else {
    const farmName = farmNames[product.farmer_id] || 'Local Farm';
    addToWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      image: product.images[0] || '',
      farmName,
      category: product.category
    });
    toast({
      title: "Added to Wishlist",
      description: `${product.name} added to wishlist`,
    });
  }
};

const handleQuickView = (product: Product) => {
  setQuickViewProduct(product);
};

// Get unique categories and price range for filters
const availableCategories = Array.from(new Set(products.map(p => p.category)));
const priceRange: [number, number] = products.length > 0 
  ? [Math.min(...products.map(p => p.price)), Math.max(...products.map(p => p.price))]
  : [0, 1000];

// Enhanced filtering with memoization
const filteredProducts = useMemo(() => {
  return products.filter(product => {
    // Search filter
    const matchesSearch = debouncedSearchTerm === '' || 
      product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

    return matchesSearch;
  });
}, [products, debouncedSearchTerm]);

// Count active filters
const activeFiltersCount = useMemo(() => {
  let count = 0;
  if (filters.categories.length > 0) count += filters.categories.length;
  if (filters.isOrganic !== null) count++;
  if (filters.isFeatured !== null) count++;
  if (filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]) count++;
  if (filters.availability !== 'all') count++;
  return count;
}, [filters, priceRange]);

// Bottom nav config
const bottomNavItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: ShoppingCart, label: "Cart", path: "/cart" },
  { icon: Package, label: "Track", path: "/track-order" },
  { icon: Search, label: "Browse", path: "/browse-products" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
];

return (
  <ErrorBoundary>
    <div className="min-h-screen bg-background">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        isVisible={pullToRefresh.shouldShowIndicator}
        isRefreshing={pullToRefresh.isRefreshing}
        pullDistance={pullToRefresh.pullDistance}
        shouldTrigger={pullToRefresh.shouldTrigger}
        transformY={Math.min(pullToRefresh.pullDistance * 0.5, 50)}
        opacity={Math.min(pullToRefresh.pullDistance / 80, 1)}
      />
      
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft" role="banner">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  aria-label="Open navigation menu"
                  aria-expanded={isDrawerOpen}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <SheetTitle className="text-lg">FarmersBracket</SheetTitle>
                    <p className="text-sm text-muted-foreground">shopleft</p>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-8 space-y-6">
                {/* Profile */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Profile</h3>
                  <Button variant="ghost" className="w-full justify-start"
                    onClick={() => handleNavigation('/profile')}>
                    <User className="h-4 w-4 mr-3" />
                    Update Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start"
                    onClick={() => handleNavigation('/wishlist')}>
                    <Heart className="h-4 w-4 mr-3" />
                    My Wishlist
                  </Button>
                  <Button variant="ghost" className="w-full justify-start"
                    onClick={() => handleNavigation('/order-history')}>
                    <Package className="h-4 w-4 mr-3" />
                    Order History
                  </Button>
                </div>
                <Separator />
                {/* Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Information</h3>
                  <Button variant="ghost" className="w-full justify-start"
                    onClick={() => handleNavigation('/how-it-works')}>
                    <Info className="h-4 w-4 mr-3" />
                    How It Works
                  </Button>
                </div>
                <Separator />
                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Settings</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                    </div>
                    <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleDarkModeChange} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-4 w-4" />
                      <Label htmlFor="notifications">Notifications</Label>
                    </div>
                    <Switch id="notifications" checked={notifications} onCheckedChange={handleNotificationsChange} />
                  </div>
                </div>
                <Separator />
                {/* Logout */}
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => setLogoutDialogOpen(true)}>
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </Button>
                <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure you want to logout?</DialogTitle>
                      <DialogDescription>
                        This will sign you out of your account and return you to the login page.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>No</Button>
                      <Button variant="destructive" onClick={handleLogout}>Yes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </SheetContent>
          </Sheet>
          <div>
            <h1 className="text-lg font-semibold text-foreground">FarmersBracket</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Your Location</span>
            </div>
          </div>
        </div>
        <NotificationIcon />
      </div>
      {/* Search Bar */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, farms..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search products and farms"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4">
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={[
            'vegetables', 'fruits', 'dairy', 'meat', 'grains', 'herbs', 'other'
          ]}
          priceRange={[0, 1000]}
          activeFiltersCount={activeFiltersCount}
        />
      </div>
    </header>
    {/* Main Content */}
    <main className="p-4 pb-20 space-y-6 safe-area-bottom" role="main">
      {loading ? (
        <div className="space-y-6">
          {/* Welcome Card Skeleton */}
          <Card className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
            <CardHeader>
              <div className="h-6 bg-primary-foreground/20 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-primary-foreground/20 rounded animate-pulse w-1/2" />
            </CardHeader>
          </Card>
          
          {/* Products Section Skeleton */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-muted rounded animate-pulse w-32" />
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <div className="h-8 w-8 bg-muted-foreground/20 rounded animate-pulse" />
                <div className="h-8 w-8 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </section>
          
          {/* Quick Actions Skeleton */}
          <section className="space-y-4">
            <div className="h-6 bg-muted rounded animate-pulse w-32" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <QuickActionSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
            <CardHeader>
              <CardTitle>Welcome to FarmersBracket!</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Discover fresh produce from local farms
              </CardDescription>
            </CardHeader>
          </Card>
          
          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/order-history')}
                  className="text-primary hover:text-primary/80"
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Card key={order.id} className="cursor-pointer hover:shadow-medium transition-shadow"
                    onClick={() => navigate('/order-history')}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground">{order.orderNumber}</h3>
                            <Badge 
                              variant={
                                order.status === 'delivered' ? 'default' :
                                order.status === 'shipped' ? 'secondary' :
                                order.status === 'processing' ? 'outline' :
                                order.status === 'cancelled' ? 'destructive' : 'outline'
                              }
                              className="text-xs"
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()} • {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">R{order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Fresh Products */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Fresh Products</h2>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={isGridView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsGridView(true)}
                  className="h-8 w-8 p-0"
                  aria-label="Switch to grid view"
                  aria-pressed={isGridView}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={!isGridView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsGridView(false)}
                  className="h-8 w-8 p-0"
                  aria-label="Switch to list view"
                  aria-pressed={!isGridView}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Grid View */}
            {isGridView ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleQuickView(product)}
                  >
                    <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-between relative">
                      {product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-12 w-12 text-primary/40" />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 hover:bg-background z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(product);
                        }}
                        aria-label={`Quick view ${product.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1">{product.name}</h3>
                          {product.is_organic && (
                            <Badge variant="secondary" className="text-xs">Organic</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-primary">
                              R{product.price}/{product.unit}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.quantity} {product.unit} available
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWishlistToggle(product.id);
                              }}
                              aria-label={`${isInWishlist(product.id) ? 'Remove from' : 'Add to'} wishlist`}
                            >
                              <Heart 
                                className={`h-4 w-4 ${isInWishlist(product.id) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-muted-foreground hover:text-red-500'
                                }`} 
                              />
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                addProductToCart(product.id);
                              }}
                              disabled={addingToCart === product.id}
                              aria-label={`Add ${product.name} to cart`}
                            >
                              {addingToCart === product.id ? (
                                <div 
                                  className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
                                  aria-label="Adding to cart"
                                />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleQuickView(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                          {product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="h-8 w-8 text-primary/40" />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickViewProduct(product);
                            }}
                            aria-label={`Quick view ${product.name}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <p className="font-semibold text-primary">
                                  R{product.price}/{product.unit}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {product.quantity} {product.unit} available
                                </p>
                                {product.is_organic && (
                                  <Badge variant="secondary" className="text-xs">Organic</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWishlistToggle(product.id);
                                }}
                                aria-label={`${isInWishlist(product.id) ? 'Remove from' : 'Add to'} wishlist`}
                              >
                                <Heart 
                                  className={`h-4 w-4 ${isInWishlist(product.id) 
                                    ? 'fill-red-500 text-red-500' 
                                    : 'text-muted-foreground hover:text-red-500'
                                  }`} 
                                />
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addProductToCart(product.id);
                                }}
                                disabled={addingToCart === product.id}
                                aria-label={`Add ${product.name} to cart`}
                              >
                                {addingToCart === product.id ? (
                                  <div 
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
                                    aria-label="Adding to cart"
                                  />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </section>
          {/* Available Farms Component */}
          <AvailableFarms />
          {/* Additional Quick Actions */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              <Card className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => handleNavigation('/wishlist')}>
                <CardContent className="p-3 text-center">
                  <Heart className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-xs">My Wishlist</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => handleNavigation('/order-history')}>
                <CardContent className="p-3 text-center">
                  <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-xs">Order History</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => handleNavigation('/reports')}>
                <CardContent className="p-3 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-xs">Reports</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => handleNavigation('/faq')}>
                <CardContent className="p-3 text-center">
                  <Info className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-xs">FAQ</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => handleNavigation('/subscriptions')}>
                <CardContent className="p-3 text-center">
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-xs">Subscriptions</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => handleNavigation('/contact-support')}>
                <CardContent className="p-3 text-center">
                  <Headphones className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-xs">Contact Support</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => handleNavigation('/profile')}>
                <CardContent className="p-3 text-center">
                  <User className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-xs">My Profile</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}
    </main>
    {/* Bottom Navigation */}
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong safe-area-bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="flex items-center justify-around py-2">
        {bottomNavItems.map(item => (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            className="flex flex-col items-center px-3 py-2 h-auto text-primary"
            onClick={() => handleNavigation(item.path)}
            aria-label={`Navigate to ${item.label}`}
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
    
    {/* Product Quick View Dialog */}
    {quickViewProduct && (
      <ProductQuickView
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(productId, quantity) => {
          for (let i = 0; i < (quantity || 1); i++) {
            addToCart({
              id: quickViewProduct.id,
              name: quickViewProduct.name,
              price: quickViewProduct.price,
              unit: quickViewProduct.unit,
              image: quickViewProduct.images[0] || '',
              farmName: farmNames[quickViewProduct.farmer_id] || 'Local Farm',
              category: quickViewProduct.category
            });
          }
        }}
        onAddToWishlist={(productId) => addToWishlist({
          id: quickViewProduct.id,
          name: quickViewProduct.name,
          price: quickViewProduct.price,
          unit: quickViewProduct.unit,
          image: quickViewProduct.images[0] || '',
          farmName: farmNames[quickViewProduct.farmer_id] || 'Local Farm',
          category: quickViewProduct.category
        })}
        isInWishlist={isInWishlist(quickViewProduct.id)}
        isAddingToCart={addingToCart === quickViewProduct.id}
        farmName={farmNames[quickViewProduct.farmer_id]}
      />
    )}
  </div>
  </ErrorBoundary>
);
};

export default Dashboard;