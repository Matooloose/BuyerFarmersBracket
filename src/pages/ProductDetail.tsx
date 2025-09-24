import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Heart,
  Star,
  Share2,
  ShoppingCart,
  Leaf,
  Award,
  MapPin,
  Package,
  Truck,
  Shield,
  Clock,
  Users,
  Plus,
  Minus,
  Camera,
  MessageCircle
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
  nutritional_info: any;
  storage_instructions: string | null;
  harvest_date: string | null;
  expiry_date: string | null;
  minimum_order_quantity: number;
  created_at: string;
  farmName?: string;
  farmLocation?: string;
  farmDescription?: string;
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

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchReviews();
    }
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      
      // Fetch farm info separately
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('name, location, description')
        .eq('farmer_id', productData.farmer_id)
        .single();
      
      // Combine the data
      const combinedData: Product = {
        ...productData,
        farmName: farmData?.name || "Unknown Farm",
        farmLocation: farmData?.location || undefined,
        farmDescription: farmData?.description || undefined
      };
      
      setProduct(combinedData);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!productId) return;
    
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('product_id', productId);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
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
        description: `${quantity} × ${product.name} added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    
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
    if (!product || !user || reviewRating === 0) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: product.id,
          rating: reviewRating,
          comment: reviewComment,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });

      setReviewModalOpen(false);
      setReviewRating(0);
      setReviewComment("");
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const getAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/browse-products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  const avgRating = getAverageRating();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.images?.[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-green-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
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
              <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{product.farmName} • {product.farmLocation}</span>
              </div>
            </div>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < avgRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-lg font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-gray-600">({reviews.length} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">R{product.price.toFixed(2)}</span>
                <span className="text-gray-500">per {product.unit}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-1" />
                  {product.quantity} in stock
                </div>
                {product.minimum_order_quantity > 1 && (
                  <div className="text-sm text-gray-600">
                    Min. order: {product.minimum_order_quantity} {product.unit}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="bg-white rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(product.minimum_order_quantity, quantity - 1))}
                    disabled={quantity <= product.minimum_order_quantity}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    disabled={quantity >= product.quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.quantity === 0}
                  className="flex-1"
                >
                  {addingToCart ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                >
                  <Heart 
                    className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              {product.harvest_date && (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Harvested</p>
                      <p className="text-xs text-gray-600">
                        {new Date(product.harvest_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Delivery</p>
                    <p className="text-xs text-gray-600">2-3 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-700 leading-relaxed">
                    {product.description || "No description available for this product."}
                  </p>
                  {product.farmDescription && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">About {product.farmName}</h4>
                      <p className="text-gray-600">{product.farmDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="nutrition" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  {product.nutritional_info ? (
                    <div className="space-y-4">
                      {/* Display nutritional info if available */}
                      <pre className="text-sm">{JSON.stringify(product.nutritional_info, null, 2)}</pre>
                    </div>
                  ) : (
                    <p className="text-gray-600">Nutritional information not available for this product.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="storage" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {product.storage_instructions ? (
                      <p className="text-gray-700">{product.storage_instructions}</p>
                    ) : (
                      <p className="text-gray-600">Storage instructions not available.</p>
                    )}
                    
                    {product.expiry_date && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Best Before</p>
                            <p className="text-xs text-yellow-600">
                              {new Date(product.expiry_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Customer Reviews</CardTitle>
                  <Button onClick={() => setReviewModalOpen(true)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Write Review
                  </Button>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No reviews yet. Be the first to review this product!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium">{review.profiles?.name || 'Anonymous'}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Review Modal */}
        <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
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
                <label className="text-sm font-medium">Comment (optional)</label>
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

export default ProductDetail;