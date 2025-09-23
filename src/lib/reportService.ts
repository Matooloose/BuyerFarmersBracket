import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
  farmerId?: string;
  category?: string;
}

export interface OrderReportData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  farmerName: string;
  total: number;
  status: string;
  itemCount: number;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}

export interface SalesReportData {
  farmerId: string;
  farmerName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: {
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
}

export interface ProductReportData {
  id: string;
  name: string;
  category: string;
  price: number;
  quantityInStock: number;
  quantitySold: number;
  revenue: number;
  farmerName: string;
  isOrganic: boolean;
  isFeatured: boolean;
}

export class ReportService {
  static async generateOrderReport(filters: ReportFilter = {}): Promise<OrderReportData[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey (
            username,
            email
          ),
          order_items (
            quantity,
            price_per_unit,
            products (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Database query error:', error);
        return [];
      }

      return data?.map(order => ({
        id: order.id,
        orderNumber: `ORD-${order.id.slice(0, 8)}`,
        customerName: (order as any).profiles?.username || 'Unknown',
        customerEmail: (order as any).profiles?.email || 'Unknown',
        farmerName: 'Farm', // Will be populated from farms table later
        total: order.total,
        status: order.status,
        itemCount: (order as any).order_items?.length || 0,
        createdAt: order.created_at,
        items: ((order as any).order_items || []).map((item: any) => ({
          productName: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price_per_unit,
          total: item.quantity * item.price_per_unit
        }))
      })) || [];
    } catch (error) {
      console.error('Error generating order report:', error);
      return [];
    }
  }

  static async generateSalesReport(filters: ReportFilter = {}): Promise<SalesReportData[]> {
    try {
      // For now, return mock data until the database schema is fully set up
      return [
        {
          farmerId: 'farm-1',
          farmerName: 'Green Valley Farm',
          totalOrders: 25,
          totalRevenue: 12500,
          averageOrderValue: 500,
          topProducts: [
            { name: 'Organic Tomatoes', quantitySold: 100, revenue: 5000 },
            { name: 'Fresh Lettuce', quantitySold: 80, revenue: 2400 }
          ]
        },
        {
          farmerId: 'farm-2',
          farmerName: 'Sunny Acres Farm',
          totalOrders: 18,
          totalRevenue: 9000,
          averageOrderValue: 500,
          topProducts: [
            { name: 'Free Range Eggs', quantitySold: 60, revenue: 3600 },
            { name: 'Organic Carrots', quantitySold: 45, revenue: 1800 }
          ]
        }
      ];
    } catch (error) {
      console.error('Error generating sales report:', error);
      return [];
    }
  }

