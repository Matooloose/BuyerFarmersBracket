import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

export interface ReportData {
  orders: OrderReport[];
  summary: ReportSummary;
  products: ProductReport[];
  farmers: FarmerReport[];
  dateRange: {
    from: string;
    to: string;
  };
}

export interface OrderReport {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
  deliveryAddress: string;
  paymentMethod: string;
  items: OrderItemReport[];
}

export interface OrderItemReport {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  farmName: string;
  category: string;
}

export interface ProductReport {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  totalSold: number;
  revenue: number;
  farmName: string;
  isOrganic: boolean;
}

export interface FarmerReport {
  id: string;
  name: string;
  email: string;
  farmName: string;
  totalProducts: number;
  totalSales: number;
  revenue: number;
  rating: number;
  joinDate: string;
}

export interface ReportSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalFarmers: number;
  averageOrderValue: number;
  topSellingProduct: string;
  topFarmer: string;
  ordersByStatus: Record<string, number>;
  revenueByCategory: Record<string, number>;
  salesTrend: Array<{ date: string; orders: number; revenue: number }>;
}

export class ReportGenerator {
  async fetchReportData(dateFrom: string, dateTo: string, userId?: string): Promise<ReportData> {
    try {
      // Fetch orders data
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          user_id,
          delivery_address,
          payment_method,
          profiles!orders_user_id_fkey(
            first_name,
            last_name,
            email
          ),
          order_items(
            id,
            quantity,
            unit_price,
            products(
              name,
              category,
              farms(name)
            )
          )
        `)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .order('created_at', { ascending: false });

      if (userId) {
        ordersQuery = ordersQuery.eq('user_id', userId);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;

      // Fetch products data
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          price,
          quantity,
          is_organic,
          farms(name),
          order_items(
            quantity,
            unit_price,
            orders!inner(
              created_at,
              status
            )
          )
        `);

      if (productsError) throw productsError;

      // Fetch farmers data
      const { data: farmersData, error: farmersError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          created_at,
          farms(
            name,
            products(
              id,
              order_items(
                quantity,
                unit_price,
                orders!inner(
                  created_at,
                  status
                )
              )
            )
          )
        `)
        .eq('user_roles.role', 'farmer');

      if (farmersError) throw farmersError;

      // Transform and process data
      const orders = this.transformOrdersData(ordersData || []);
      const products = this.transformProductsData(productsData || []);
      const farmers = this.transformFarmersData(farmersData || []);
      const summary = this.generateSummary(orders, products, farmers);

      return {
        orders,
        products,
        farmers,
        summary,
        dateRange: { from: dateFrom, to: dateTo }
      };
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw new Error('Failed to fetch report data');
    }
  }

  private transformOrdersData(ordersData: any[]): OrderReport[] {
    return ordersData.map(order => ({
      id: order.id,
      orderNumber: `ORD${order.id.slice(-6).toUpperCase()}`,
      customerName: `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim(),
      customerEmail: order.profiles?.email || '',
      status: order.status,
      total: order.total,
      itemCount: order.order_items?.length || 0,
      createdAt: order.created_at,
      deliveryAddress: order.delivery_address || '',
      paymentMethod: order.payment_method || 'Unknown',
      items: (order.order_items || []).map((item: any) => ({
        productName: item.products?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.quantity * item.unit_price,
        farmName: item.products?.farms?.name || 'Unknown Farm',
        category: item.products?.category || 'Unknown'
      }))
    }));
  }

  private transformProductsData(productsData: any[]): ProductReport[] {
    return productsData.map(product => {
      const totalSold = (product.order_items || [])
        .filter((item: any) => item.orders?.status === 'delivered')
        .reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      const revenue = (product.order_items || [])
        .filter((item: any) => item.orders?.status === 'delivered')
        .reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.quantity,
        totalSold,
        revenue,
        farmName: product.farms?.name || 'Unknown Farm',
        isOrganic: product.is_organic
      };
    });
  }

  private transformFarmersData(farmersData: any[]): FarmerReport[] {
    return farmersData.map(farmer => {
      const products = farmer.farms?.products || [];
      const totalProducts = products.length;
      
      let totalSales = 0;
      let revenue = 0;
      
      products.forEach((product: any) => {
        const productSales = (product.order_items || [])
          .filter((item: any) => item.orders?.status === 'delivered')
          .reduce((sum: number, item: any) => sum + item.quantity, 0);
        
        const productRevenue = (product.order_items || [])
          .filter((item: any) => item.orders?.status === 'delivered')
          .reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
        
        totalSales += productSales;
        revenue += productRevenue;
      });

      return {
        id: farmer.id,
        name: `${farmer.first_name || ''} ${farmer.last_name || ''}`.trim(),
        email: farmer.email,
        farmName: farmer.farms?.name || 'Unknown Farm',
        totalProducts,
        totalSales,
        revenue,
        rating: this.calculateFarmerRating(totalSales, revenue, totalProducts),
        joinDate: farmer.created_at
      };
    });
  }

  private calculateFarmerRating(totalSales: number, revenue: number, totalProducts: number): number {
    // Calculate a simple rating based on performance metrics
    const salesScore = Math.min(totalSales / 10, 1); // Up to 1 point for sales (normalized)
    const revenueScore = Math.min(revenue / 1000, 1); // Up to 1 point for revenue (normalized)
    const productScore = Math.min(totalProducts / 5, 1); // Up to 1 point for product variety
    
    // Base rating starts at 3, with bonuses for performance
    const baseRating = 3.0;
    const bonusRating = (salesScore + revenueScore + productScore) * 2; // Up to 2 bonus points
    
    return Math.min(Math.round((baseRating + bonusRating) * 10) / 10, 5.0); // Round to 1 decimal, max 5.0
  }

  private generateSummary(orders: OrderReport[], products: ProductReport[], farmers: FarmerReport[]): ReportSummary {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalCustomers = new Set(orders.map(order => order.customerEmail)).size;
    const totalProducts = products.length;
    const totalFarmers = farmers.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Order status breakdown
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Revenue by category
    const revenueByCategory = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + product.revenue;
      return acc;
    }, {} as Record<string, number>);

    // Top selling product
    const topSellingProduct = products.reduce((top, product) => 
      product.totalSold > (top?.totalSold || 0) ? product : top, products[0])?.name || 'N/A';

    // Top farmer by revenue
    const topFarmer = farmers.reduce((top, farmer) => 
      farmer.revenue > (top?.revenue || 0) ? farmer : top, farmers[0])?.name || 'N/A';

    // Sales trend (grouped by day)
    const salesTrend = this.generateSalesTrend(orders);

    return {
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      totalFarmers,
      averageOrderValue,
      topSellingProduct,
      topFarmer,
      ordersByStatus,
      revenueByCategory,
      salesTrend
    };
  }

  private generateSalesTrend(orders: OrderReport[]): Array<{ date: string; orders: number; revenue: number }> {
    const dailyData = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { orders: 0, revenue: 0 };
      }
      acc[date].orders += 1;
      acc[date].revenue += order.total;
      return acc;
    }, {} as Record<string, { orders: number; revenue: number }>);

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async generatePDFReport(data: ReportData, reportType: 'summary' | 'detailed' | 'orders' | 'products' | 'farmers'): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text('FarmersBracket Report', margin, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 40);
    doc.text(`Period: ${new Date(data.dateRange.from).toLocaleDateString()} - ${new Date(data.dateRange.to).toLocaleDateString()}`, margin, 50);

    let yPos = 70;

    if (reportType === 'summary' || reportType === 'detailed') {
      // Summary Section
      doc.setFontSize(16);
      doc.setTextColor(40, 44, 52);
      doc.text('Executive Summary', margin, yPos);
      yPos += 10;

      const summaryData = [
        ['Total Orders', data.summary.totalOrders.toString()],
        ['Total Revenue', `R ${data.summary.totalRevenue.toFixed(2)}`],
        ['Total Customers', data.summary.totalCustomers.toString()],
        ['Total Products', data.summary.totalProducts.toString()],
        ['Total Farmers', data.summary.totalFarmers.toString()],
        ['Average Order Value', `R ${data.summary.averageOrderValue.toFixed(2)}`],
        ['Top Product', data.summary.topSellingProduct],
        ['Top Farmer', data.summary.topFarmer]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: margin, right: margin }
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;
    }

    if (reportType === 'orders' || reportType === 'detailed') {
      // Orders Section
      if (yPos > 200) {
        doc.addPage();
        yPos = 30;
      }

      doc.setFontSize(16);
      doc.text('Orders Report', margin, yPos);
      yPos += 10;

      const ordersData = data.orders.map(order => [
        order.orderNumber,
        order.customerName,
        order.status,
        `R ${order.total.toFixed(2)}`,
        order.itemCount.toString(),
        new Date(order.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Order #', 'Customer', 'Status', 'Total', 'Items', 'Date']],
        body: ordersData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;
    }

    if (reportType === 'products' || reportType === 'detailed') {
      // Products Section
      if (yPos > 200) {
        doc.addPage();
        yPos = 30;
      }

      doc.setFontSize(16);
      doc.text('Products Report', margin, yPos);
      yPos += 10;

      const productsData = data.products.map(product => [
        product.name,
        product.category,
        `R ${product.price.toFixed(2)}`,
        product.stock.toString(),
        product.totalSold.toString(),
        `R ${product.revenue.toFixed(2)}`,
        product.farmName
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Product', 'Category', 'Price', 'Stock', 'Sold', 'Revenue', 'Farm']],
        body: productsData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;
    }

    if (reportType === 'farmers' || reportType === 'detailed') {
      // Farmers Section
      if (yPos > 200) {
        doc.addPage();
        yPos = 30;
      }

      doc.setFontSize(16);
      doc.text('Farmers Report', margin, yPos);
      yPos += 10;

      const farmersData = data.farmers.map(farmer => [
        farmer.name,
        farmer.farmName,
        farmer.totalProducts.toString(),
        farmer.totalSales.toString(),
        `R ${farmer.revenue.toFixed(2)}`,
        farmer.rating.toFixed(1),
        new Date(farmer.joinDate).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Farmer', 'Farm', 'Products', 'Sales', 'Revenue', 'Rating', 'Joined']],
        body: farmersData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 }
      });
    }

    // Save the PDF
    const fileName = `farmerbracket-${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  async generateExcelReport(data: ReportData): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Orders', data.summary.totalOrders],
      ['Total Revenue', data.summary.totalRevenue],
      ['Total Customers', data.summary.totalCustomers],
      ['Total Products', data.summary.totalProducts],
      ['Total Farmers', data.summary.totalFarmers],
      ['Average Order Value', data.summary.averageOrderValue],
      ['Top Product', data.summary.topSellingProduct],
      ['Top Farmer', data.summary.topFarmer],
      [],
      ['Orders by Status'],
      ...Object.entries(data.summary.ordersByStatus).map(([status, count]) => [status, count]),
      [],
      ['Revenue by Category'],
      ...Object.entries(data.summary.revenueByCategory).map(([category, revenue]) => [category, revenue])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Orders sheet
    const ordersData = [
      ['Order ID', 'Order Number', 'Customer Name', 'Customer Email', 'Status', 'Total', 'Items', 'Created At', 'Payment Method', 'Delivery Address'],
      ...data.orders.map(order => [
        order.id,
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.status,
        order.total,
        order.itemCount,
        order.createdAt,
        order.paymentMethod,
        order.deliveryAddress
      ])
    ];

    const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');

    // Order Items sheet
    const orderItemsData = [
      ['Order Number', 'Product Name', 'Quantity', 'Unit Price', 'Total', 'Farm Name', 'Category'],
      ...data.orders.flatMap(order => 
        order.items.map(item => [
          order.orderNumber,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.total,
          item.farmName,
          item.category
        ])
      )
    ];

    const orderItemsSheet = XLSX.utils.aoa_to_sheet(orderItemsData);
    XLSX.utils.book_append_sheet(workbook, orderItemsSheet, 'Order Items');

    // Products sheet
    const productsData = [
      ['Product ID', 'Name', 'Category', 'Price', 'Stock', 'Total Sold', 'Revenue', 'Farm Name', 'Organic'],
      ...data.products.map(product => [
        product.id,
        product.name,
        product.category,
        product.price,
        product.stock,
        product.totalSold,
        product.revenue,
        product.farmName,
        product.isOrganic ? 'Yes' : 'No'
      ])
    ];

    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

    // Farmers sheet
    const farmersData = [
      ['Farmer ID', 'Name', 'Email', 'Farm Name', 'Total Products', 'Total Sales', 'Revenue', 'Rating', 'Join Date'],
      ...data.farmers.map(farmer => [
        farmer.id,
        farmer.name,
        farmer.email,
        farmer.farmName,
        farmer.totalProducts,
        farmer.totalSales,
        farmer.revenue,
        farmer.rating,
        farmer.joinDate
      ])
    ];

    const farmersSheet = XLSX.utils.aoa_to_sheet(farmersData);
    XLSX.utils.book_append_sheet(workbook, farmersSheet, 'Farmers');

    // Sales Trend sheet
    const salesTrendData = [
      ['Date', 'Orders', 'Revenue'],
      ...data.summary.salesTrend.map(trend => [
        trend.date,
        trend.orders,
        trend.revenue
      ])
    ];

    const salesTrendSheet = XLSX.utils.aoa_to_sheet(salesTrendData);
    XLSX.utils.book_append_sheet(workbook, salesTrendSheet, 'Sales Trend');

    // Generate and save Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileName = `farmerbracket-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  async generateCSVReport(data: ReportData, reportType: 'orders' | 'products' | 'farmers'): Promise<void> {
    let csvData: any[] = [];
    let fileName = '';

    switch (reportType) {
      case 'orders':
        csvData = [
          ['Order ID', 'Order Number', 'Customer Name', 'Customer Email', 'Status', 'Total', 'Items', 'Created At', 'Payment Method'],
          ...data.orders.map(order => [
            order.id,
            order.orderNumber,
            order.customerName,
            order.customerEmail,
            order.status,
            order.total,
            order.itemCount,
            order.createdAt,
            order.paymentMethod
          ])
        ];
        fileName = `farmerbracket-orders-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'products':
        csvData = [
          ['Product ID', 'Name', 'Category', 'Price', 'Stock', 'Total Sold', 'Revenue', 'Farm Name', 'Organic'],
          ...data.products.map(product => [
            product.id,
            product.name,
            product.category,
            product.price,
            product.stock,
            product.totalSold,
            product.revenue,
            product.farmName,
            product.isOrganic ? 'Yes' : 'No'
          ])
        ];
        fileName = `farmerbracket-products-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'farmers':
        csvData = [
          ['Farmer ID', 'Name', 'Email', 'Farm Name', 'Total Products', 'Total Sales', 'Revenue', 'Rating', 'Join Date'],
          ...data.farmers.map(farmer => [
            farmer.id,
            farmer.name,
            farmer.email,
            farmer.farmName,
            farmer.totalProducts,
            farmer.totalSales,
            farmer.revenue,
            farmer.rating,
            farmer.joinDate
          ])
        ];
        fileName = `farmerbracket-farmers-${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(csvData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, fileName);
  }
}

export const reportGenerator = new ReportGenerator();