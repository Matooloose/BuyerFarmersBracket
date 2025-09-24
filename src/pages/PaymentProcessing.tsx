import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Star,
  History,
  Download,
  Receipt,
  RefreshCw,
  Zap,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Copy,
  QrCode,
  Banknote,
  PiggyBank,
  Gift
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'ewallet' | 'crypto' | 'payfast';
  provider: string;
  display_name: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  bank_name?: string;
  account_type?: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  metadata: Record<string, any>;
}

interface PaymentTransaction {
  id: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_method: PaymentMethod;
  description: string;
  reference: string;
  merchant_reference?: string;
  gateway_response?: Record<string, any>;
  fees: {
    gateway_fee: number;
    processing_fee: number;
    total_fees: number;
  };
  created_at: string;
  completed_at?: string;
  failure_reason?: string;
}

interface PaymentSettings {
  preferred_currency: string;
  auto_save_methods: boolean;
  require_cvv: boolean;
  enable_biometric: boolean;
  email_receipts: boolean;
  sms_notifications: boolean;
  spending_limit_enabled: boolean;
  spending_limit_amount: number;
  spending_limit_period: 'daily' | 'weekly' | 'monthly';
}

interface WalletBalance {
  currency: string;
  available_balance: number;
  pending_balance: number;
  total_balance: number;
  last_updated: string;
}

