export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
  responses?: ReviewResponse[];
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  farmer_id: string;
  response: string;
  created_at: string;
  updated_at: string;
  farmer?: {
    id: string;
    name?: string;
    farm_name?: string;
  };
}

export interface ReviewHelpfulness {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
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
  images?: string[];
  order_id?: string;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}