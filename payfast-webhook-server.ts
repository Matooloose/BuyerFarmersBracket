import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3002;

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PayFast configuration
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || 'jt7NOE43FZPn';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to verify PayFast signature
function verifySignature(data: any, signature: string, passPhrase: string = '') {
  // Create parameter string
  let pfOutput = '';
  for (let key in data) {
    if (data.hasOwnProperty(key) && key !== 'signature' && data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  }
  
  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);
  
  if (passPhrase !== '') {
    pfOutput += `&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, '+')}`;
  }
  
  const calculatedSignature = crypto.createHash('md5').update(pfOutput).digest('hex');
  return calculatedSignature === signature;
}

// PayFast ITN (Instant Transaction Notification) webhook
app.post('/payfast/webhook', async (req, res) => {
  try {
    console.log('PayFast webhook received:', req.body);
    
    const {
      signature,
      payment_status,
      pf_payment_id,
      amount_gross,
      amount_fee,
      amount_net,
      custom_str1, // This should contain our order ID
      custom_str2, // This should contain user ID
      ...otherData
    } = req.body;

    // Verify signature
    if (!verifySignature(req.body, signature, PAYFAST_PASSPHRASE)) {
      console.error('Invalid PayFast webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const orderId = custom_str1;
    const userId = custom_str2;

    if (!orderId || !userId) {
      console.error('Missing order ID or user ID in webhook');
      return res.status(400).send('Missing required data');
    }

    // Update order status based on payment status
    let orderStatus = 'pending';
    let paymentStatusEnum = 'PENDING';

    switch (payment_status) {
      case 'COMPLETE':
        orderStatus = 'confirmed';
        paymentStatusEnum = 'COMPLETED';
        break;
      case 'FAILED':
        orderStatus = 'cancelled';
        paymentStatusEnum = 'FAILED';
        break;
      case 'CANCELLED':
        orderStatus = 'cancelled';
        paymentStatusEnum = 'CANCELLED';
        break;
      default:
        orderStatus = 'pending';
        paymentStatusEnum = 'PENDING';
    }

    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', userId);

    if (orderError) {
      console.error('Failed to update order:', orderError);
      return res.status(500).send('Failed to update order');
    }

    // Create/update payment record
    try {
      const { error: paymentError } = await (supabase as any)
        .from('payments')
        .upsert({
          order_id: orderId,
          user_id: userId,
          amount: parseFloat(amount_gross),
          currency: 'ZAR',
          status: paymentStatusEnum,
          payment_method: 'payfast',
          transaction_id: pf_payment_id,
          metadata: {
            payfast_payment_id: pf_payment_id,
            amount_fee: parseFloat(amount_fee || '0'),
            amount_net: parseFloat(amount_net || '0'),
            payment_status,
            webhook_data: otherData,
            updated_at: new Date().toISOString()
          }
        }, {
          onConflict: 'order_id'
        });

      if (paymentError) {
        console.warn('Failed to create/update payment record:', paymentError);
      }
    } catch (err) {
      console.warn('Payment table not yet deployed:', err);
    }

    console.log(`Order ${orderId} updated with status: ${orderStatus}`);
    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'PayFast Webhook Handler'
  });
});

app.listen(PORT, () => {
  console.log(`PayFast webhook server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;