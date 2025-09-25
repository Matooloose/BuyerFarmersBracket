import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, ShoppingCart, Heart, Leaf } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  farmName?: string;
  location?: string;
  rating?: number;
  category?: string;
  organic?: boolean;
  inStock?: boolean;
  distance?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  isWishlisted?: boolean;
  isInCart?: boolean;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  onAddToCart,
  onToggleWishlist,
  onProductClick,
  isWishlisted = false,
  isInCart = false,
  className = ''
}) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.(product);
  };

  const handleCardClick = () => {
    onProductClick?.(product);
  };

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <OptimizedImage
              src={product.image || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-full"
              loading="lazy"
            />
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.organic && (
                <Badge variant="secondary" className="text-xs">
                  <Leaf className="h-3 w-3 mr-1" />
                  Organic
                </Badge>
              )}
              {!product.inStock && (
                <Badge variant="destructive" className="text-xs">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Wishlist Button */}
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleToggleWishlist}
            >
              <Heart 
                className={`h-4 w-4 ${
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`} 
              />
            </Button>
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {product.farmName}
                </p>
              </div>
              {product.rating && (
                <div className="flex items-center gap-1 ml-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating}</span>
                </div>
              )}
            </div>

            {/* Location and Distance */}
            {(product.location || product.distance) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {product.location}
                  {product.distance && ` • ${product.distance}km away`}
                </span>
              </div>
            )}

            {/* Price and Add to Cart */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="font-bold text-primary">
                  R{product.price.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground">
                  /{product.unit}
                </span>
              </div>

              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={!product.inStock || isInCart}
                className="h-8 px-3"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                {isInCart ? 'Added' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;