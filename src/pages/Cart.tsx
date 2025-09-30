import React, { useState, useEffect, useCallback } from "react";
import BottomNavBar from "@/components/BottomNavBar";
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
  Bookmark,
  Share2,
  Clock,
  MapPin,
  Calendar,
  Leaf,
  Star,
  TrendingUp,
  Users,
  Bell,
  Settings,
  CheckCircle,
  AlertCircle,
  Truck,
  Target,
  Recycle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
<<<<<<< HEAD
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";

interface SmartSuggestion {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  farmName: string;
  reason: string;
  confidence: number;
  bundleDiscount?: number;
}
=======
import BottomNav from "@/components/BottomNav";
>>>>>>> aeb7aacc8daba24402f7cfa7daf6ee404e6afaef

const Cart = () => {
  // ...all Cart logic and hooks...
  const navigate = useNavigate();
  const { cartItems, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  // Example state for promo code
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Group cart items by farm
  const farms = React.useMemo(() => {
    const grouped: Record<string, typeof cartItems> = {};
    cartItems.forEach(item => {
      const farm = item.farmName || "Unknown Farm";
      if (!grouped[farm]) grouped[farm] = [];
      grouped[farm].push(item);
    });
    return grouped;
  }, [cartItems]);

  // Calculate subtotal per farm
  const farmSubtotals = React.useMemo(() => {
    const subtotals: Record<string, number> = {};
    Object.entries(farms).forEach(([farm, items]) => {
      subtotals[farm] = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    });
    return subtotals;
  }, [farms]);

  // Minimum order validation
  const farmsBelowMinimum = Object.entries(farmSubtotals).filter(([_, subtotal]) => subtotal < 100);
  const minimumOrderError = farmsBelowMinimum.length > 0
    ? `Minimum order per farm is R100. Please add more items from: ${farmsBelowMinimum.map(([farm]) => farm).join(", ")}`
    : "";

  // Delivery fee logic (match Checkout.tsx)
  const BASE_FEE = 30; // R30 covers first 5km and 5kg
  const BASE_DISTANCE = 5; // km
  const BASE_WEIGHT = 5; // kg
  const DISTANCE_RATE = 5; // R5 per km over base
  const WEIGHT_RATE = 5; // R5 per kg over base
  const totalDistance = React.useMemo(() => cartItems.reduce((sum, item) => sum + (item.distance || 0), 0), [cartItems]);
  const totalWeight = React.useMemo(() => cartItems.reduce((sum, item) => sum + (item.weight || 0), 0), [cartItems]);
  const distanceFee = Math.max(0, totalDistance - BASE_DISTANCE) * DISTANCE_RATE;
  const weightFee = Math.max(0, totalWeight - BASE_WEIGHT) * WEIGHT_RATE;
  const deliveryFee = BASE_FEE + distanceFee + weightFee;

  // Memoized derived values for performance
  const totalItems = React.useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const totalPrice = React.useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const promoDiscount = promoApplied ? totalPrice * discount : 0;
  const finalTotal = React.useMemo(() => totalPrice + deliveryFee - promoDiscount, [totalPrice, deliveryFee, promoDiscount]);

  // Promo code validation
  const isPromoValid = promoCode.length === 5 && /^FARM\d{2}$/.test(promoCode);

  // useCallback for handlers
  const handleApplyPromo = React.useCallback(() => {
    if (promoCode === "FARM10") {
      setDiscount(0.1);
      setPromoApplied(true);
      toast({ title: "Promo applied!", description: "10% discount applied." });
    } else {
      toast({ title: "Invalid promo code", description: "Promo code must be 'FARM10'." });
    }
  }, [promoCode, toast]);

  // Example: suggestions (empty for now)
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const loadSmartSuggestions = useCallback(() => {
    // Placeholder for loading suggestions
    setSmartSuggestions([]);
  }, []);

  useEffect(() => {
    loadSmartSuggestions();
  }, [loadSmartSuggestions]);


  // Fixed JSX structure
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Smart Cart</h1>
            <p className="text-sm text-muted-foreground">
              {totalItems} item{totalItems !== 1 ? 's' : ''} • R{totalPrice.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Share cart dialog removed */}
          </div>
        </div>
      </header>
      {/* Cart Items */}
      <div className="px-4 py-2 flex-1">
        {cartItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="mx-auto mb-4 w-12 h-12 opacity-50" />
            <div>Your cart is empty.</div>
            <Button className="mt-4" onClick={() => navigate("/browse-products")}>Browse Products</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="flex items-center justify-between">
                  <CardContent className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover" />
                    <div className="flex-1">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-muted-foreground">R{item.price.toFixed(2)} x {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><Minus /></Button>
                      <span>{item.quantity}</span>
                      <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus /></Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Input
                type="text"
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1"
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
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>R{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span>R{deliveryFee.toFixed(2)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Promo Discount:</span>
                  <span>-R{promoDiscount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>
                  R{finalTotal.toFixed(2)}
                </span>
              </div>
              {minimumOrderError && (
                <div className="text-sm text-red-600 mt-2">
                  <AlertCircle className="inline mr-1" />
                  {minimumOrderError}
                </div>
              )}
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary-light mt-2"
              onClick={() => navigate('/checkout')}
              disabled={!!minimumOrderError}
            >
              Proceed to Checkout
            </Button>
<<<<<<< HEAD
          </>
        )}
      </div>
      <BottomNavBar />
=======
          </div>
        </div>
      )}

      {/* Shared Bottom Navigation */}
      <BottomNav />
>>>>>>> aeb7aacc8daba24402f7cfa7daf6ee404e6afaef
    </div>
  );
}

export default Cart;


