import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { 
  XCircle, 
  ArrowLeft, 
  ShoppingCart, 
  CreditCard, 
  Wallet, 
  Globe, 
  Smartphone, 
  Calendar, 
  Zap, 
  Info, 
  Save, 
  MessageCircle, 
  Phone, 
  Mail, 
  BookOpen, 
  Headphones, 
  Shield, 
  CheckCircle, 
  RefreshCw, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Building
} from "lucide-react";

// Enhanced interfaces
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet' | 'crypto' | 'installment';
  name: string;
  description: string;
  icon: any;
  processingTime: string;
  fees: string;
  available: boolean;
  recommended?: boolean;
  security: 'high' | 'medium' | 'basic';
}

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  installments: number;
  interestRate: number;
  eligibleAmount: number;
  processingFee: number;
  monthlyPayment: number;
}

interface ErrorCode {
  code: string;
  title: string;
  description: string;
  commonCauses: string[];
  solutions: string[];
  severity: 'low' | 'medium' | 'high';
}

interface SavedCart {
  id: string;
  items: CartItem[];
  total: number;
  savedAt: string;
  expiresAt: string;
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  farmName?: string;
  image?: string;
}

interface SupportOption {
  id: string;
  type: 'chat' | 'phone' | 'email' | 'faq';
  title: string;
  description: string;
  icon: any;
  availability: string;
  responseTime: string;
  action: () => void;
}

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { cartItems } = useCart();

  // Core state
  const [activeTab, setActiveTab] = useState('retry');
  const [cartSaved, setCartSaved] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<string>('');

  // Dialog states
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isSaveCartDialogOpen, setIsSaveCartDialogOpen] = useState(false);
  const [isPaymentPlanDialogOpen, setIsPaymentPlanDialogOpen] = useState(false);
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);

  // Form states
  const [supportMessage, setSupportMessage] = useState('');
  const [cartName, setCartName] = useState('');

  // Get error details from URL params
  const errorCode = searchParams.get('error_code') || 'payment_declined';
  const errorMessage = searchParams.get('error_message') || 'Payment was cancelled by user';
  const orderTotal = parseFloat(searchParams.get('amount') || '0');

  // Payment methods data
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'visa',
      type: 'card',
      name: 'Visa/Mastercard',
      description: 'Credit and debit cards',
      icon: CreditCard,
      processingTime: 'Instant',
      fees: 'No fees',
      available: true,
      recommended: true,
      security: 'high'
    },
    {
      id: 'payfast',
      type: 'wallet',
      name: 'PayFast',
      description: 'South African payment gateway',
      icon: Wallet,
      processingTime: 'Instant',
      fees: '2.9% + R2.00',
      available: true,
      security: 'high'
    },
    {
      id: 'eft',
      type: 'bank',
      name: 'EFT / Bank Transfer',
      description: 'Direct bank transfer',
      icon: Building,
      processingTime: '1-3 business days',
      fees: 'No fees',
      available: true,
      security: 'high'
    },
    {
      id: 'snapscan',
      type: 'wallet',
      name: 'SnapScan',
      description: 'Mobile QR code payments',
      icon: Smartphone,
      processingTime: 'Instant',
      fees: '2.5%',
      available: true,
      security: 'medium'
    },
    {
      id: 'mobicred',
      type: 'installment',
      name: 'Mobicred',
      description: 'Buy now, pay later',
      icon: Calendar,
      processingTime: '5-10 minutes',
      fees: 'Interest applies',
      available: orderTotal >= 100,
      security: 'medium'
    }
  ];

  const paymentPlans: PaymentPlan[] = [
    {
      id: 'plan_3',
      name: '3 Month Plan',
      description: 'Split your payment over 3 months',
      installments: 3,
      interestRate: 0,
      eligibleAmount: 500,
      processingFee: 0,
      monthlyPayment: orderTotal / 3
    },
    {
      id: 'plan_6',
      name: '6 Month Plan',
      description: 'Affordable monthly payments',
      installments: 6,
      interestRate: 15,
      eligibleAmount: 1000,
      processingFee: 50,
      monthlyPayment: (orderTotal + (orderTotal * 0.15) + 50) / 6
    },
    {
      id: 'plan_12',
      name: '12 Month Plan',
      description: 'Lowest monthly payments',
      installments: 12,
      interestRate: 18,
      eligibleAmount: 2000,
      processingFee: 100,
      monthlyPayment: (orderTotal + (orderTotal * 0.18) + 100) / 12
    }
  ];

  const errorCodes: Record<string, ErrorCode> = {
    payment_declined: {
      code: 'payment_declined',
      title: 'Payment Declined',
      description: 'Your bank or card issuer declined the payment',
      commonCauses: [
        'Insufficient funds in account',
        'Card spending limit reached',
        'Suspicious activity detection',
        'Incorrect card details'
      ],
      solutions: [
        'Check your account balance',
        'Contact your bank to verify the transaction',
        'Try a different payment method',
        'Verify your card details are correct'
      ],
      severity: 'medium'
    },
    network_error: {
      code: 'network_error',
      title: 'Connection Problem',
      description: 'There was a problem connecting to the payment processor',
      commonCauses: [
        'Poor internet connection',
        'Payment gateway maintenance',
        'Browser compatibility issues'
      ],
      solutions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Use a different browser',
        'Wait a few minutes and try again'
      ],
      severity: 'low'
    },
    security_check: {
      code: 'security_check',
      title: 'Security Verification Required',
      description: 'Additional verification is needed for this transaction',
      commonCauses: [
        'New device or location',
        'Large transaction amount',
        'Security settings on your account'
      ],
      solutions: [
        'Complete 3D Secure verification',
        'Check for SMS verification codes',
        'Contact your bank to authorize the payment',
        'Try using a verified payment method'
      ],
      severity: 'high'
    },
    user_cancelled: {
      code: 'user_cancelled',
      title: 'Payment Cancelled',
      description: 'You cancelled the payment process',
      commonCauses: [
        'Clicked cancel button',
        'Closed payment window',
        'Session timeout'
      ],
      solutions: [
        'Return to cart and try again',
        'Review your order details',
        'Contact support if you need help'
      ],
      severity: 'low'
    }
  };

  const supportOptions: SupportOption[] = [
    {
      id: 'live_chat',
      type: 'chat',
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      availability: '24/7',
      responseTime: 'Immediate',
      action: () => navigate('/messages?support=true')
    },
    {
      id: 'phone_support',
      type: 'phone',
      title: 'Phone Support',
      description: 'Speak directly with a payment specialist',
      icon: Phone,
      availability: '8 AM - 8 PM',
      responseTime: 'Immediate',
      action: () => window.open('tel:+27123456789')
    },
    {
      id: 'email_support',
      type: 'email',
      title: 'Email Support',
      description: 'Send us a detailed message',
      icon: Mail,
      availability: 'Always',
      responseTime: '< 2 hours',
      action: () => setIsSupportDialogOpen(true)
    },
    {
      id: 'help_center',
      type: 'faq',
      title: 'Help Center',
      description: 'Browse common payment questions',
      icon: BookOpen,
      availability: 'Always',
      responseTime: 'Self-service',
      action: () => navigate('/faq')
    }
  ];

  useEffect(() => {
    // Auto-save cart when component loads
    handleSaveCart();
  }, []);

  const currentError = errorCodes[errorCode] || errorCodes.user_cancelled;

  const handleSaveCart = () => {
    // Use real cart items from context
    if (cartItems && cartItems.length > 0) {
      const savedCart: SavedCart = {
        id: Date.now().toString(),
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          farmName: item.farmName || 'Unknown Farm'
        })),
        total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      localStorage.setItem('savedCart', JSON.stringify(savedCart));
      setCartSaved(true);
      
      toast({
        title: "Cart saved!",
        description: "Your items have been saved for 7 days",
      });
    } else {
      toast({
        title: "No items to save",
        description: "Your cart is empty",
        variant: "destructive"
      });
    }
  };

  const handleRetryPayment = () => {
    if (selectedPaymentMethod) {
      navigate(`/checkout?payment_method=${selectedPaymentMethod}`);
    } else {
      navigate('/checkout');
    }
  };

  const handleSaveCartWithName = () => {
    if (!cartName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your saved cart",
        variant: "destructive"
      });
      return;
    }

    handleSaveCart();
    setIsSaveCartDialogOpen(false);
    setCartName('');
  };

  const handleContactSupport = () => {
    if (!supportMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please describe your issue",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Support request sent",
      description: "Our team will contact you within 2 hours",
    });
    
    setIsSupportDialogOpen(false);
    setSupportMessage('');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(price);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Payment Issue</h1>
                <p className="text-sm text-muted-foreground">Let's resolve this together</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSupportDialogOpen(true)}>
                <Headphones className="h-4 w-4 mr-2" />
                Get Help
              </Button>
              <Button size="sm" onClick={() => navigate('/cart')}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Cart
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Error Status */}
        <Card className={`mb-6 border ${getSeverityColor(currentError.severity)}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-red-800 mb-2">{currentError.title}</h2>
                <p className="text-red-700 mb-4">{currentError.description}</p>
                
                <div className="bg-white/50 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">What happened?</h4>
                  <ul className="space-y-1">
                    {currentError.commonCauses.map((cause, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="retry">Try Again</TabsTrigger>
            <TabsTrigger value="methods">Payment Options</TabsTrigger>
            <TabsTrigger value="plans">Payment Plans</TabsTrigger>
            <TabsTrigger value="help">Get Help</TabsTrigger>
          </TabsList>

          {/* Retry Tab */}
          <TabsContent value="retry" className="space-y-6">
            {/* Quick Solutions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Solutions
                </CardTitle>
                <CardDescription>
                  Try these common fixes for {currentError.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentError.solutions.map((solution, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-muted/50">
                      <p className="text-sm font-medium">{solution}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button onClick={handleRetryPayment} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Payment Again
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/checkout')} className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Review Order
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Common Causes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Why This Happened
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentError.commonCauses.map((cause, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{cause}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save Cart */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Save className="h-5 w-5" />
                  Your Cart is Safe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700 mb-4">
                  Don't worry! Your cart has been automatically saved and will be available for 7 days.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/cart')} className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    View Saved Cart
                  </Button>
                  <Button variant="outline" onClick={() => setIsSaveCartDialogOpen(true)} className="gap-2">
                    <Save className="h-4 w-4" />
                    Manage Saved Carts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="methods" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Alternative Payment Methods
                </CardTitle>
                <CardDescription>
                  Try a different payment method that might work better
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <Card 
                      key={method.id} 
                      className={`cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id ? 'border-primary bg-primary/5' : ''
                      } ${!method.available ? 'opacity-50' : 'hover:shadow-md'}`}
                      onClick={() => method.available && setSelectedPaymentMethod(method.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <method.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{method.name}</h4>
                              {method.recommended && (
                                <Badge variant="secondary" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                              {!method.available && (
                                <Badge variant="outline" className="text-xs">
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{method.description}</p>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {method.processingTime}
                              </span>
                              <span className="text-muted-foreground">
                                <DollarSign className="h-3 w-3 inline mr-1" />
                                {method.fees}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="flex gap-3">
                  <Button 
                    onClick={handleRetryPayment}
                    disabled={!selectedPaymentMethod}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Use Selected Method
                  </Button>
                  <Button variant="outline" onClick={() => setIsSecurityDialogOpen(true)} className="gap-2">
                    <Shield className="h-4 w-4" />
                    Security Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Payment Plans Available
                </CardTitle>
                <CardDescription>
                  Split your payment into manageable installments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orderTotal > 0 ? (
                  <div className="space-y-4">
                    {paymentPlans.map((plan) => (
                      <Card 
                        key={plan.id}
                        className={`cursor-pointer transition-all ${
                          selectedPaymentPlan === plan.id ? 'border-primary bg-primary/5' : ''
                        } ${orderTotal < plan.eligibleAmount ? 'opacity-50' : 'hover:shadow-md'}`}
                        onClick={() => orderTotal >= plan.eligibleAmount && setSelectedPaymentPlan(plan.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{plan.name}</h4>
                              <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </div>
                            {orderTotal < plan.eligibleAmount && (
                              <Badge variant="outline" className="text-xs">
                                Min {formatPrice(plan.eligibleAmount)}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Monthly Payment</span>
                              <p className="font-semibold">{formatPrice(plan.monthlyPayment)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duration</span>
                              <p className="font-semibold">{plan.installments} months</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Interest Rate</span>
                              <p className="font-semibold">{plan.interestRate}%</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Processing Fee</span>
                              <p className="font-semibold">{formatPrice(plan.processingFee)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Separator />

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setIsPaymentPlanDialogOpen(true)}
                        disabled={!selectedPaymentPlan}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Apply for Selected Plan
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/faq')} className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Learn More
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Payment amount not available for installment plans</p>
                    <Button variant="outline" onClick={() => navigate('/cart')} className="mt-4">
                      Return to Cart
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Get help from our payment specialists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportOptions.map((option) => (
                    <Card key={option.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <option.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{option.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{option.description}</p>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{option.availability}</span>
                              <span>{option.responseTime}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-3 text-xs"
                              onClick={option.action}
                            >
                              Contact Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Payment Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm text-green-800">SSL Encrypted</h4>
                    <p className="text-xs text-green-700">All payments are secure</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm text-blue-800">PCI Compliant</h4>
                    <p className="text-xs text-blue-700">Industry standard security</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Globe className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm text-purple-800">Global Standards</h4>
                    <p className="text-xs text-purple-700">Worldwide payment protection</p>
                  </div>
                </div>

                <div className="text-center">
                  <Button variant="outline" onClick={() => setIsSecurityDialogOpen(true)} className="gap-2">
                    <Info className="h-4 w-4" />
                    Learn More About Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Support Dialog */}
      <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="supportMessage">Describe Your Issue</Label>
              <Textarea
                id="supportMessage"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Please describe the payment issue you're experiencing..."
                rows={4}
              />
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">We'll Include:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Error code: {errorCode}</li>
                <li>• Transaction amount: {formatPrice(orderTotal)}</li>
                <li>• Your account information</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSupportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleContactSupport}>
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Cart Dialog */}
      <Dialog open={isSaveCartDialogOpen} onOpenChange={setIsSaveCartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Saved Cart</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cartName">Cart Name</Label>
              <Input
                id="cartName"
                value={cartName}
                onChange={(e) => setCartName(e.target.value)}
                placeholder="e.g., Weekly Groceries"
              />
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Current Cart</h4>
              <p className="text-sm text-muted-foreground">
                2 items • Total: {formatPrice(41.49)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Expires: 7 days from now
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveCartDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCartWithName}>
              <Save className="h-4 w-4 mr-2" />
              Save Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Dialog */}
      <Dialog open={isSecurityDialogOpen} onOpenChange={setIsSecurityDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Security Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Common Security Checks</h4>
              <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">3D Secure Verification</h5>
                    <p className="text-xs text-muted-foreground">Additional authentication from your bank</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">SMS Verification</h5>
                    <p className="text-xs text-muted-foreground">One-time code sent to your phone</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                  <Globe className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Location Verification</h5>
                    <p className="text-xs text-muted-foreground">Confirming transaction from new location</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">If You Need Help</h4>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => window.open('tel:+27123456789')}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support
                </Button>
                <Button variant="outline" onClick={() => navigate('/messages?support=true')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Live Chat
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSecurityDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleRetryPayment}>
              Try Payment Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Plan Dialog */}
      <Dialog open={isPaymentPlanDialogOpen} onOpenChange={setIsPaymentPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Payment Plan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Instant Approval Available</h4>
              <p className="text-sm text-green-700">
                Most payment plans are approved instantly with no credit check required.
              </p>
            </div>
            
            {selectedPaymentPlan && (
              <div className="p-4 border rounded-lg">
                {(() => {
                  const plan = paymentPlans.find(p => p.id === selectedPaymentPlan);
                  return plan ? (
                    <div>
                      <h4 className="font-semibold mb-2">{plan.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Monthly Payment:</span>
                          <p className="font-semibold">{formatPrice(plan.monthlyPayment)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Cost:</span>
                          <p className="font-semibold">{formatPrice(orderTotal + (orderTotal * plan.interestRate / 100) + plan.processingFee)}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Payment plan approved!",
                description: "Redirecting to checkout with payment plan...",
              });
              navigate(`/checkout?payment_plan=${selectedPaymentPlan}`);
            }}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentCancelled;