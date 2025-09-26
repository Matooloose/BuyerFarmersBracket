import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStripe, confirmStripePayment, createPaymentIntent } from "../lib/stripePayment";
import { payFastService, PAYFAST_CONFIG } from "../lib/payfast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { scaleButton } from "@/lib/animations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ShieldCheck,
  Clock,
  Truck,
  Edit,
  Plus,
  CheckCircle,
  AlertCircle,
  Wallet,
  Building,
  Phone,
  Calendar as CalendarIcon,
  Heart,
  DollarSign,
  Zap,
  Save,
  Star,
  User,
  CopyCheck,
  Repeat,
  ShoppingCart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAppState } from "@/contexts/AppStateContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PaymentMethodDialog from "@/components/PaymentMethodDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";



const Checkout = () => {

  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    email: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Use geocoding result for delivery distance
  // Replace 'userDeliveryDistance' with your actual geocoding result variable
  const userDeliveryDistance = 0; // TODO: set this from your geocoding integration
  const deliveryDistance = userDeliveryDistance;

  // Delivery fee logic
  const calculateDeliveryFee = (distance: number) => {
    if (distance <= 5) return 30;
    return 30 + Math.ceil(distance - 5) * 5;
  };
  const deliveryFee = calculateDeliveryFee(deliveryDistance);

  // Example cart total (replace with your actual cart logic)
  const cartTotal = getTotalPrice ? getTotalPrice() : 0;
  const totalWithDelivery = cartTotal + deliveryFee;

  // Payment methods
  const paymentMethods = [
    { value: "payfast", label: "PayFast" },
    { value: "card", label: "Card" },
    { value: "cash", label: "Cash on Delivery" },
  ];
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0].value);
    const [showCardFields, setShowCardFields] = useState(false);

    // Trigger relevant logic when payment method changes
    useEffect(() => {
      if (selectedPaymentMethod === 'card') {
        setShowCardFields(true);
      } else {
        setShowCardFields(false);
      }
      // You can add more logic for PayFast or Cash if needed
    }, [selectedPaymentMethod]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.email?.split('@')[0] || '',
        email: user.email || '',
        phoneNumber: '',
      }));
    }
  }, [user]);

  const validateCheckout = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName) errors.fullName = "Full name is required.";
    if (!formData.phoneNumber) errors.phoneNumber = "Phone number is required.";
    if (!formData.address) errors.address = "Delivery address is required.";
    if (!formData.email) errors.email = "Email is required.";
    return errors;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    const errors = validateCheckout();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Validation Error", description: "Please fix errors before submitting.", variant: "destructive" });
      setIsProcessing(false);
      return;
    }
    try {
      // Validate cart items before saving order_items
      for (const item of cartItems) {
        if (!item.id || typeof item.id !== 'string' || !/^([0-9a-fA-F-]{36})$/.test(item.id)) {
          toast({ title: "Cart Error", description: `Product ID missing or invalid for item: ${JSON.stringify(item)}`, variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
          toast({ title: "Cart Error", description: `Invalid quantity for item: ${JSON.stringify(item)}`, variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        if (typeof item.price !== 'number' || item.price < 0) {
          toast({ title: "Cart Error", description: `Invalid price for item: ${JSON.stringify(item)}`, variant: "destructive" });
          setIsProcessing(false);
          return;
        }
      }
      // 1. Save order to Supabase
      const orderInsertRes = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          total: totalWithDelivery,
          payment_method: selectedPaymentMethod,
          status: selectedPaymentMethod === 'cash' ? 'pending' : 'initiated',
          shipping_address: formData.address,
        } as any)
        .select()
        .single();
      if (orderInsertRes.error) {
        toast({ title: "Order Error", description: orderInsertRes.error.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      const createdOrder = orderInsertRes.data;
      // 2. Save order items to Supabase (no stock_quantity)
      const orderItems = cartItems.map(item => ({
        order_id: createdOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));
      // Validate orderItems strictly to Supabase schema
      for (const oi of orderItems) {
        if (!oi.order_id || typeof oi.order_id !== 'string' || !/^([0-9a-fA-F-]{36})$/.test(oi.order_id)) {
          toast({ title: "Order Item Error", description: `Invalid order_id: ${oi.order_id}`, variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        if (!oi.product_id || typeof oi.product_id !== 'string' || !/^([0-9a-fA-F-]{36})$/.test(oi.product_id)) {
          toast({ title: "Order Item Error", description: `Invalid product_id: ${oi.product_id}`, variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        if (typeof oi.quantity !== 'number' || oi.quantity <= 0) {
          toast({ title: "Order Item Error", description: `Invalid quantity: ${oi.quantity}`, variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        if (typeof oi.unit_price !== 'number' || oi.unit_price < 0) {
          toast({ title: "Order Item Error", description: `Invalid unit_price: ${oi.unit_price}`, variant: "destructive" });
          setIsProcessing(false);
          return;
        }
      }
      const itemsInsertRes = await supabase
        .from('order_items')
        .insert(orderItems);
      if (itemsInsertRes.error) {
        console.error('Supabase order_items insert error:', itemsInsertRes.error, orderItems);
        toast({ title: "Order Items Error", description: itemsInsertRes.error.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      clearCart();
      // 3. Payment logic
      if (selectedPaymentMethod === "payfast") {
        // Call your backend to initiate PayFast payment
        const response = await fetch("/api/payfast-initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            amount: totalWithDelivery,
            orderId: createdOrder.id,
          }),
        });
        const { redirectUrl, error } = await response.json();
        if (error) {
          toast({ title: "Payment Error", description: error, variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        window.location.href = redirectUrl;
      } else if (selectedPaymentMethod === "card") {
        toast({ title: "Card Payment", description: "Card payment flow not implemented.", variant: "default" });
        navigate(`/order-confirmation/${createdOrder.id}`);
        setIsProcessing(false);
        return;
      } else if (selectedPaymentMethod === "cash") {
        toast({ title: "Order Placed!", description: "Please pay cash on delivery." });
        navigate(`/order-confirmation/${createdOrder.id}`);
        setIsProcessing(false);
        return;
      }
      setIsProcessing(false);
    } catch (err) {
      toast({ title: "Error", description: "Payment could not be processed.", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Card className="w-full max-w-md mx-auto mt-12">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); handleCheckout(); }} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                className={validationErrors.fullName ? 'border-destructive' : ''}
              />
              {validationErrors.fullName && (
                <p className="text-sm text-destructive mt-1">{validationErrors.fullName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Enter your phone number"
                className={validationErrors.phoneNumber ? 'border-destructive' : ''}
              />
              {validationErrors.phoneNumber && (
                <p className="text-sm text-destructive mt-1">{validationErrors.phoneNumber}</p>
              )}
            </div>
            <div>
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter your delivery address"
                rows={3}
                className={validationErrors.address ? 'border-destructive' : ''}
              />
              {validationErrors.address && (
                <p className="text-sm text-destructive mt-1">{validationErrors.address}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className={validationErrors.email ? 'border-destructive' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <Label>Delivery Distance</Label>
              <div className="flex items-center gap-2">
                <span>{deliveryDistance} km</span>
                <span className="text-xs text-muted-foreground">(calculated from address)</span>
              </div>
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <select
                id="paymentMethod"
                aria-label="Payment Method"
                value={selectedPaymentMethod}
                onChange={e => setSelectedPaymentMethod(e.target.value)}
                className="w-full border rounded p-2"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
              {showCardFields && (
                <div className="mt-2 p-2 border rounded bg-muted">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="Enter card number" disabled />
                  <Label htmlFor="cardExpiry">Expiry Date</Label>
                  <Input id="cardExpiry" placeholder="MM/YY" disabled />
                  <Label htmlFor="cardCVC">CVC</Label>
                  <Input id="cardCVC" placeholder="CVC" disabled />
                  <p className="text-xs text-muted-foreground mt-1">Card payment flow not implemented.</p>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-muted rounded">
              <div className="flex justify-between">
                <span>Cart Total:</span>
                <span>R{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>R{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>R{totalWithDelivery.toFixed(2)}</span>
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isProcessing}>
              {isProcessing
                ? 'Processing...'
                : selectedPaymentMethod === 'payfast'
                  ? 'Pay with PayFast'
                  : selectedPaymentMethod === 'card'
                    ? 'Pay with Card'
                    : 'Place Order'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

import ErrorBoundary from "../components/ErrorBoundary";

const WrappedCheckout = () => (
  <ErrorBoundary>
    <Checkout />
  </ErrorBoundary>
);

export default WrappedCheckout;