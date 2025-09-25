export interface Order {
  id: string;
  status: string;
  payment_status: string;
  estimated_delivery?: string;
  shipping_address?: string;
  delivery_instructions?: string;
  phone_number?: string;
  total: number;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    products?: {
      id: string;
      name: string;
      images: string[];
      unit: string;
    };
  }>;
}
