import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getStripe, confirmStripePayment, createPaymentIntent } from "../lib/stripePayment";
import { payFastService } from "../lib/payfast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Gift,
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
// Enhanced interfaces for checkout features
interface UserProfile {
  name: string | null;
  address: string | null;
  phone: string | null;
}

interface DeliveryAddress {
  id: string;
  name: string;
  type: 'home' | 'work' | 'other';
  address: string;
  instructions?: string;
  isDefault: boolean;
}

interface DeliverySlot {
  id: string;
  date: Date;
  timeSlot: string;
  available: boolean;
  price?: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank' | 'cash';
  name: string;
  details: string;
  icon: any;
  isDefault?: boolean;
}

interface GiftOptions {
  enabled: boolean;
  message: string;
  recipientName: string;
  wrapStyle: 'standard' | 'premium' | 'eco';
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  
  // Temporary updateCartItem function for order editing
  const updateCartItem = (id: string, quantity: number) => {
    // This would need to be implemented in the CartContext
    console.log('Update cart item:', id, quantity);
  };
  const { checkoutData, updateCheckoutData, addNotification } = useAppState();
  const { user } = useAuth();
  
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', address: '', phone: '' });
  const [formData, setFormData] = useState({
    fullName: userProfile.name || (checkoutData.address ? checkoutData.address.split('\n')[0] : ""),
    phoneNumber: userProfile.phone || "",
    address: checkoutData.address || userProfile.address || "",
    instructions: ""
  });

  // Enhanced state management
  const [isOneClickMode, setIsOneClickMode] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<DeliverySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [giftOptions, setGiftOptions] = useState<GiftOptions>({
    enabled: false,
    message: '',
    recipientName: '',
    wrapStyle: 'standard'
  });
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [recurringOrder, setRecurringOrder] = useState({
    enabled: false,
    frequency: 'weekly',
    nextDelivery: new Date()
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean;
    suggestions: string[];
  }>({ isValid: true, suggestions: [] });

  // Delivery fee set by farmer - for demo, using dynamic calculation
  const baseDeliveryFee = checkoutData.deliveryFee || 20;
  const slotFee = selectedSlot?.price || 0;
  const giftFee = giftOptions.enabled ? (giftOptions.wrapStyle === 'premium' ? 15 : giftOptions.wrapStyle === 'eco' ? 5 : 10) : 0;
  const deliveryFee = baseDeliveryFee + slotFee + giftFee;
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee + deliveryTip;

  // Load user data and preferences
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/dashboard');
      return;
    }
    
