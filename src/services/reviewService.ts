import { supabase } from '@/integrations/supabase/client';

export interface BasicReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
  user_name?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewData {
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
}

export class ReviewService {
  // Get reviews for a product - For now using a temporary reviews table in products
  static async getProductReviews(productId: string): Promise<BasicReview[]> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          product_id,
          user_id,
          rating,
          comment,
          created_at
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }

      return (reviews || []).map(review => ({
        id: review.id,
        product_id: review.product_id,
        user_id: review.user_id,
        rating: review.rating,
        title: '', // Will be added when title column is available
        comment: review.comment || '',
        created_at: review.created_at,
        user_name: 'Anonymous' // Will be joined with profiles when foreign key is available
      }));
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return [];
    }
  }

  // Get review statistics for a product
  static async getProductReviewStats(productId: string): Promise<ReviewStats> {
    const reviews = await this.getProductReviews(productId);
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating as keyof typeof dist]++;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution
    };
  }

  // Create a new review
  static async createReview(reviewData: CreateReviewData): Promise<BasicReview> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          product_id: reviewData.product_id,
          user_id: user.user.id,
          rating: reviewData.rating,
          comment: reviewData.comment || ''
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: review.id,
        product_id: review.product_id,
        user_id: review.user_id,
        rating: review.rating,
        title: '',
        comment: review.comment || '',
        created_at: review.created_at,
        user_name: 'You'
      };
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Update a review
  static async updateReview(reviewId: string, updateData: Partial<CreateReviewData>): Promise<BasicReview> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .update({
          rating: updateData.rating,
          comment: updateData.comment
        })
        .eq('id', reviewId)
        .eq('user_id', user.user.id) // Ensure user can only update their own reviews
        .select()
        .single();

      if (error) throw error;

      return {
        id: review.id,
        product_id: review.product_id,
        user_id: review.user_id,
        rating: review.rating,
        title: '',
        comment: review.comment || '',
        created_at: review.created_at,
        user_name: 'You'
      };
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review
  static async deleteReview(reviewId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.user.id); // Ensure user can only delete their own reviews

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}