import { loadStripe, Stripe } from '@stripe/stripe-js';
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51Rh5koISjXpxVHMtTSZ6Vuenl5Lc5a3TuXReTolFVgS9ZaFSr2gixcGR6Vqmr2n6O0PPAN0lFvLW7b3Q2ojQXklN009xJ9kZBm';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Confirm payment with client secret from backend
export async function confirmStripePayment(clientSecret: string) {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe failed to load');
  const result = await stripe.confirmCardPayment(clientSecret);
  return result;
}

// Example: Call your backend to create a payment intent
export async function createPaymentIntent(amount: number, currency: string = 'usd') {
  const response = await fetch('http://localhost:5000/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency }),
  });
  if (!response.ok) throw new Error('Failed to create payment intent');
  return response.json(); // { clientSecret }
}
