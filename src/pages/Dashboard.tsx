import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  Star,
  TrendingUp,
  Sparkles,
  Clock,
  ArrowRight,
  Zap,
  X,
  Calendar,
  Target,
  Award,
  ThumbsUp,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import { NotificationIcon } from "@/components/NotificationIcon";
import AvailableFarms from "@/components/AvailableFarms";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProductCardSkeleton, ProductListSkeleton, QuickActionSkeleton } from "@/components/SkeletonLoaders";
import ProductQuickView from "@/components/ProductQuickView";
import AdvancedFilters, { FilterOptions } from "@/components/AdvancedFilters";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { ProductRating } from "@/components/ProductRating";

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
rating?: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  itemCount: number;
}

interface Farm {
  farmer_id: string;
  name: string;
  description: string | null;
  location: string | null;
  specialties: string[];
  rating: number;
  total_orders: number;
  distance?: number;
  reason?: string;
}

interface RecommendedProduct extends Product {
  reason: string;
  confidence: number;
}

interface UserActivity {
  recently_viewed: Product[];
  purchase_history: Product[];
  wishlist_items: Product[];
  preferred_categories: string[];
  location: { latitude: number; longitude: number } | null;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  primary?: boolean;
  disabled?: boolean;
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
const [showFAB, setShowFAB] = useState(false);
const [fabExpanded, setFabExpanded] = useState(false);

// Data State
const [products, setProducts] = useState<Product[]>([]);
const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
const [personalizedFarms, setPersonalizedFarms] = useState<Farm[]>([]);
const [userActivity, setUserActivity] = useState<UserActivity>({
  recently_viewed: [],
  purchase_history: [],
  wishlist_items: [],
  preferred_categories: [],
  location: null
});
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

// Refs
const scrollRef = useRef<HTMLDivElement>(null);

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
      .select(`
        id, status, total, created_at,
        order_items (
          id,
          quantity
        )
      `)
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
      itemCount: order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
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
      if (user) {
        await loadUserActivity();
        fetchRecentlyViewed();
        await fetchPersonalizedFarms();
      }
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
}, [toast, filters, user]);