  static async generateProductReport(filters: ReportFilter = {}): Promise<ProductReportData[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          farms!products_farmer_id_fkey (
            name
          )
        `);

      if (filters.category) {
        query = query.eq('category', filters.category as any);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Database query error:', error);
        return [];
      }

      return data?.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantityInStock: product.quantity || 0,
        quantitySold: Math.floor(Math.random() * 50), // Mock data for now
        revenue: Math.floor(Math.random() * 5000), // Mock data for now
        farmerName: (product as any).farms?.name || 'Unknown Farm',
        isOrganic: product.is_organic,
        isFeatured: product.is_featured
      })) || [];
    } catch (error) {
      console.error('Error generating product report:', error);
      return [];
    }
  }

  static generateOrderPDF(orders: OrderReportData[], title: string = 'Order Report'): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add summary
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalRevenue / totalOrders || 0;
    
    doc.text(`Total Orders: ${totalOrders}`, 14, 38);
    doc.text(`Total Revenue: R${totalRevenue.toFixed(2)}`, 14, 44);
    doc.text(`Average Order Value: R${avgOrderValue.toFixed(2)}`, 14, 50);

    // Create table
    const tableData = orders.map(order => [
      order.orderNumber,
      order.customerName,
      order.farmerName,
      order.status,
      order.itemCount.toString(),
      `R${order.total.toFixed(2)}`,
      new Date(order.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [['Order #', 'Customer', 'Farmer', 'Status', 'Items', 'Total', 'Date']],
      body: tableData,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static generateSalesPDF(sales: SalesReportData[], title: string = 'Sales Report'): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add summary
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    const totalOrders = sales.reduce((sum, sale) => sum + sale.totalOrders, 0);
    
    doc.text(`Total Revenue: R${totalRevenue.toFixed(2)}`, 14, 38);
    doc.text(`Total Orders: ${totalOrders}`, 14, 44);
    doc.text(`Active Farmers: ${sales.length}`, 14, 50);

    // Create table
    const tableData = sales.map(sale => [
      sale.farmerName,
      sale.totalOrders.toString(),
      `R${sale.totalRevenue.toFixed(2)}`,
      `R${sale.averageOrderValue.toFixed(2)}`,
      sale.topProducts[0]?.name || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Farmer', 'Orders', 'Revenue', 'Avg Order', 'Top Product']],
      body: tableData,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static generateOrderExcel(orders: OrderReportData[], filename: string = 'order-report'): void {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Order Report Summary'],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['Total Orders:', orders.length],
      ['Total Revenue:', `R${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}`],
      ['Average Order Value:', `R${(orders.reduce((sum, order) => sum + order.total, 0) / orders.length || 0).toFixed(2)}`]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Orders sheet
    const ordersData = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer Name': order.customerName,
      'Customer Email': order.customerEmail,
      'Farmer Name': order.farmerName,
      'Status': order.status,
      'Item Count': order.itemCount,
      'Total Amount': order.total,
      'Order Date': new Date(order.createdAt).toLocaleDateString(),
      'Items': order.items.map(item => `${item.productName} (${item.quantity}x R${item.price})`).join('; ')
    }));
    
    const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');
    
    // Order items detail sheet
    const itemsData: any[] = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        itemsData.push({
          'Order Number': order.orderNumber,
          'Customer': order.customerName,
          'Farmer': order.farmerName,
          'Product': item.productName,
          'Quantity': item.quantity,
          'Unit Price': item.price,
          'Line Total': item.total,
          'Order Date': new Date(order.createdAt).toLocaleDateString()
        });
      });
    });
    
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Order Items');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  static generateSalesExcel(sales: SalesReportData[], filename: string = 'sales-report'): void {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    const totalOrders = sales.reduce((sum, sale) => sum + sale.totalOrders, 0);
    
    const summaryData = [
      ['Sales Report Summary'],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['Total Revenue:', `R${totalRevenue.toFixed(2)}`],
      ['Total Orders:', totalOrders],
      ['Active Farmers:', sales.length],
      ['Average Revenue per Farmer:', `R${(totalRevenue / sales.length || 0).toFixed(2)}`]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Sales by farmer sheet
    const salesData = sales.map(sale => ({
      'Farmer Name': sale.farmerName,
      'Total Orders': sale.totalOrders,
      'Total Revenue': sale.totalRevenue,
      'Average Order Value': sale.averageOrderValue,
      'Top Product': sale.topProducts[0]?.name || 'N/A',
      'Top Product Sales': sale.topProducts[0]?.quantitySold || 0,
      'Top Product Revenue': sale.topProducts[0]?.revenue || 0
    }));
    
    const salesSheet = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales by Farmer');
    
    // Top products sheet
    const allProducts = new Map<string, { quantitySold: number; revenue: number; farmers: Set<string> }>();
    
    sales.forEach(sale => {
      sale.topProducts.forEach(product => {
        const existing = allProducts.get(product.name) || { quantitySold: 0, revenue: 0, farmers: new Set() };
        existing.quantitySold += product.quantitySold;
        existing.revenue += product.revenue;
        existing.farmers.add(sale.farmerName);
        allProducts.set(product.name, existing);
      });
    });
    
    const topProductsData = Array.from(allProducts.entries())
      .map(([name, data]) => ({
        'Product Name': name,
        'Total Quantity Sold': data.quantitySold,
        'Total Revenue': data.revenue,
        'Number of Farmers': data.farmers.size,
        'Farmers': Array.from(data.farmers).join(', ')
      }))
      .sort((a, b) => b['Total Revenue'] - a['Total Revenue']);
    
    const topProductsSheet = XLSX.utils.json_to_sheet(topProductsData);
    XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Top Products');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}

export default ReportService;