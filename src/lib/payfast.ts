// PayFast configuration and utilities
export interface PayFastData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  email_address?: string;
  m_payment_id?: string;
  name_first?: string;
  name_last?: string;
  cell_number?: string;
  signature?: string;
}

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
  signatureUrl: string;
}

export const PAYFAST_CONFIG: PayFastConfig = {
  merchantId: import.meta.env.VITE_PAYFAST_MERCHANT_ID || '10004002',
  merchantKey: import.meta.env.VITE_PAYFAST_MERCHANT_KEY || '502c5eb9-8c1e-2adc-d4da-b5b098b4d6b2',
  passphrase: import.meta.env.VITE_PAYFAST_PASSPHRASE || 'jt7NOE43FZPn',
  sandbox: import.meta.env.MODE !== 'production',
  signatureUrl: import.meta.env.VITE_SIGNATURE_URL || 'http://localhost:3001/api/payfast-signature'
};

export const PAYFAST_URLS = {
  sandbox: 'https://sandbox.payfast.co.za/eng/process',
  production: 'https://www.payfast.co.za/eng/process'
};

export class PayFastService {
  private config: PayFastConfig;

  constructor(config: PayFastConfig = PAYFAST_CONFIG) {
    this.config = config;
  }

  async generateSignature(data: Omit<PayFastData, 'signature'>): Promise<string> {
    try {
      const response = await fetch(this.config.signatureUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate signature');
      }

      const result = await response.json();
      return result.signature;
    } catch (error) {
      console.error('Error generating signature:', error);
      throw new Error('Payment signature generation failed');
    }
  }

  async createPayment(paymentData: {
    amount: number;
    itemName: string;
    itemDescription?: string;
    customerEmail?: string;
    customerName?: string;
    customerCell?: string;
    orderId?: string;
  }): Promise<PayFastData> {
    const baseUrl = window.location.origin;
    
    const data: Omit<PayFastData, 'signature'> = {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancelled`,
      notify_url: `${baseUrl}/api/payment-notify`,
      amount: paymentData.amount.toFixed(2),
      item_name: paymentData.itemName,
      item_description: paymentData.itemDescription || paymentData.itemName,
      email_address: paymentData.customerEmail,
      name_first: paymentData.customerName?.split(' ')[0] || '',
      name_last: paymentData.customerName?.split(' ').slice(1).join(' ') || '',
      cell_number: paymentData.customerCell,
      m_payment_id: paymentData.orderId || Date.now().toString(),
      custom_str1: paymentData.orderId,
    };

    const signature = await this.generateSignature(data);

    return {
      ...data,
      signature
    };
  }

  getPaymentUrl(): string {
    return this.config.sandbox ? PAYFAST_URLS.sandbox : PAYFAST_URLS.production;
  }

  redirectToPayment(paymentData: PayFastData): void {
    // Create a form and submit it to PayFast
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.getPaymentUrl();
    form.style.display = 'none';

    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value.toString();
        form.appendChild(input);
      }
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Payment record interface
export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: 'payfast' | 'card' | 'cash';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export const payFastService = new PayFastService();