// Pull to refresh
const handleRefresh = async () => {
  try {
    await fetchProducts();
    await fetchRecentOrders();
    await fetchRecommendations();
    await fetchRecentlyViewed();
    await fetchPersonalizedFarms();
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

// Scroll detection for FAB
useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setShowFAB(scrollTop > 200);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Load user activity on mount
useEffect(() => {
  loadUserActivity();
}, [user]);

// Smart recommendation system
const generateRecommendations = useCallback(async (activity: UserActivity): Promise<RecommendedProduct[]> => {
  if (!activity.purchase_history?.length && !activity.recently_viewed?.length) {
    // New user - show popular products
    const popularProducts = products
      .filter(p => p.rating && p.rating >= 4.0)
      .slice(0, 6)
      .map(p => ({
        ...p,
        reason: "Popular choice",
        confidence: 0.8
      }));
    return popularProducts;
  }

  const recommendations: RecommendedProduct[] = [];
  const seenIds = new Set<string>();

  // Recommendation based on purchase history
  if (activity.purchase_history?.length) {
    const purchasedCategories = [...new Set(activity.purchase_history.map(p => p.category))];
    
    for (const category of purchasedCategories) {
      const categoryProducts = products
        .filter(p => p.category === category && !seenIds.has(p.id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 2);

      categoryProducts.forEach(p => {
        recommendations.push({
          ...p,
          reason: `More ${category.toLowerCase()} products`,
          confidence: 0.9
        });
        seenIds.add(p.id);
      });
    }
  }

  // Recommendation based on recently viewed
  if (activity.recently_viewed?.length) {
    const viewedCategories = [...new Set(activity.recently_viewed.map(p => p.category))];
    
    for (const category of viewedCategories) {
      const similarProducts = products
        .filter(p => p.category === category && !seenIds.has(p.id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 1);

      similarProducts.forEach(p => {
        recommendations.push({
          ...p,
          reason: "Similar to recently viewed",
          confidence: 0.7
        });
        seenIds.add(p.id);
      });
    }
  }

  // Location-based recommendations
  if (activity.location) {
    const nearbyProducts = products
      .filter(p => !seenIds.has(p.id))
      .slice(0, 2);

    nearbyProducts.forEach(p => {
      recommendations.push({
        ...p,
        reason: "Popular in your area",
        confidence: 0.6
      });
      seenIds.add(p.id);
    });
  }

  // Fill remaining slots with trending products
  const trending = products
    .filter(p => !seenIds.has(p.id) && p.rating && p.rating >= 4.0)
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(0, 8 - recommendations.length));

  trending.forEach(p => {
    recommendations.push({
      ...p,
      reason: "Trending now",
      confidence: 0.5
    });
  });

  return recommendations.slice(0, 8);
}, [products]);

// Load user activity from various sources
const loadUserActivity = useCallback(async () => {
  if (!user) return;

  try {
    const activity: UserActivity = {
      recently_viewed: JSON.parse(localStorage.getItem(`recently_viewed_${user.id}`) || '[]'),
      purchase_history: [],
      wishlist_items: [],
      preferred_categories: [],
      location: null
    };

    // Get purchase history from orders
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price,
          products (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (orders) {
      activity.purchase_history = orders.flatMap(order => 
        order.order_items?.map((item: any) => item.products) || []
      ).filter(Boolean);
    }

    // Get wishlist items - using a different approach since wishlist table doesn't exist
    // For now, we'll get this from local storage or context
    const wishlistFromContext = []; // This would come from WishlistContext
    activity.wishlist_items = wishlistFromContext;

    // Calculate preferred categories
    const allProducts = [...activity.purchase_history, ...activity.wishlist_items];
    const categoryCount = allProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    activity.preferred_categories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Get user location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          activity.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserActivity(prev => ({ ...prev, location: activity.location }));
        },
        () => {} // Ignore location errors
      );
    }

    setUserActivity(activity);
    
    // Generate recommendations based on activity
    const recommendations = await generateRecommendations(activity);
    setRecommendedProducts(recommendations);

  } catch (error) {
    console.error('Error loading user activity:', error);
  }
}, [user, generateRecommendations]);

// Track product view
const trackProductView = useCallback((product: Product) => {
  if (!user) return;

  const storageKey = `recently_viewed_${user.id}`;
  const recentlyViewed = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  // Remove if already exists and add to front
  const filtered = recentlyViewed.filter((p: Product) => p.id !== product.id);
  const updated = [product, ...filtered].slice(0, 10); // Keep last 10
  
  localStorage.setItem(storageKey, JSON.stringify(updated));
  setUserActivity(prev => ({ ...prev, recently_viewed: updated }));
}, [user]);

// Fetch functions
const fetchRecommendations = useCallback(async () => {
  const recommendations = await generateRecommendations(userActivity);
  setRecommendedProducts(recommendations);
}, [userActivity, generateRecommendations]);

const fetchRecentlyViewed = useCallback(() => {
  if (!user) return;
  
  const storageKey = `recently_viewed_${user.id}`;
  const recentlyViewed = JSON.parse(localStorage.getItem(storageKey) || '[]');
  setRecentlyViewedProducts(recentlyViewed.slice(0, 6));
}, [user]);

const fetchPersonalizedFarms = useCallback(async () => {
  if (!user) return;

  try {
    let query = supabase
      .from('farms')
      .select('*')
      .limit(4);

    // If user has location, prioritize nearby farms
    if (userActivity.location) {
      // In a real app, you'd use PostGIS for distance calculations
      // For now, we'll just get random farms
      query = query.order('created_at', { ascending: false });
    } else {
      // Show farms by creation date for now (until rating column is added)
      query = query.order('created_at', { ascending: false });
    }

    const { data: farms } = await query;
    
    if (farms) {
      setPersonalizedFarms(farms.map(farm => ({
        farmer_id: farm.farmer_id,
        name: farm.name,
        description: farm.description,
        location: farm.location,
        specialties: [], // Default empty array
        rating: 0, // Default rating
        total_orders: 0, // Default orders
        reason: userActivity.location ? "Near your location" : "Highly rated"
      })));
    }
  } catch (error) {
    console.error('Error fetching personalized farms:', error);
  }
}, [user, userActivity.location]);

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
  navigate(`/product/${product.id}`);
};

// Helper function to convert Product to WishlistItem
const productToWishlistItem = (product: Product): Omit<any, "addedAt"> => ({
  id: product.id,
  name: product.name,
  price: product.price,
  unit: product.unit,
  image: product.images?.[0] || "/placeholder.svg",
  farmName: farmNames[product.farmer_id] || "Local Farm",
  category: product.category
});

// Add to cart handler
const handleAddToCart = async (product: Product | RecommendedProduct) => {
  setAddingToCart(product.id);
  try {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      image: product.images?.[0] || "/placeholder.svg",
      farmName: farmNames[product.farmer_id] || "Local Farm",
      category: product.category
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to add item to cart",
      variant: "destructive",
    });
  } finally {
    setAddingToCart(null);
  }
};

// Get unique categories and price range for filters
const availableCategories = Array.from(new Set(products.map(p => p.category)));
const priceRange: [number, number] = products.length > 0 
  ? [Math.min(...products.map(p => p.price)), Math.max(...products.map(p => p.price))]
  : [0, 1000];

// Quick Actions for FAB
const quickActions: QuickAction[] = [
  {
    id: 'search',
    label: 'Search Products',
    icon: <Search className="h-4 w-4" />,
    action: () => {
      const searchInput = document.querySelector('input[placeholder="Search products..."]') as HTMLInputElement;
      searchInput?.focus();
    },
    primary: true
  },
  {
    id: 'cart',
    label: 'View Cart',
    icon: <ShoppingCart className="h-4 w-4" />,
    action: () => navigate('/cart')
  },
  {
    id: 'orders',
    label: 'Order History',
    icon: <Calendar className="h-4 w-4" />,
    action: () => navigate('/order-history')
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: <Heart className="h-4 w-4" />,
    action: () => navigate('/wishlist')
  },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: <RefreshCw className="h-4 w-4" />,
    action: handleRefresh
  }
];

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