const PaymentProcessing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { cartItems: cart, getTotalPrice } = useCart();
  const total = getTotalPrice();
  const { toast } = useToast();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pay' | 'methods' | 'wallet' | 'history' | 'settings'>('pay');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    preferred_currency: 'ZAR',
    auto_save_methods: true,
    require_cvv: true,
    enable_biometric: false,
    email_receipts: true,
    sms_notifications: true,
    spending_limit_enabled: false,
    spending_limit_amount: 5000,
    spending_limit_period: 'monthly'
  });

  const [newMethod, setNewMethod] = useState({
    type: 'card' as PaymentMethod['type'],
    provider: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    cardholder_name: '',
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_type: 'cheque',
    phone_number: '',
    email: ''
  });

  const [showCvv, setShowCvv] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);

  // Get payment context from URL params
  const paymentContext = searchParams.get('context'); // 'checkout', 'subscription', 'topup'
  const amount = parseFloat(searchParams.get('amount') || '0');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadPaymentMethods();
    loadTransactions();
    loadWalletBalance();
    loadSettings();
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      // No payment methods tables exist - show empty state
      setPaymentMethods([]);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast({
        title: "Error Loading Payment Methods",
        description: "Failed to load your saved payment methods.",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async () => {
    try {
      // No transaction tables exist - show empty state
      setTransactions([]);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadWalletBalance = async () => {
    try {
      // No wallet balance tables exist - show empty state
      setWalletBalance({
        currency: 'ZAR',
        available_balance: 0,
        pending_balance: 0,
        total_balance: 0,
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Load from database or use defaults
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const processPayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const paymentAmount = amount || total || 0;
      
      if (paymentAmount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Payment processing not implemented - show coming soon message
      throw new Error('Payment processing is coming soon. Please check back later.');

    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Processing Coming Soon",
        description: error.message || "Payment processing functionality will be available soon.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!newMethod.type) return;

    try {
      setIsProcessing(true);

      // Validate required fields based on method type
      if (newMethod.type === 'card') {
        if (!newMethod.card_number || !newMethod.expiry_month || !newMethod.expiry_year || !newMethod.cvv) {
          throw new Error('Please fill in all card details');
        }
      } else if (newMethod.type === 'bank') {
        if (!newMethod.bank_name || !newMethod.account_number || !newMethod.branch_code) {
          throw new Error('Please fill in all bank account details');
        }
      }

      // Payment method saving not implemented - show coming soon message
      throw new Error('Payment method management is coming soon. Please use existing payment options.');

    } catch (error: any) {
      toast({
        title: "Payment Methods Coming Soon",
        description: error.message || "Payment method management will be available soon.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const deletePaymentMethod = async (methodId: string) => {
    try {
      setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
      if (selectedMethod === methodId) {
        const remaining = paymentMethods.filter(m => m.id !== methodId);
        setSelectedMethod(remaining.length > 0 ? remaining[0].id : '');
      }

      toast({
        title: "Payment Method Removed",
        description: "Payment method has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Removing Payment Method",
        description: "Failed to remove payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    try {
      setPaymentMethods(prev => prev.map(m => ({
        ...m,
        is_default: m.id === methodId
      })));

      toast({
        title: "Default Method Updated",
        description: "Default payment method has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error Updating Default Method",
        description: "Failed to update default payment method.",
        variant: "destructive",
      });
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank':
        return <Building className="h-5 w-5" />;
      case 'ewallet':
        return <Smartphone className="h-5 w-5" />;
      case 'crypto':
        return <Zap className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <CreditCard className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading payment information...</p>
        </div>
      </div>
    );
  }

  const paymentAmount = amount || total || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <h1 className="text-lg font-semibold">
                {paymentContext === 'checkout' ? 'Checkout Payment' :
                 paymentContext === 'topup' ? 'Wallet Top-up' :
                 paymentContext === 'subscription' ? 'Subscription Payment' :
                 'Payment Center'}
              </h1>
            </div>
          </div>
          
          {walletBalance && (
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                R{walletBalance.available_balance.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pay" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pay
            </TabsTrigger>
            <TabsTrigger value="methods" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Methods
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Payment Tab */}
          <TabsContent value="pay" className="space-y-6">
            {paymentAmount > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                    <CardDescription>
                      Review your payment details before proceeding
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Subtotal</span>
                      <span className="font-medium">R{paymentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Processing Fee</span>
                      <span className="font-medium">R{(paymentAmount * 0.03).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-lg font-bold">
                      <span>Total</span>
                      <span>R{(paymentAmount * 1.03).toFixed(2)}</span>
                    </div>

                    {orderId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Receipt className="h-4 w-4" />
                          <span className="text-sm">Order ID: {orderId}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Payment Method</CardTitle>
                    <CardDescription>
                      Choose how you'd like to pay
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
                        <p className="text-muted-foreground mb-4">
                          Add a payment method to continue with your purchase.
                        </p>
                        <Button onClick={() => setShowAddMethod(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </div>
                    ) : (
                      <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                        {paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <div className="flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                              <div className="flex items-center gap-2">
                                {getMethodIcon(method)}
                                <div>
                                  <p className="font-medium">{method.display_name}</p>
                                  <div className="flex items-center gap-2">
                                    {method.is_default && (
                                      <Badge variant="default" className="text-xs">Default</Badge>
                                    )}
                                    {method.is_verified ? (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Verified
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {paymentMethods.length > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddMethod(true)}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Method
                        </Button>
                        <Button 
                          onClick={processPayment}
                          disabled={!selectedMethod || isProcessing}
                          className="flex-1"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Pay R{(paymentAmount * 1.03).toFixed(2)}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Payment Required</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  There's nothing to pay right now. Visit the cart to make a purchase or top up your wallet.
                </p>
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant="outline" onClick={() => navigate('/cart')}>
                    Go to Cart
                  </Button>
                  <Button onClick={() => setActiveTab('wallet')}>
                    Top up Wallet
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="methods" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Payment Methods</h2>
                <p className="text-muted-foreground">Manage your saved payment methods</p>
              </div>
              <Button onClick={() => setShowAddMethod(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Method
              </Button>
            </div>

            <div className="grid gap-4">
              {paymentMethods.map((method) => (
                <Card key={method.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 rounded-full">
                          {getMethodIcon(method)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{method.display_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              Added {formatDistanceToNow(new Date(method.created_at))} ago
                            </span>
                            {method.is_default && (
                              <Badge variant="default" className="text-xs">Default</Badge>
                            )}
                            {method.is_verified ? (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Verification
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!method.is_default && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setDefaultMethod(method.id)}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Set Default
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deletePaymentMethod(method.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            {walletBalance && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Wallet Balance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PiggyBank className="h-5 w-5" />
                      Wallet Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        R{walletBalance.available_balance.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pending</span>
                        <span>R{walletBalance.pending_balance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total</span>
                        <span>R{walletBalance.total_balance.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-center">
                      Last updated {formatDistanceToNow(new Date(walletBalance.last_updated))} ago
                    </div>
                  </CardContent>
                </Card>

                {/* Top Up Wallet */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Up Wallet</CardTitle>
                    <CardDescription>Add money to your wallet for faster payments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 250, 500].map((amount) => (
                        <Button 
                          key={amount}
                          variant="outline" 
                          onClick={() => navigate(`/payment-processing?context=topup&amount=${amount}`)}
                        >
                          R{amount}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="custom-amount">Custom Amount</Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-amount"
                          type="number"
                          placeholder="Enter amount"
                          min="10"
                          max="10000"
                        />
                        <Button>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">No fees for wallet top-ups</p>
                          <p>Use your wallet balance for faster checkout</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Transaction History</h2>
                <p className="text-muted-foreground">View all your payment transactions</p>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {getStatusIcon(transaction.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{transaction.description}</h3>
                            <Badge variant={
                              transaction.status === 'completed' ? 'default' :
                              transaction.status === 'pending' ? 'secondary' :
                              transaction.status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{transaction.reference}</span>
                            <span>{formatDistanceToNow(new Date(transaction.created_at))} ago</span>
                            {transaction.payment_method && (
                              <span>{transaction.payment_method.display_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          R{transaction.amount.toFixed(2)}
                        </div>
                        {transaction.fees.total_fees > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Fees: R{transaction.fees.total_fees.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {transaction.failure_reason && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Failure Reason</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">{transaction.failure_reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Preferences</CardTitle>
                <CardDescription>Configure your payment settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Preferred Currency</Label>
                  <Select value={settings.preferred_currency} onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, preferred_currency: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZAR">South African Rand (ZAR)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-save">Auto-save Payment Methods</Label>
                    <p className="text-sm text-muted-foreground">Automatically save new payment methods</p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={settings.auto_save_methods}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, auto_save_methods: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require-cvv">Require CVV</Label>
                    <p className="text-sm text-muted-foreground">Always ask for CVV when using saved cards</p>
                  </div>
                  <Switch
                    id="require-cvv"
                    checked={settings.require_cvv}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, require_cvv: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="biometric">Enable Biometric Authentication</Label>
                    <p className="text-sm text-muted-foreground">Use fingerprint or face recognition for payments</p>
                  </div>
                  <Switch
                    id="biometric"
                    checked={settings.enable_biometric}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enable_biometric: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose how you want to be notified about payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-receipts">Email Receipts</Label>
                    <p className="text-sm text-muted-foreground">Receive payment receipts via email</p>
                  </div>
                  <Switch
                    id="email-receipts"
                    checked={settings.email_receipts}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, email_receipts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get payment updates via SMS</p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={settings.sms_notifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, sms_notifications: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Set spending limits and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="spending-limit">Enable Spending Limits</Label>
                    <p className="text-sm text-muted-foreground">Set maximum spending limits for payments</p>
                  </div>
                  <Switch
                    id="spending-limit"
                    checked={settings.spending_limit_enabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, spending_limit_enabled: checked }))
                    }
                  />
                </div>

                {settings.spending_limit_enabled && (
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <div>
                      <Label htmlFor="limit-amount">Limit Amount</Label>
                      <Input
                        id="limit-amount"
                        type="number"
                        value={settings.spending_limit_amount}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          spending_limit_amount: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="limit-period">Period</Label>
                      <Select 
                        value={settings.spending_limit_period} 
                        onValueChange={(value: any) => 
                          setSettings(prev => ({ ...prev, spending_limit_period: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Payment Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle>Add Payment Method</CardTitle>
              <CardDescription>
                Add a new payment method to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Payment Type</Label>
                <RadioGroup 
                  value={newMethod.type} 
                  onValueChange={(value: any) => setNewMethod(prev => ({ ...prev, type: value }))}
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="card" id="card" />
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <Label htmlFor="card">Credit/Debit Card</Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="bank" id="bank" />
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <Label htmlFor="bank">Bank Account</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {newMethod.type === 'card' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="card-number">Card Number</Label>
                    <div className="relative">
                      <Input
                        id="card-number"
                        type={showCardNumber ? 'text' : 'password'}
                        placeholder="1234 5678 9012 3456"
                        value={newMethod.card_number}
                        onChange={(e) => setNewMethod(prev => ({ ...prev, card_number: e.target.value }))}
                        maxLength={19}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowCardNumber(!showCardNumber)}
                      >
                        {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="expiry-month">Expiry Month</Label>
                      <Select value={newMethod.expiry_month} onValueChange={(value) => 
                        setNewMethod(prev => ({ ...prev, expiry_month: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="expiry-year">Expiry Year</Label>
                      <Select value={newMethod.expiry_year} onValueChange={(value) => 
                        setNewMethod(prev => ({ ...prev, expiry_year: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <div className="relative">
                        <Input
                          id="cvv"
                          type={showCvv ? 'text' : 'password'}
                          placeholder="123"
                          value={newMethod.cvv}
                          onChange={(e) => setNewMethod(prev => ({ ...prev, cvv: e.target.value }))}
                          maxLength={4}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowCvv(!showCvv)}
                        >
                          {showCvv ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardholder-name">Cardholder Name</Label>
                    <Input
                      id="cardholder-name"
                      placeholder="John Smith"
                      value={newMethod.cardholder_name}
                      onChange={(e) => setNewMethod(prev => ({ ...prev, cardholder_name: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {newMethod.type === 'bank' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Select value={newMethod.bank_name} onValueChange={(value) => 
                      setNewMethod(prev => ({ ...prev, bank_name: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard Bank">Standard Bank</SelectItem>
                        <SelectItem value="ABSA">ABSA</SelectItem>
                        <SelectItem value="FNB">First National Bank</SelectItem>
                        <SelectItem value="Nedbank">Nedbank</SelectItem>
                        <SelectItem value="Capitec">Capitec Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      placeholder="1234567890"
                      value={newMethod.account_number}
                      onChange={(e) => setNewMethod(prev => ({ ...prev, account_number: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="branch-code">Branch Code</Label>
                      <Input
                        id="branch-code"
                        placeholder="051001"
                        value={newMethod.branch_code}
                        onChange={(e) => setNewMethod(prev => ({ ...prev, branch_code: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="account-type">Account Type</Label>
                      <Select value={newMethod.account_type} onValueChange={(value) => 
                        setNewMethod(prev => ({ ...prev, account_type: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cheque">Cheque Account</SelectItem>
                          <SelectItem value="savings">Savings Account</SelectItem>
                          <SelectItem value="credit">Credit Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Your payment information is secure</p>
                    <p>We use bank-level encryption to protect your payment details.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddMethod(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={addPaymentMethod}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PaymentProcessing;