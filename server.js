import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

const app = express();
const stripe = new Stripe('pk_test_51Rh5koISjXpxVHMtTSZ6Vuenl5Lc5a3TuXReTolFVgS9ZaFSr2gixcGR6Vqmr2n6O0PPAN0lFvLW7b3Q2ojQXklN009xJ9kZBm'); // Replace with your Stripe secret key

app.use(cors());
app.use(express.json());

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