// Location display state
const [locationLabel, setLocationLabel] = useState<string>("Fetching location...");

useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserActivity(prev => ({ ...prev, location: { latitude, longitude } }));
        // Try to get city/region using a free reverse geocoding API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.address) {
            setLocationLabel(
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.state ||
              `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`
            );
          } else {
            setLocationLabel(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
          }
        } catch {
          setLocationLabel(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        }
      },
      () => setLocationLabel("Location unavailable")
    );
  } else {
    setLocationLabel("Location unavailable");
  }
}, []);

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
                <ScrollArea className="h-[calc(100vh-4rem)] pr-2">
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
                </ScrollArea>
              </SheetContent>
            </Sheet>
          <div>
            <h1 className="text-lg font-semibold text-foreground">FarmersBracket</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{locationLabel}</span>
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

          {/* Smart Recommendations Section */}
          {recommendedProducts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Just for You</h2>
              </div>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                  {recommendedProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className="w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-square relative mb-3 overflow-hidden rounded-lg">
                          <img
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Button
                              size="sm"
                              variant={isInWishlist(product.id) ? "default" : "secondary"}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isInWishlist(product.id)) {
                                  removeFromWishlist(product.id);
                                } else {
                                  addToWishlist(productToWishlistItem(product));
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-muted-foreground">{product.reason}</span>
                          </div>
                          <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">R{product.price.toFixed(2)}</span>
                            <span className="text-sm text-muted-foreground">per {product.unit}</span>
                          </div>
                          <Progress value={product.confidence * 100} className="h-1" />
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                              trackProductView(product);
                            }}
                            disabled={addingToCart === product.id}
                          >
                            {addingToCart === product.id ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Adding...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <ShoppingCart className="h-4 w-4" />
                                <span>Add to Cart</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          {/* Recently Viewed Section */}
          {recentlyViewedProducts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">Recently Viewed</h2>
              </div>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                  {recentlyViewedProducts.map((product) => (
                    <Card 
                      key={`recent-${product.id}`} 
                      className="w-[200px] cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square relative mb-2 overflow-hidden rounded-lg">
                          <img
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-medium line-clamp-1 text-sm">{product.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-primary">R{product.price.toFixed(2)}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          {/* Personalized Farms Section */}
          {personalizedFarms.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-foreground">Recommended Farms</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {personalizedFarms.map((farm) => (
                  <Card 
                    key={farm.farmer_id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/farmer/${farm.farmer_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Leaf className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-1">{farm.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{farm.description || "Fresh local produce"}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{farm.location || "Local area"}</span>
                            </div>
                            <span className="text-xs text-primary font-medium">{farm.reason}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
          
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
                        {/* Product Rating */}
                        <div className="mt-2">
                          <ProductRating productId={product.id} compact={true} showReviews={false} />
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
                              {/* Product Rating for List View */}
                              <div className="mt-2">
                                <ProductRating productId={product.id} compact={true} showReviews={false} />
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
          {bottomNavItems.map(item => {
            const isActive = window.location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`flex flex-col items-center px-3 py-2 h-auto ${isActive ? 'text-primary font-bold bg-green-500/30' : 'text-muted-foreground'}`}
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
            );
          })}
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

    {/* Floating Action Button */}
    {showFAB && (
      <div className="fixed bottom-20 right-4 z-50">
        <div className="relative">
          {/* FAB Menu */}
          {fabExpanded && (
            <div className="absolute bottom-16 right-0 flex flex-col-reverse space-y-reverse space-y-3 mb-2">
              {quickActions.filter(action => !action.primary).map((action) => (
                <div key={action.id} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-foreground bg-card px-3 py-1 rounded-full shadow-lg border">
                    {action.label}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      action.action();
                      setFabExpanded(false);
                    }}
                    className="h-10 w-10 rounded-full shadow-lg"
                  >
                    {action.icon}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Main FAB Button */}
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-all duration-200"
            onClick={() => setFabExpanded(!fabExpanded)}
          >
            <div className={`transition-transform duration-200 ${fabExpanded ? 'rotate-45' : 'rotate-0'}`}>
              {fabExpanded ? <X className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
            </div>
          </Button>

          {/* Primary Action Button */}
          {!fabExpanded && quickActions.find(action => action.primary) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => quickActions.find(action => action.primary)?.action()}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 h-8 px-3 rounded-full shadow-lg"
            >
              <div className="flex items-center space-x-1">
                {quickActions.find(action => action.primary)?.icon}
                <span className="text-xs">Quick Search</span>
              </div>
            </Button>
          )}
        </div>
      </div>
    )}
  </div>
  </ErrorBoundary>
);
};

export default Dashboard;