    initializeCheckout();
  }, [cartItems.length, navigate]);

  // Debug effect to track payment method selection
  useEffect(() => {
    console.log('Selected Payment Method:', selectedPaymentMethod);
    console.log('Available Payment Methods:', paymentMethods);
  }, [selectedPaymentMethod, paymentMethods]);

  const initializeCheckout = async () => {
    await fetchUserProfile();
    await loadSavedAddresses();
    await loadPaymentMethods();
    await loadDeliverySlots();
    checkOneClickEligibility();
    calculateDeliveryEstimate();
  };

  const checkOneClickEligibility = () => {
    const hasDefaultAddress = savedAddresses.some(addr => addr.isDefault);
    const hasDefaultPayment = paymentMethods.some(pm => pm.isDefault);
    setIsOneClickMode(hasDefaultAddress && hasDefaultPayment);
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, address, phone')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserProfile(data);
        setFormData(prev => ({
          ...prev,
          fullName: data.name || "",
          phoneNumber: data.phone || "",
          address: data.address || ""
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const loadSavedAddresses = async () => {
    if (!user) return;

    // Simulated saved addresses - in real app, would fetch from database
    const addresses: DeliveryAddress[] = [
      {
        id: '1',
        name: 'Home',
        type: 'home',
        address: userProfile.address || '',
        isDefault: true,
        instructions: 'Ring doorbell twice'
      },
      {
        id: '2',
        name: 'Work',
        type: 'work',
        address: '123 Business Park, Cape Town, 8001',
        isDefault: false,
        instructions: 'Reception desk'
      }
    ];

    setSavedAddresses(addresses);
    const defaultAddress = addresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      setFormData(prev => ({
        ...prev,
        address: defaultAddress.address,
        instructions: defaultAddress.instructions || ''
      }));
    }
  };

  const loadPaymentMethods = async () => {
    // Simulated payment methods
    const methods: PaymentMethod[] = [
      {
        id: 'card_1',
        type: 'card',
        name: 'Visa ending in 4242',
        details: '**** **** **** 4242',
        icon: CreditCard,
        isDefault: true
      },
      {
        id: 'wallet_1',
        type: 'wallet',
        name: 'Apple Pay',
        details: 'Touch ID enabled',
        icon: Smartphone
      },
      {
        id: 'bank_1',
        type: 'bank',
        name: 'EFT Transfer',
        details: 'Standard Bank',
        icon: Building
      },
      {
        id: 'cash_1',
        type: 'cash',
        name: 'Cash on Delivery',
        details: 'Pay when you receive',
        icon: Banknote
      }
    ];

    setPaymentMethods(methods);
    const defaultMethod = methods.find(pm => pm.isDefault);
    if (defaultMethod) {
      setSelectedPaymentMethod(defaultMethod.id);
    }
  };

  const loadDeliverySlots = async () => {
    // Generate available delivery slots for next 7 days
    const slots: DeliverySlot[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const timeSlots = [
        { time: '08:00 - 10:00', available: Math.random() > 0.3, price: 0 },
        { time: '10:00 - 12:00', available: Math.random() > 0.2, price: 0 },
        { time: '12:00 - 14:00', available: Math.random() > 0.4, price: 5 },
        { time: '14:00 - 16:00', available: Math.random() > 0.1, price: 0 },
        { time: '16:00 - 18:00', available: Math.random() > 0.2, price: 10 },
        { time: '18:00 - 20:00', available: Math.random() > 0.5, price: 15 }
      ];

      timeSlots.forEach((slot, index) => {
        slots.push({
          id: `${date.toISOString().split('T')[0]}_${index}`,
          date,
          timeSlot: slot.time,
          available: slot.available,
          price: slot.price
        });
      });
    }

    setAvailableSlots(slots);
    
    // Auto-select earliest available slot
    const firstAvailable = slots.find(slot => slot.available);
    if (firstAvailable) {
      setSelectedSlot(firstAvailable);
    }
  };

  const calculateDeliveryEstimate = () => {
    if (selectedSlot) {
      const deliveryDate = format(selectedSlot.date, 'EEEE, MMMM do');
      setEstimatedDelivery(`${deliveryDate} between ${selectedSlot.timeSlot}`);
    } else {
      setEstimatedDelivery('2-3 business days');
    }
  };

  const validateAddress = async (address: string) => {
    // Simulated address validation
    const isValid = address.length > 10 && address.includes(',');
    const suggestions = isValid ? [] : [
      '123 Main Street, Cape Town, 8001',
      '456 High Street, Johannesburg, 2001'
    ];

    setAddressValidation({ isValid, suggestions });
    return isValid;
  };

  const handleAddressSelect = (addressId: string) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setFormData(prev => ({
        ...prev,
        address: address.address,
        instructions: address.instructions || ''
      }));
      validateAddress(address.address);
    }
  };

  const handleOneClickCheckout = async () => {
    if (!isOneClickMode) return;

    const defaultAddress = savedAddresses.find(addr => addr.isDefault);
    const defaultPayment = paymentMethods.find(pm => pm.isDefault);

    if (!defaultAddress || !defaultPayment) {
      toast({
        title: "Setup Required",
        description: "Please set default address and payment method for one-click checkout",
        variant: "destructive",
      });
      return;
    }

    // Use default settings
    setFormData(prev => ({
      ...prev,
      address: defaultAddress.address,
      instructions: defaultAddress.instructions || ''
    }));
    setSelectedPaymentMethod(defaultPayment.id);
    
    // Proceed with order
    handlePlaceOrder();
  };

  const saveAsRecurringOrder = async (orderId: string) => {
    if (!recurringOrder.enabled) return;

    // Save recurring order template
    const recurringData = {
      user_id: user?.id,
      original_order_id: orderId,
      frequency: recurringOrder.frequency,
      next_delivery: recurringOrder.nextDelivery,
      items: cartItems,
      delivery_address: formData.address,
      payment_method: selectedPaymentMethod,
      is_active: true
    };

    // In real app, save to database
    localStorage.setItem(`recurring_order_${user?.id}`, JSON.stringify(recurringData));
    
    toast({
      title: "Recurring Order Set",
      description: `Your order will repeat ${recurringOrder.frequency}`,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-validate address
    if (field === 'address') {
      validateAddress(value);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^(\+27|0)[6-8][0-9]{8}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Please enter a valid South African phone number';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      errors.address = 'Please provide a more detailed address';
    }

    if (!selectedPaymentMethod) {
      errors.payment = 'Please select a payment method';
    }

    // Check if address validation passed
    if (!addressValidation.isValid && formData.address.trim()) {
      errors.address = 'Please check your address format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    // Check if cart is empty
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart first",
        variant: "destructive",
      });
      navigate('/browse-products');
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Please complete all required fields",
        description: "Check the highlighted fields and try again",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to place an order",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    try {
      // Save checkout data
      updateCheckoutData({
        address: formData.address,
        paymentMethod: selectedPaymentMethod,
        deliveryFee: deliveryFee
      });

      // Create order in database
      const orderData = {
        user_id: user.id,
        total,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        payment_method: selectedPaymentMethod,
        shipping_address: formData.address,
        delivery_instructions: formData.instructions || null,
        phone_number: formData.phoneNumber,
        estimated_delivery: estimatedDelivery,
        delivery_slot: selectedSlot ? `${selectedSlot.date.toISOString().split('T')[0]} ${selectedSlot.timeSlot}` : null,
        gift_options: giftOptions.enabled ? JSON.stringify(giftOptions) : null
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order. Please try again.');
      }

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items error:', itemsError);
        throw new Error('Failed to add items to order. Please try again.');
      }

      // Handle payment method
      const selectedMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
      
      if (selectedMethod?.type === "card") {
        // Stripe payment flow
        const { clientSecret } = await createPaymentIntent(total * 100, "usd");
        const result = await confirmStripePayment(clientSecret);
        
        if (result.error) {
          toast({
            title: "Payment Failed",
            description: result.error.message,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        // Update order status for successful payment
        await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            status: 'processing'
          })
          .eq('id', order.id);

      } else if (selectedMethod?.type === "wallet") {
        // Digital wallet payment (simulated)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            status: 'processing'
          })
          .eq('id', order.id);

      } else if (selectedMethod?.type === "bank") {
        // Bank transfer - send instructions
        toast({
          title: "Bank Transfer Instructions",
          description: "You'll receive banking details via email. Order will be processed after payment verification.",
        });

      } else {
        // Cash on delivery
        await supabase
          .from('orders')
          .update({
            payment_method: 'cash',
            status: 'processing'
          })
          .eq('id', order.id);
      }

      // Save as recurring order if enabled
      await saveAsRecurringOrder(order.id);

      // Add success notification
      addNotification({
        title: "Order Placed Successfully!",
        message: `Your order #${order.id.slice(0, 8)} has been placed and will be delivered ${estimatedDelivery}`,
        type: "order",
        read: false
      });

      // Clear cart
      clearCart();

      toast({
        title: "Order Placed Successfully!",
        description: `Estimated delivery: ${estimatedDelivery}`,
      });

      // Navigate to track order
      navigate(`/track-order?orderId=${order.id}`);

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/cart')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Checkout</h1>
          </div>
          
          {/* One-Click Checkout */}
          {isOneClickMode && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOneClickCheckout}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              One-Click
            </Button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Address</span>
            <span>Delivery</span>
            <span>Payment</span>
            <span>Review</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>
      </header>

      <main className="p-4 pb-32 space-y-6">
        <Tabs defaultValue="address" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          {/* Address Tab */}
          <TabsContent value="address" className="space-y-4">
            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Saved Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedAddressId === address.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleAddressSelect(address.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{address.name}</span>
                            <Badge variant={address.type === 'home' ? 'default' : 'secondary'}>
                              {address.type}
                            </Badge>
                            {address.isDefault && (
                              <Badge variant="outline">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{address.address}</p>
                          {address.instructions && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Instructions: {address.instructions}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit address functionality
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Manual Address Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {savedAddresses.length > 0 ? 'New Address' : 'Delivery Address'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
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
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="Enter your phone number"
                      className={validationErrors.phoneNumber ? 'border-destructive' : ''}
                    />
                    {validationErrors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1">{validationErrors.phoneNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Complete Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your complete delivery address"
                      rows={3}
                      className={validationErrors.address ? 'border-destructive' : ''}
                    />
                    {validationErrors.address && (
                      <p className="text-sm text-destructive mt-1">{validationErrors.address}</p>
                    )}
                    
                    {/* Address Validation */}
                    {!addressValidation.isValid && addressValidation.suggestions.length > 0 && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 mb-2">Did you mean:</p>
                        {addressValidation.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInputChange('address', suggestion)}
                            className="text-xs h-auto p-1 text-yellow-700 hover:text-yellow-900"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="instructions">Special Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      placeholder="Any special delivery instructions (optional)"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="save-address" />
                  <Label htmlFor="save-address" className="text-sm">
                    Save this address for future orders
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="space-y-4">
            {/* Delivery Time Slots */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Choose Delivery Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {Array.from(new Set(availableSlots.map(slot => slot.date.toDateString()))).map(dateString => {
                    const date = new Date(dateString);
                    const slotsForDate = availableSlots.filter(slot => 
                      slot.date.toDateString() === dateString
                    );

                    return (
                      <div key={dateString} className="space-y-2">
                        <h4 className="font-medium text-sm">
                          {format(date, 'EEEE, MMMM do')}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {slotsForDate.map(slot => (
                            <Button
                              key={slot.id}
                              variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                              size="sm"
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot)}
                              className="justify-between"
                            >
                              <span>{slot.timeSlot}</span>
                              {(slot.price || 0) > 0 && (
                                <span className="text-xs">+R{slot.price}</span>
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Tip */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Tip Your Delivery Person
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 20, 50].map(amount => (
                    <Button
                      key={amount}
                      variant={deliveryTip === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDeliveryTip(amount)}
                    >
                      {amount === 0 ? 'No Tip' : `R${amount}`}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Custom Amount</Label>
                  <Slider
                    value={[deliveryTip]}
                    onValueChange={(value) => setDeliveryTip(value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>R0</span>
                    <span>R{deliveryTip}</span>
                    <span>R100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gift Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Gift Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={giftOptions.enabled}
                    onCheckedChange={(enabled) => setGiftOptions(prev => ({ ...prev, enabled }))}
                    id="gift-wrap"
                  />
                  <Label htmlFor="gift-wrap">This is a gift</Label>
                </div>

                {giftOptions.enabled && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Recipient Name</Label>
                      <Input
                        value={giftOptions.recipientName}
                        onChange={(e) => setGiftOptions(prev => ({ 
                          ...prev, 
                          recipientName: e.target.value 
                        }))}
                        placeholder="Gift recipient's name"
                      />
                    </div>

                    <div>
                      <Label>Gift Message</Label>
                      <Textarea
                        value={giftOptions.message}
                        onChange={(e) => setGiftOptions(prev => ({ 
                          ...prev, 
                          message: e.target.value 
                        }))}
                        placeholder="Your gift message"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Wrapping Style</Label>
                      <RadioGroup
                        value={giftOptions.wrapStyle}
                        onValueChange={(value: any) => setGiftOptions(prev => ({ 
                          ...prev, 
                          wrapStyle: value 
                        }))}
                        className="grid grid-cols-3 gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="text-sm">
                            Standard (+R10)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="premium" id="premium" />
                          <Label htmlFor="premium" className="text-sm">
                            Premium (+R15)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="eco" id="eco" />
                          <Label htmlFor="eco" className="text-sm">
                            Eco-Friendly (+R5)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                  className="space-y-3"
                >
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer",
                        selectedPaymentMethod === method.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      )}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <method.icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <Label htmlFor={method.id} className="font-medium cursor-pointer">
                          {method.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">{method.details}</p>
                      </div>
                      {method.isDefault && (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </div>
                  ))}
                </RadioGroup>
                {validationErrors.payment && (
                  <p className="text-sm text-destructive mt-2">{validationErrors.payment}</p>
                )}
              </CardContent>
            </Card>

            {/* Recurring Order Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5" />
                  Recurring Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={recurringOrder.enabled}
                    onCheckedChange={(enabled) => setRecurringOrder(prev => ({ ...prev, enabled }))}
                    id="recurring"
                  />
                  <Label htmlFor="recurring">Set up recurring delivery</Label>
                </div>

                {recurringOrder.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label>Frequency</Label>
                      <Select
                        value={recurringOrder.frequency}
                        onValueChange={(value) => setRecurringOrder(prev => ({ 
                          ...prev, 
                          frequency: value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Next Delivery</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !recurringOrder.nextDelivery && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {recurringOrder.nextDelivery ? (
                              format(recurringOrder.nextDelivery, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={recurringOrder.nextDelivery}
                            onSelect={(date) => setRecurringOrder(prev => ({ 
                              ...prev, 
                              nextDelivery: date || new Date()
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-4">
            {/* Order Edit Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Items
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingOrder(!isEditingOrder)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditingOrder ? 'Done' : 'Edit'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          R{item.price.toFixed(2)} per {item.unit}
                        </p>
                      </div>
                      
                      {isEditingOrder ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity} {item.unit}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            R{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>R{baseDeliveryFee.toFixed(2)}</span>
                  </div>
                  {slotFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time Slot Fee</span>
                      <span>R{slotFee.toFixed(2)}</span>
                    </div>
                  )}
                  {giftFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gift Wrapping</span>
                      <span>R{giftFee.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryTip > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Tip</span>
                      <span>R{deliveryTip.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-primary">R{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Estimated Delivery</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{estimatedDelivery}</p>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Delivery Address</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{formData.address}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong p-4 space-y-3">
        {/* Save Cart Option */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span>Save cart for later</span>
          </div>
          <Switch />
        </div>

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Debug: Payment Method: {selectedPaymentMethod || 'None'} | 
            Valid Form: {validateForm() ? 'Yes' : 'No'} | 
            Cart Items: {cartItems.length}
          </div>
        )}

        {/* Quick Checkout Button (for testing) */}
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              if (!selectedPaymentMethod && paymentMethods.length > 0) {
                setSelectedPaymentMethod(paymentMethods[0].id);
              }
              setTimeout(() => {
                handlePlaceOrder();
              }, 100);
            }}
            disabled={isProcessing}
            className="flex-1"
            size="lg"
            variant="outline"
          >
            Quick Checkout (Test)
          </Button>
          
          <PaymentMethodDialog
            amount={total.toFixed(2)}
            onPaymentMethodSelect={(method) => {
              console.log('Payment method selected:', method);
              setSelectedPaymentMethod(method);
              setTimeout(() => {
                handlePlaceOrder();
              }, 100);
            }}
            trigger={
              <Button 
                disabled={isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Place Order - R${total.toFixed(2)}`
                )}
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;