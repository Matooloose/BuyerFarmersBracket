import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Search,
  Plus,
  Grid,
  List,
  Heart,
  Star,
  Filter,
  SortAsc,
  Share2,
  Eye,
  ShoppingCart,
  Leaf,
  Award,
  MapPin,
  Clock,
  Package
} from "lucide-react";

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
  created_at: string;
  farmName?: string;
  farmLocation?: string;
}

interface Review {
  id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  profiles: {
    name: string | null;
  };
  created_at: string;
}

function BrowseProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  
  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [productReviews, setProductReviews] = useState<{ [key: string]: Review[] }>({});

  // Fetch products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('quantity', 0); // Only products with stock

      if (error) throw error;
      
      // Fetch farm data separately for each product
      const enhancedProducts: Product[] = [];
      
      if (data && data.length > 0) {
        for (const product of data) {
          let farmName = "Unknown Farm";
          let farmLocation: string | null = null;
          
          // Fetch farm details for this product
          const { data: farmData } = await supabase
            .from('farms')
            .select('name, location')
            .eq('farmer_id', product.farmer_id)
            .single();
          
          if (farmData) {
            farmName = farmData.name;
            farmLocation = farmData.location;
          }
          
          enhancedProducts.push({
            ...product,
            farmName,
            farmLocation: farmLocation || undefined
          });
        }
      }
      
      setProducts(enhancedProducts);
      
      // Fetch reviews for all products
      if (enhancedProducts.length > 0) {
        const productIds = enhancedProducts.map(p => p.id);
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles (
              name
            )
          `)
          .in('product_id', productIds);

        if (!reviewsError && reviewsData) {
          const reviewsByProduct = reviewsData.reduce((acc, review) => {
            if (!acc[review.product_id]) {
              acc[review.product_id] = [];
            }
            acc[review.product_id].push(review);
            return acc;
          }, {} as { [key: string]: Review[] });
          
          setProductReviews(reviewsByProduct);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error Loading Products",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(p => p.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.images?.[0] || "/placeholder.svg",
        farmName: product.farmName || "Unknown Farm",
        category: product.category
      });

      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const handleWishlistToggle = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} removed from wishlist`,
      });
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.images?.[0] || "/placeholder.svg",
        farmName: product.farmName || "Unknown Farm",
        category: product.category
      });
      toast({
        title: "Added to Wishlist",
        description: `${product.name} added to wishlist`,
      });
    }
  };

  const submitReview = async () => {
    if (!reviewProductId || reviewRating === 0) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Please Sign In",
          description: "You need to sign in to leave a review",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: reviewProductId,
          rating: reviewRating,
          comment: reviewComment,
          user_id: user.user.id
        });

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });

      setReviewModalOpen(false);
      setReviewRating(0);
      setReviewComment("");
      fetchProducts(); // Refresh to get new reviews
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const getAverageRating = (productId: string): number => {
    const reviews = productReviews[productId] || [];
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return getAverageRating(b.id) - getAverageRating(a.id);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const ProductCard = ({ product }: { product: Product }) => {
    const avgRating = getAverageRating(product.id);
    const reviewCount = productReviews[product.id]?.length || 0;
    
    if (viewMode === 'list') {
      return (
        <Card 
          className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-shrink-0 w-32 h-32">
                <img 
                  src={product.images?.[0] || "/placeholder.svg"} 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                
                {/* Badges */}
                <div className="absolute top-1 left-1 flex flex-col gap-1">
                  {product.is_organic && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      <Leaf className="h-2 w-2 mr-1" />
                      Organic
                    </Badge>
                  )}
                  {product.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                      <Award className="h-2 w-2 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      {product.farmName} • {product.farmLocation}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlistToggle(product);
                    }}
                  >
                    <Heart 
                      className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  </Button>
                </div>

                {/* Rating */}
                {reviewCount > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < avgRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({reviewCount})</span>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xl font-bold">R{product.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-500 ml-1">per {product.unit}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="h-3 w-3 mr-1" />
                      {product.quantity} in stock
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.quantity === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewProductId(product.id);
                        setReviewModalOpen(true);
                      }}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Grid view (original design)
    return (
      <Card 
        className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <CardContent className="p-4">
          <div className="relative mb-3">
            <img 
              src={product.images?.[0] || "/placeholder.svg"} 
              alt={product.name}
              className="w-full h-48 object-cover rounded-lg"
            />
            
            {/* Wishlist button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistToggle(product);
              }}
            >
              <Heart 
                className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.is_organic && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Leaf className="h-3 w-3 mr-1" />
                  Organic
                </Badge>
              )}
              {product.is_featured && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Award className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            
            {/* Farm info */}
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-3 w-3 mr-1" />
              {product.farmName} • {product.farmLocation}
            </div>

            {/* Rating */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < avgRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({reviewCount})</span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
            )}

            {/* Price and stock */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold">R{product.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500 ml-1">per {product.unit}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Package className="h-3 w-3 mr-1" />
                {product.quantity} in stock
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                className="flex-1"
                disabled={product.quantity === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setReviewProductId(product.id);
                  setReviewModalOpen(true);
                }}
              >
                <Star className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="container mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Browse Products</h1>
          <div></div>
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: 'name' | 'price' | 'rating') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products grid/list */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Review Modal */}
        <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave a Review</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewRating(star)}
                    >
                      <Star 
                        className={`h-5 w-5 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Comment</label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitReview} disabled={reviewRating === 0}>
                  Submit Review
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default BrowseProducts;