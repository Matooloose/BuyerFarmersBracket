  // Helper to fetch farms for a given farmerId (example usage)
  const fetchFarms = async (farmerId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/farms?select=name&farmer_id=eq.${farmerId}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
            Accept: 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching farms:', error);
      return null;
    }
  };
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  Plus,
  Check,
  Heart,
  Star,
  Home,
  ShoppingCart,
  Package,
  Grid3X3,
  List
} from "lucide-react";
import FilterDialog from "@/components/FilterDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

type Review = {
  productId: string;
  rating: number;
  comment: string;
};

const getReviews = (): Review[] => {
  const stored = localStorage.getItem("reviews");
  return stored ? JSON.parse(stored) : [];
};

const saveReview = (review: Review) => {
  const reviews = getReviews();
  const filtered = reviews.filter(r => r.productId !== review.productId);
  localStorage.setItem("reviews", JSON.stringify([...filtered, review]));
};

const getProductReviews = (productId: string): Review[] => {
  return getReviews().filter(r => r.productId === productId);
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  images: string[];
  is_organic: boolean;
  is_featured: boolean;
  farmer_id: string;
  farmerName?: string;
  quantity: number;
}

function BrowseProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch products from Supabase on mount
  useEffect(() => {
    setLoading(true);
    supabase
          .from('products')
          .select('*')
          .then(({ data, error }) => {
            if (error) {
              toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
            } else {
              setProducts(data || []);
            }
            setLoading(false);
          });
  }, [toast]);
  const { addToCart, cartItems, getTotalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showWishlist, setShowWishlist] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  // Review/rating system helpers
  const getReviews = (): Review[] => {
    const stored = localStorage.getItem("reviews");
    return stored ? JSON.parse(stored) : [];
  };
  const saveReview = (review: Review) => {
    const reviews = getReviews();
    const filtered = reviews.filter(r => r.productId !== review.productId);
    localStorage.setItem("reviews", JSON.stringify([...filtered, review]));
  };
  const getProductReviews = (productId: string): Review[] => {
    return getReviews().filter(r => r.productId === productId);
  };

  // Wishlist toggle
  const toggleWishlist = (productId: string) => {
    setWishlist(w =>
      w.includes(productId) ? w.filter(id => id !== productId) : [...w, productId]
    );
  };

  // Add to cart logic
  const addProductToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.images && product.images.length > 0 ? product.images[0] : "",
        farmName: product.farmerName || "",
        category: product.category
      });
      setAddedProductId(productId);
      setTimeout(() => setAddedProductId(null), 1500);
    }
  };

  // Filter products based on search, category, filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    // Add more filter logic as needed
    return matchesSearch && matchesCategory;
  });

  // Products to show (wishlist or filtered)
  // Removed duplicate declaration of productsToShow

  // Fetch categories from products
  useEffect(() => {
    setCategories([...new Set(products.map(p => p.category))]);
  }, [products]);

  // Review modal logic
  const openReviewModal = (productId: string) => {
    setReviewProductId(productId);
    setReviewRating(0);
    setReviewComment("");
    setReviewModalOpen(true);
  };
  const handleReviewSubmit = () => {
    if (reviewProductId) {
      saveReview({ productId: reviewProductId, rating: reviewRating, comment: reviewComment });
      setReviewModalOpen(false);
    }
  };
    

  const bottomNavItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Package, label: "Track", path: "/track-order" },
    
    { icon: Search, label: "Browse", path: "/browse-products", active: true },
  ];

  const productsToShow = showWishlist
    ? products.filter(p => wishlist.includes(p.id))
    : filteredProducts;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="p-4 space-y-4">
          <div className="flex justify-end mb-2">
            <Button variant={showWishlist ? "default" : "outline"} size="sm" onClick={() => setShowWishlist(w => !w)}>
              <Heart className={`h-5 w-5 ${showWishlist ? 'text-primary' : ''}`} />
              <span className="ml-2">{showWishlist ? "Wishlist" : "Show Wishlist"}</span>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Browse Products</h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
              </Button>
              <FilterDialog onFiltersChange={setFilters} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No products found</h2>
            <p className="text-muted-foreground">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-2 gap-4' 
              : 'space-y-4'
          }`}>
            {productsToShow.map((product) => (
              <Card key={product.id} className="overflow-hidden relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={wishlist.includes(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                      {product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-primary/40" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                            {product.name}
                          </h3>
                          {product.is_organic && (
                            <Badge variant="secondary" className="text-xs">
                              Organic
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-primary">
                              R{product.price}/{product.unit}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.quantity} {product.unit} available
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => addProductToCart(product.id)}
                            disabled={addedProductId === product.id}
                          >
                            {addedProductId === product.id ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
                        {product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-primary/40" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-foreground">{product.name}</h3>
                          {product.is_organic && (
                            <Badge variant="secondary" className="text-xs">
                              Organic
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-primary">
                              R{product.price}/{product.unit}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.quantity} {product.unit} available
                            </p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => addProductToCart(product.id)}
                            disabled={addedProductId === product.id}
                          >
                            {addedProductId === product.id ? (
                              <>
                                <Check className="h-4 w-4 mr-1 text-success" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Add to Cart
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
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
}

export default BrowseProducts;