import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Plus, Minus, Heart, MapPin, Star } from "lucide-react";

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

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onAddToWishlist: (productId: string) => void;
  isInWishlist: boolean;
  isAddingToCart: boolean;
  farmName?: string;
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  isInWishlist,
  isAddingToCart,
  farmName = "Local Farm"
}) => {
  const [selectedQuantity, setSelectedQuantity] = React.useState(1);

  if (!product) return null;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(product.quantity, selectedQuantity + delta));
    setSelectedQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    onAddToCart(product.id, selectedQuantity);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{product.name}</DialogTitle>
          <DialogDescription className="text-left">
            Quick view for {product.name} - R{product.price}/{product.unit} from {farmName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Image */}
          <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
            {product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-16 w-16 text-primary/40" />
            )}
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {product.is_organic && (
              <Badge variant="secondary" className="text-xs">🌱 Organic</Badge>
            )}
            {product.is_featured && (
              <Badge variant="default" className="text-xs">⭐ Featured</Badge>
            )}
            <Badge variant="outline" className="text-xs">{product.category}</Badge>
          </div>

          {/* Price and Farm Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">
                  R{product.price}/{product.unit}
                </p>
                <p className="text-sm text-muted-foreground">
                  {product.quantity} {product.unit} available
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddToWishlist(product.id)}
                className="p-2"
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart 
                  className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                />
              </Button>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{farmName}</span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{product.description || 'No description available'}</p>
          </div>

          {/* Quality Rating (Mock) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">(4.0) · 23 reviews</span>
          </div>

          <Separator />

          {/* Quantity Selector */}
          <div className="space-y-3">
            <h4 className="font-semibold">Quantity</h4>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(-1)}
                disabled={selectedQuantity <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">
                {selectedQuantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(1)}
                disabled={selectedQuantity >= product.quantity}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground ml-2">
                {product.unit}
              </span>
            </div>
            
            {/* Total Price */}
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                Total: R{(product.price * selectedQuantity).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1"
            >
              {isAddingToCart ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuickView;