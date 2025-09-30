import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Replace with your sandbox credentials
const PAYFAST_MERCHANT_ID = '10000100';
const PAYFAST_MERCHANT_KEY = '46f0cd694581a';
const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';

// PayFast payment URL generation endpoint
app.post('/payfast-url', (req, res) => {
  const { amount, item_name, return_url, cancel_url, notify_url } = req.body;
  const params = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    amount,
    item_name,
    return_url,
    cancel_url,
    notify_url,
  };
  const query = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&');
  const paymentUrl = `${PAYFAST_SANDBOX_URL}?${query}`;
  res.json({ url: paymentUrl });
});

// PayFast ITN webhook endpoint
app.post('/payfast-webhook', (req, res) => {
  console.log('PayFast ITN received:', req.body);
  if (req.body.payment_status === 'COMPLETE') {
    console.log('Payment completed for:', req.body.pf_payment_id);
  }
  res.status(200).send('OK');
});

// Mock PayFast initiate endpoint
app.post('/api/payfast-initiate', (req, res) => {
  res.json({
    success: true,
    message: 'Mock PayFast payment initiated successfully.',
    paymentUrl: 'https://sandbox.payfast.co.za/mock-payment',
    transactionId: 'MOCK1234567890'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PayFast server running on port ${PORT}`);
});
