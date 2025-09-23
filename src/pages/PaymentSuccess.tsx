import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Package, ArrowLeft } from "lucide-react";
import { PaymentStatus } from "@/lib/payfast";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Get payment details from URL params
        const paymentId = searchParams.get('pf_payment_id');
        const orderId = searchParams.get('custom_str1');
        const amount = searchParams.get('amount_gross');

        if (!paymentId || !orderId) {
          throw new Error('Missing payment information');
        }

        // Update order status in database
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: PaymentStatus.COMPLETED,
            payment_method: 'payfast',
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .eq('user_id', user.id);

        if (orderError) throw orderError;

        // Create payment record
        try {
          const { error: paymentError } = await (supabase as any)
            .from('payments')
            .insert({
              order_id: orderId,
              user_id: user.id,
              amount: parseFloat(amount || '0'),
              currency: 'ZAR',
              status: PaymentStatus.COMPLETED,
              payment_method: 'payfast',
              transaction_id: paymentId,
              metadata: {
                payfast_payment_id: paymentId,
                payment_date: new Date().toISOString()
              }
            });

          if (paymentError) {
            console.warn('Payment record creation failed:', paymentError);
            // Don't throw error as order is already updated
          }
        } catch (err) {
          console.warn('Payment table not yet deployed:', err);
        }

        // Clear cart
        clearCart();
        setOrderCreated(true);

        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully.",
        });

      } catch (error) {
        console.error('Payment processing error:', error);
        toast({
          title: "Payment Verification Failed",
          description: "Please contact support if your payment was deducted.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [user, searchParams, clearCart, toast, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="flex items-center px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/dashboard')}
            aria-label="Go to dashboard"
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Payment Confirmation</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Success Card */}
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Your payment has been processed successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">
                  Order ID: {searchParams.get('custom_str1')}
                </p>
                <p className="text-sm text-green-700">
                  Amount: R{parseFloat(searchParams.get('amount_gross') || '0').toFixed(2)}
                </p>
                <p className="text-sm text-green-700">
                  Payment ID: {searchParams.get('pf_payment_id')}
                </p>
              </div>

              {orderCreated && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Package className="h-4 w-4" />
                    <p className="text-sm font-medium">Your order is being processed</p>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    You'll receive updates via email and notifications
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => navigate('/order-history')}
                  className="w-full gap-2"
                >
                  <Package className="h-4 w-4" />
                  View Order History
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Order Confirmation</p>
                  <p className="text-xs text-muted-foreground">Check your email for order details</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Farmer Preparation</p>
                  <p className="text-xs text-muted-foreground">Your order will be prepared fresh</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Delivery</p>
                  <p className="text-xs text-muted-foreground">Track your order in real-time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;