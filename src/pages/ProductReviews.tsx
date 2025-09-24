import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Filter, 
  Search, 
  Camera, 
  Video, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Shield, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Save, 
  Download, 
  ChefHat, 
  Clock, 
  Thermometer,
  Edit,
  Send,
  ChevronDown,
  Image as ImageIcon,
  Play,
  User,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { ProductRating } from '@/components/ProductRating';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Enhanced interfaces for reviews
interface ReviewMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
}

interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  type: 'helpful' | 'not_helpful';
  createdAt: Date;
}

interface StorageTip {
  id: string;
  tip: string;
  category: 'storage' | 'preparation' | 'cooking';
  votes: number;
}

interface FarmerResponse {
  id: string;
  reviewId: string;
  farmerId: string;
  response: string;
  createdAt: Date;
  farmerName: string;
}

interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  verifiedPurchases: number;
  helpfulnessStats: {
    averageHelpfulVotes: number;
    mostHelpfulReview: string;
  };
  commonKeywords: string[];
  sentimentScore: number;
}

interface EnhancedReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  media: ReviewMedia[];
  createdAt: Date;
  updatedAt?: Date;
  verified: boolean;
  helpfulVotes: number;
  notHelpfulVotes: number;
  userVote?: 'helpful' | 'not_helpful';
  storageTips: StorageTip[];
  farmerResponse?: FarmerResponse;
  isDraft: boolean;
  tags: string[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  price: number;
  unit: string;
  category: string;
  farmer_id: string;
}

