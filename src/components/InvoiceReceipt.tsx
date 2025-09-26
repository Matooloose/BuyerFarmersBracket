import React from 'react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface InvoiceReceiptProps {
  order: {
    id: string;
    created_at: string;
    user_id: string;
    shipping_address: string | null;
    payment_method: string | null;
    payment_status: string;
    total: number;
    order_items: Array<{
      id: string;
      product_id: string;
      quantity: number;
      unit_price: number;
      product: {
        name: string;
      };
    }>;
  };
  user?: {
    name?: string;
    email?: string;
  };
}

const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({ order, user }) => {
  return (
    <div className="max-w-2xl mx-auto bg-white border rounded-lg shadow-lg p-8 print:p-0 print:shadow-none print:border-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">INVOICE</h1>
          <p className="text-sm text-muted-foreground">FarmersBracket</p>
        </div>
        <div className="text-right">
          <p className="text-xs">Date: {format(new Date(order.created_at), 'yyyy-MM-dd')}</p>
          <p className="text-xs">Invoice #: {order.id.slice(0,8)}</p>
        </div>
      </div>
      <Separator />
      {/* Seller/Buyer Info */}
      <div className="flex justify-between mt-6 mb-6">
        <div>
          <h2 className="font-semibold text-sm mb-1">Seller</h2>
          <p className="text-xs">FarmersBracket</p>
          <p className="text-xs">support@farmersbracket.com</p>
        </div>
        <div>
          <h2 className="font-semibold text-sm mb-1">Buyer</h2>
          <p className="text-xs">{user?.name || 'Customer'}</p>
          <p className="text-xs">{user?.email || ''}</p>
        </div>
      </div>
      <Separator />
      {/* Shipping Info */}
      <div className="mt-6 mb-6">
        <h2 className="font-semibold text-sm mb-1">Shipping Address</h2>
        <p className="text-xs">{order.shipping_address || 'N/A'}</p>
      </div>
      <Separator />
      {/* Items Table */}
      <div className="mt-6 mb-6">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{item.product.name}</td>
                <td className="p-2 text-right">{item.quantity}</td>
                <td className="p-2 text-right">R{item.unit_price.toFixed(2)}</td>
                <td className="p-2 text-right">R{(item.unit_price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Separator />
      {/* Payment Summary */}
      <div className="mt-6 mb-6 flex justify-end">
        <table className="text-xs">
          <tbody>
            <tr>
              <td className="pr-4">Subtotal:</td>
              <td className="text-right">R{order.total.toFixed(2)}</td>
            </tr>
            {/* Add tax/discount rows here if needed */}
            <tr>
              <td className="pr-4 font-bold">Grand Total:</td>
              <td className="text-right font-bold">R{order.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Separator />
      {/* Payment Method/Status */}
      <div className="mt-6 mb-6">
        <p className="text-xs">Payment Method: <span className="font-semibold">{order.payment_method || 'N/A'}</span></p>
        <p className="text-xs">Payment Status: <span className="font-semibold capitalize">{order.payment_status}</span></p>
      </div>
      <Separator />
      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>Thank you for shopping with FarmersBracket!</p>
        <p>For support, contact support@farmersbracket.com</p>
      </div>
    </div>
  );
};

export default InvoiceReceipt;
