import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ReviewService, BasicReview, ReviewStats, CreateReviewData } from '@/services/reviewService';

interface ProductRatingProps {
  productId: string;
  showReviews?: boolean;
  compact?: boolean;
}

export const ProductRating: React.FC<ProductRatingProps> = ({
  productId,
  showReviews = true,
  compact = false
}) => {
  const [reviews, setReviews] = useState<BasicReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        ReviewService.getProductReviews(productId),
        ReviewService.getProductReviewStats(productId)
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: "Error loading reviews",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const reviewData: CreateReviewData = {
        product_id: productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined
      };

      await ReviewService.createReview(reviewData);
      
      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setIsDialogOpen(false);
      
      // Reload reviews
      await loadReviews();
      
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error: any) {
      toast({
        title: "Error submitting review",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`${size} ${
          index < count
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400 transition-colors' : ''}`}
        onClick={interactive ? () => setRating(index + 1) : undefined}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        {showReviews && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-full h-3 bg-gray-200 rounded animate-pulse" />
                <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {renderStars(Math.round(stats.averageRating))}
          <span className="text-sm font-medium">
            {stats.averageRating.toFixed(1)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          ({stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''})
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">
                {stats.averageRating.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {renderStars(Math.round(stats.averageRating), false, 'w-5 h-5')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Your rating *</Label>
                    <div className="flex gap-1 mt-1">
                      {renderStars(rating, true, 'w-8 h-8')}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="review-title">Title (optional)</Label>
                    <Input
                      id="review-title"
                      placeholder="Summarize your experience"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-comment">Review (optional)</Label>
                    <Textarea
                      id="review-comment"
                      placeholder="Share your thoughts about this product..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {comment.length}/1000 characters
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitReview}
                      disabled={submitting || rating === 0}
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        {/* Rating Distribution */}
        {stats.totalReviews > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 w-12">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress 
                    value={(stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100} 
                    className="flex-1 h-2"
                  />
                  <span className="w-8 text-right">
                    {stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Reviews List */}
      {showReviews && reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Review Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="font-medium text-sm">
                          {review.user_name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    
                    {/* Review Content */}
                    {review.title && (
                      <h4 className="font-medium">{review.title}</h4>
                    )}
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                    
                    {/* Review Actions */}
                    <div className="flex items-center gap-4 pt-2">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Helpful
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        Not helpful
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Reviews State */}
      {showReviews && reviews.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-medium mb-1">No reviews yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to review this product!
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Write the first review</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};