const EnhancedProductReviews: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<EnhancedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const { toast } = useToast();

  // Enhanced state for new features
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({
    rating: 0,
    title: '',
    content: '',
    media: [] as File[],
    storageTips: [] as StorageTip[],
    tags: [] as string[]
  });
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadReviews();
      loadAnalytics();
      checkUserPurchase();
    }
  }, [productId, user]);

  const loadProduct = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: "Error loading product",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!productId) return;
    
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          id,
          product_id,
          user_id,
          rating,
          comment,
          created_at,
          profiles (
            name,
            image_url
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
        return;
      }

      // Transform database reviews to component format
      const transformedReviews: EnhancedReview[] = reviewsData?.map(review => {
        const [title, ...contentParts] = (review.comment || '').split('\n\n');
        return {
          id: review.id,
          productId: review.product_id,
          userId: review.user_id,
          userName: review.profiles?.name || 'Anonymous User',
          userAvatar: review.profiles?.image_url || undefined,
          rating: review.rating,
          title: title || 'Review',
          content: contentParts.join('\n\n') || review.comment || '',
          media: [],
          createdAt: new Date(review.created_at),
          verified: true, // All reviews from purchased products are verified
          helpfulVotes: 0, // TODO: Implement voting system
          notHelpfulVotes: 0,
          storageTips: [],
          isDraft: false,
          tags: []
        };
      }) || [];

      setReviews(transformedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    }
  };

  const loadAnalytics = async () => {
    // Calculate analytics from actual reviews data
    if (reviews.length === 0) {
      setAnalytics(null);
      return;
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = reviews.filter(r => r.rating === i).length;
    }

    // Count verified purchases
    const verifiedPurchases = reviews.filter(r => r.verified).length;

    // Calculate helpfulness stats
    const totalHelpfulVotes = reviews.reduce((sum, review) => sum + (review.helpfulVotes || 0), 0);
    const averageHelpfulVotes = totalHelpfulVotes / totalReviews;
    const mostHelpfulReview = reviews.reduce((max, review) => 
      (review.helpfulVotes || 0) > (max.helpfulVotes || 0) ? review : max, reviews[0]
    );

    // Extract common keywords (simplified)
    const commonKeywords = ['fresh', 'quality', 'delivery', 'taste', 'organic'];
    
    // Simple sentiment score (based on average rating)
    const sentimentScore = averageRating / 5;

    const analyticsData: ReviewAnalytics = {
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      ratingDistribution,
      verifiedPurchases,
      helpfulnessStats: {
        averageHelpfulVotes: Number(averageHelpfulVotes.toFixed(1)),
        mostHelpfulReview: mostHelpfulReview?.id || ''
      },
      commonKeywords,
      sentimentScore: Number(sentimentScore.toFixed(2))
    };

    setAnalytics(analyticsData);
  };

  const handleVoteReview = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    // In real app, save vote to Supabase
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        const currentVote = review.userVote;
        let newHelpfulVotes = review.helpfulVotes;
        let newNotHelpfulVotes = review.notHelpfulVotes;

        // Remove previous vote if exists
        if (currentVote === 'helpful') newHelpfulVotes--;
        if (currentVote === 'not_helpful') newNotHelpfulVotes--;

        // Add new vote if different from current
        if (currentVote !== voteType) {
          if (voteType === 'helpful') newHelpfulVotes++;
          if (voteType === 'not_helpful') newNotHelpfulVotes++;
          
          return {
            ...review,
            helpfulVotes: newHelpfulVotes,
            notHelpfulVotes: newNotHelpfulVotes,
            userVote: voteType
          };
        } else {
          // Remove vote if clicking same vote
          return {
            ...review,
            helpfulVotes: newHelpfulVotes,
            notHelpfulVotes: newNotHelpfulVotes,
            userVote: undefined
          };
        }
      }
      return review;
    }));

    toast({
      title: "Vote recorded",
      description: `Your ${voteType.replace('_', ' ')} vote has been recorded`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setReviewDraft(prev => ({
      ...prev,
      media: [...prev.media, ...files]
    }));
  };

  const checkUserPurchase = async () => {
    if (!user || !productId) {
      setCheckingPurchase(false);
      return;
    }

    try {
      setCheckingPurchase(true);
      
      // Check if user has purchased this product by looking for completed orders containing this product
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          id,
          orders (
            id,
            user_id,
            status
          )
        `)
        .eq('product_id', productId)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'delivered');

      if (error) {
        console.error('Error checking purchase:', error);
        setHasPurchased(false);
      } else {
        setHasPurchased(orderItems && orderItems.length > 0);
      }
    } catch (error) {
      console.error('Error checking purchase:', error);
      setHasPurchased(false);
    } finally {
      setCheckingPurchase(false);
    }
  };

  const saveReviewDraft = () => {
    localStorage.setItem(`review_draft_${productId}`, JSON.stringify(reviewDraft));
    toast({
      title: "Draft saved",
      description: "Your review draft has been auto-saved",
    });
  };

  const loadReviewDraft = () => {
    const saved = localStorage.getItem(`review_draft_${productId}`);
    if (saved) {
      setReviewDraft(JSON.parse(saved));
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (!hasPurchased) {
      toast({
        title: "Purchase required",
        description: "You can only review products you have purchased and received",
        variant: "destructive",
      });
      return;
    }

    if (!reviewDraft.rating || !reviewDraft.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a rating and review content",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!productId) {
        toast({
          title: "Error",
          description: "Product ID is missing",
          variant: "destructive",
        });
        return;
      }

      // Check if user has already reviewed this product
      const { data: existingReviews, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (checkError) {
        throw checkError;
      }

      if (existingReviews && existingReviews.length > 0) {
        toast({
          title: "Review already exists",
          description: "You have already reviewed this product. You can edit your existing review instead.",
          variant: "destructive",
        });
        return;
      }

      // Submit new review to Supabase
      const { data: newReviewData, error: submitError } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: reviewDraft.rating,
          comment: `${reviewDraft.title}\n\n${reviewDraft.content}`
        })
        .select()
        .single();

      if (submitError) {
        throw submitError;
      }

      // Create new review object for local state
      const newReview: EnhancedReview = {
        id: newReviewData.id,
        productId: productId,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email || 'Anonymous',
        rating: reviewDraft.rating,
        title: reviewDraft.title,
        content: reviewDraft.content,
        media: [],
        createdAt: new Date(newReviewData.created_at),
        verified: true,
        helpfulVotes: 0,
        notHelpfulVotes: 0,
        storageTips: reviewDraft.storageTips,
        isDraft: false,
        tags: reviewDraft.tags
      };

      setReviews(prev => [newReview, ...prev]);
      
      // Clear draft
      setReviewDraft({
        rating: 0,
        title: '',
        content: '',
        media: [],
        storageTips: [],
        tags: []
      });
      localStorage.removeItem(`review_draft_${productId}`);
      setIsWritingReview(false);

      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });
    } catch (error) {
      toast({
        title: "Error submitting review",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const addStorageTip = (tip: string, category: 'storage' | 'preparation' | 'cooking') => {
    const newTip: StorageTip = {
      id: Date.now().toString(),
      tip,
      category,
      votes: 0
    };
    
    setReviewDraft(prev => ({
      ...prev,
      storageTips: [...prev.storageTips, newTip]
    }));
  };

  const filteredReviews = reviews
    .filter(review => {
      if (filterBy === 'verified') return review.verified;
      if (filterBy === 'with_media') return review.media.length > 0;
      if (filterBy === 'with_tips') return review.storageTips.length > 0;
      if (selectedRatingFilter > 0) return review.rating === selectedRatingFilter;
      return true;
    })
    .filter(review => 
      searchQuery === '' || 
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest_rating':
          return b.rating - a.rating;
        case 'lowest_rating':
          return a.rating - b.rating;
        case 'most_helpful':
          return b.helpfulVotes - a.helpfulVotes;
        default:
          return 0;
      }
    });

  useEffect(() => {
    loadReviewDraft();
    
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      if (reviewDraft.content.trim() || reviewDraft.title.trim()) {
        saveReviewDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [reviewDraft]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="flex items-center px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="ml-2 text-lg font-semibold">Product Reviews</h1>
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="flex items-center px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="ml-2 text-lg font-semibold">Product Reviews</h1>
          </div>
        </header>
        <main className="p-4">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-medium mb-2">Product not found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The product you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate('/')}>
                Go back to home
              </Button>
            </CardContent>
          </Card>
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
            <h1 className="text-lg font-semibold">Product Reviews</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            {checkingPurchase ? (
              <Button disabled>
                <Clock className="h-4 w-4 mr-2" />
                Checking...
              </Button>
            ) : !user ? (
              <Button onClick={() => navigate('/login')}>
                <Edit className="h-4 w-4 mr-2" />
                Sign in to Review
              </Button>
            ) : !hasPurchased ? (
              <Button disabled variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Purchase Required
              </Button>
            ) : (
              <Button onClick={() => setIsWritingReview(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Write Review
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="pb-24">
        {/* Product Info */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-4">
              <img
                src={product.images[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-20 h-20 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">{product.name}</h2>
                <p className="text-muted-foreground mb-2">{product.description}</p>
                <div className="flex items-center gap-4">
                  <ProductRating productId={product.id} />
                  {analytics && (
                    <span className="text-sm text-muted-foreground">
                      {analytics.totalReviews} reviews
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && analytics && (
          <div className="border-b bg-muted/30">
            <div className="container mx-auto px-4 py-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Review Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Rating Distribution */}
                    <div>
                      <h4 className="font-medium mb-3">Rating Distribution</h4>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm w-3">{rating}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <Progress 
                              value={(analytics.ratingDistribution[rating] / analytics.totalReviews) * 100} 
                              className="flex-1 h-2"
                            />
                            <span className="text-xs text-muted-foreground w-6">
                              {analytics.ratingDistribution[rating]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Stats */}
                    <div>
                      <h4 className="font-medium mb-3">Key Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Average Rating:</span>
                          <span className="font-medium">{analytics.averageRating.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Verified Purchases:</span>
                          <span className="font-medium">{analytics.verifiedPurchases}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg. Helpful Votes:</span>
                          <span className="font-medium">{analytics.helpfulnessStats.averageHelpfulVotes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Sentiment Score:</span>
                          <span className="font-medium">{(analytics.sentimentScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Common Keywords */}
                    <div>
                      <h4 className="font-medium mb-3">Common Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {analytics.commonKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest_rating">Highest Rating</SelectItem>
                  <SelectItem value="lowest_rating">Lowest Rating</SelectItem>
                  <SelectItem value="most_helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter */}
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="with_media">With Photos/Videos</SelectItem>
                  <SelectItem value="with_tips">With Storage Tips</SelectItem>
                </SelectContent>
              </Select>

              {/* Rating Filter */}
              <Select 
                value={selectedRatingFilter.toString()} 
                onValueChange={(value) => setSelectedRatingFilter(parseInt(value))}
              >
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={review.userAvatar} alt={review.userName} />
                        <AvatarFallback>
                          {review.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.userName}</span>
                          {review.verified && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Shield className="h-3 w-3" />
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(review.createdAt, 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    {review.title && (
                      <h4 className="font-medium mb-2">{review.title}</h4>
                    )}
                    <p className="text-muted-foreground">{review.content}</p>
                  </div>

                  {/* Review Media */}
                  {review.media.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-2 overflow-x-auto">
                        {review.media.map((media) => (
                          <div key={media.id} className="relative flex-shrink-0">
                            {media.type === 'image' ? (
                              <img
                                src={media.url}
                                alt={media.caption || 'Review image'}
                                className="w-24 h-24 rounded-lg object-cover cursor-pointer"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer">
                                <img
                                  src={media.thumbnail || '/placeholder.svg'}
                                  alt="Video thumbnail"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Storage Tips */}
                  {review.storageTips.length > 0 && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        Storage & Preparation Tips
                      </h5>
                      <div className="space-y-2">
                        {review.storageTips.map((tip) => (
                          <div key={tip.id} className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">
                              {tip.category}
                            </Badge>
                            <span className="text-sm text-green-700 flex-1">{tip.tip}</span>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600">{tip.votes}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {review.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {review.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Farmer Response */}
                  {review.farmerResponse && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Response from {review.farmerResponse.farmerName}
                        </span>
                        <span className="text-xs text-blue-600">
                          {format(review.farmerResponse.createdAt, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-blue-700">{review.farmerResponse.response}</p>
                    </div>
                  )}

                  {/* Review Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVoteReview(review.id, 'helpful')}
                        className={review.userVote === 'helpful' ? 'text-green-600' : ''}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful ({review.helpfulVotes})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVoteReview(review.id, 'not_helpful')}
                        className={review.userVote === 'not_helpful' ? 'text-red-600' : ''}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Not Helpful ({review.notHelpfulVotes})
                      </Button>
                    </div>

                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredReviews.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No reviews found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Be the first to review this product!'
                  }
                </p>
                {checkingPurchase ? (
                  <Button disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Checking...
                  </Button>
                ) : !user ? (
                  <Button onClick={() => navigate('/login')}>
                    Sign in to Review
                  </Button>
                ) : !hasPurchased ? (
                  <div className="space-y-2">
                    <Button disabled variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Purchase Required
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      You can only review products you have purchased and received.
                    </p>
                  </div>
                ) : (
                  <Button onClick={() => setIsWritingReview(true)}>
                    Write the first review
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Write Review Dialog */}
      <Dialog open={isWritingReview} onOpenChange={setIsWritingReview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <Label>Rating *</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    size="sm"
                    onClick={() => setReviewDraft(prev => ({ ...prev, rating }))}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= reviewDraft.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Review Title</Label>
              <Input
                id="title"
                value={reviewDraft.title}
                onChange={(e) => setReviewDraft(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience..."
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Review Content *</Label>
              <Textarea
                id="content"
                value={reviewDraft.content}
                onChange={(e) => setReviewDraft(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your detailed experience with this product..."
                rows={4}
              />
            </div>

            {/* Photo/Video Upload */}
            <div>
              <Label>Add Photos or Videos</Label>
              <div className="mt-2">
                <Button variant="outline" onClick={() => document.getElementById('media-upload')?.click()}>
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Media
                </Button>
                <input
                  id="media-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  aria-label="Upload media files"
                />
                {reviewDraft.media.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {reviewDraft.media.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="h-6 w-6" />
                          ) : (
                            <Video className="h-6 w-6" />
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => setReviewDraft(prev => ({
                            ...prev,
                            media: prev.media.filter((_, i) => i !== index)
                          }))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Storage Tips */}
            <div>
              <Label>Storage & Preparation Tips</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Share helpful tips about storing, preparing, or cooking this product
              </p>
              <div className="space-y-2">
                {reviewDraft.storageTips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <Badge variant="outline">{tip.category}</Badge>
                    <span className="flex-1 text-sm">{tip.tip}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewDraft(prev => ({
                        ...prev,
                        storageTips: prev.storageTips.filter((_, i) => i !== index)
                      }))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter a helpful tip..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        addStorageTip(e.currentTarget.value.trim(), 'storage');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Select onValueChange={(category: 'storage' | 'preparation' | 'cooking') => {
                    const input = document.querySelector('input[placeholder="Enter a helpful tip..."]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      addStorageTip(input.value.trim(), category);
                      input.value = '';
                    }
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="preparation">Preparation</SelectItem>
                      <SelectItem value="cooking">Cooking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={saveReviewDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={submitReview} disabled={!reviewDraft.rating || !reviewDraft.content.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedProductReviews;