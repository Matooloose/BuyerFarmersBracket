import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Home,
  Package,
  MessageCircle,
  Search,
  Bookmark
} from "lucide-react";
import { Button } from "../components/ui/button"; // Adjust the path as needed
import { Input } from "../components/ui/input"; // Adjust the path as needed
import { Card, CardContent } from "../components/ui/card"; // Adjust the path as needed
import { Separator } from "../components/ui/separator"; // Adjust the path as needed
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../contexts/CartContext";
import BottomNav from "@/components/BottomNav";

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCart();

  // Save for Later state
  const [savedItems, setSavedItems] = useState(() => {
    const stored = localStorage.getItem('savedItems');
    return stored ? JSON.parse(stored) : [];
  });
  const saveForLater = (item) => {
    setSavedItems(prev => {
      const updated = [...prev, item];
      localStorage.setItem('savedItems', JSON.stringify(updated));
      return updated;
    });
    removeItem(item.id);
  };
  const moveToCart = (item) => {
    // You may want to add a function in CartContext to add item back to cart
    // For now, reload page and let user add from BrowseProducts
    setSavedItems(prev => {
      const updated = prev.filter(i => i.id !== item.id);
      localStorage.setItem('savedItems', JSON.stringify(updated));
      return updated;
    });
    // Optionally: addToCart(item)
  };

  // Notes per item
  const [notes, setNotes] = useState(() => {
    const stored = localStorage.getItem('cartNotes');
    return stored ? JSON.parse(stored) : {};
  });
  const handleNoteChange = (id, value) => {
    setNotes(prev => {
      const updated = { ...prev, [id]: value };
      localStorage.setItem('cartNotes', JSON.stringify(updated));
      return updated;
    });
  };

  // Promo code
  const [promoCode, setPromoCode] = useState(() => "");
  const [promoApplied, setPromoApplied] = useState(() => false);
  const [discount, setDiscount] = useState(() => 0);
  const validCodes = { "FRESH10": 0.1, "FARM5": 0.05 };
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (validCodes[code]) {
      setDiscount(validCodes[code]);
      setPromoApplied(true);
    } else {
      setDiscount(0);
      setPromoApplied(false);
      alert("Invalid promo code");
    }
  };

  const bottomNavItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: ShoppingCart, label: "Cart", path: "/cart", active: true },
    { icon: Package, label: "Track", path: "/track-order" },
    { icon: Search, label: "Browse", path: "/browse-products" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">My Cart</h1>
            <p className="text-sm text-muted-foreground">
              {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-32">
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some fresh products to get started</p>
            <Button onClick={() => navigate('/home')} className="bg-gradient-to-r from-primary to-primary-light">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-primary/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.farmName || 'Local Farm'}</p>
                      <p className="font-semibold text-primary">
                        R{item.price.toFixed(2)}/{item.unit}
                      </p>
                      {/* Notes field */}
                      <Input
                        type="text"
                        placeholder="Add a note for the farmer..."
                        value={typeof notes[item.id] === 'string' ? notes[item.id] : ''}
                        onChange={e => handleNoteChange(item.id, e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* You can add another action here, e.g. Share, or leave empty for now */}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold">
                        R{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Saved for Later Items */}
            {savedItems.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2">Saved for Later</h3>
                {savedItems.map((item) => (
                  <Card key={item.id} className="border-dashed">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.farmName || 'Local Farm'}</p>
                        <p className="font-semibold text-primary">R{item.price.toFixed(2)}/{item.unit}</p>
                      </div>
                      <Button size="sm" onClick={() => moveToCart(item)}>
                        Move to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Summary and Checkout */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-card border-t shadow-strong p-4">
          <div className="space-y-4">
            {/* Promo Code */}
            <div className="flex items-center gap-2 mb-2">
              <Input
                type="text"
                placeholder="Promo code"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                className="w-32"
                disabled={promoApplied}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleApplyPromo}
                disabled={promoApplied}
              >
                {promoApplied ? "Applied" : "Apply"}
              </Button>
              {promoApplied && <span className="text-green-600 text-xs">Discount applied!</span>}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>R{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span>R2.99</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Promo Discount:</span>
                  <span>-R{(getTotalPrice() * discount).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>R{(getTotalPrice() + 2.99 - (promoApplied ? getTotalPrice() * discount : 0)).toFixed(2)}</span>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary-light"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}

      {/* Shared Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Cart;

