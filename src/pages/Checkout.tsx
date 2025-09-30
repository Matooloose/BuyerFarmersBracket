import React, { useState, useEffect } from "react";
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ErrorBoundary from "../components/ErrorBoundary";

const Checkout = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    email: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('payfast');
  const [showCardFields, setShowCardFields] = useState(false);
  const cartTotal = 100; // Replace with your cart logic
  const deliveryFee = 30; // Replace with your delivery fee logic
  const totalWithDelivery = cartTotal + deliveryFee;
  const paymentMethods = [
    { value: "payfast", label: "PayFast" },
    { value: "card", label: "Card" },
    { value: "cash", label: "Cash on Delivery" },
  ];

  useEffect(() => {
    setShowCardFields(selectedPaymentMethod === 'card');
  }, [selectedPaymentMethod]);

  // Removed duplicate deep link listener. Now handled globally in App.tsx.

  const validateCheckout = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName) errors.fullName = "Full name is required.";
    if (!formData.phoneNumber) errors.phoneNumber = "Phone number is required.";
    if (!formData.address) errors.address = "Delivery address is required.";
    if (!formData.email) errors.email = "Email is required.";
    return errors;
  };

  // Modal/iframe removed: PayFast blocks iframe embedding

  const handleCheckout = async () => {
    setIsProcessing(true);
    const errors = validateCheckout();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setIsProcessing(false);
      return;
    }
    if (selectedPaymentMethod === 'payfast') {
      try {
        // Use deep link redirect for mobile, web route for web
        const isMobile = Capacitor.isNativePlatform();
        const returnUrl = isMobile
          ? 'https://matooloose.github.io/page_for_redirection/index.html'
          : window.location.origin + '/payment-success';
        const payfastRes = await fetch('https://paying-project.onrender.com/payfast-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalWithDelivery,
            item_name: `Order for ${formData.fullName}`,
            return_url: returnUrl,
            cancel_url: window.location.origin + '/payment-cancel',
            notify_url: 'https://paying-project.onrender.com/payfast-webhook',
          }),
        });
        const data = await payfastRes.json();
        setIsProcessing(false);
        // Use Capacitor Browser for mobile, window.open for web
        if (isMobile) {
          await Browser.open({ url: data.url });
        } else {
          window.open(data.url, '_blank');
        }
      } catch (err) {
        setIsProcessing(false);
      }
      return;
    }
    // Add your card/cash logic here
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Card className="w-full max-w-md mx-auto mt-12">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); handleCheckout(); }} className="space-y-4">
            {/* ...existing form fields... */}
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
            {/* Test button for Capacitor Browser */}
            <Button
              type="button"
              className="w-full mt-2 bg-blue-600 text-white"
              onClick={async () => {
                try {
                  await Browser.open({ url: 'https://google.com' });
                } catch (err) {
                  alert('Failed to open Capacitor Browser: ' + err);
                }
              }}
            >
              Test Capacitor Browser (Google)
            </Button>
          </form>
          {/* PayFast Modal removed: PayFast cannot be embedded in iframe. */}
          {/* On web, PayFast opens in a new tab. On mobile, use Capacitor Browser. */}
        </CardContent>
      </Card>
    </div>
  );
};

const WrappedCheckout = () => (
  <ErrorBoundary>
    <Checkout />
  </ErrorBoundary>
);

export default WrappedCheckout;
