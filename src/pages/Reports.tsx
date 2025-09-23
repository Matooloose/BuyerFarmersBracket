import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ReportService, { 
  ReportFilter, 
  OrderReportData, 
  SalesReportData, 
  ProductReportData 
} from '@/lib/reportService';
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Package,
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';

const Reports: React.FC = () => {
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: '',
    endDate: '',
    status: '',
    category: ''
  });
  
  // Data
  const [orderData, setOrderData] = useState<OrderReportData[]>([]);
  const [salesData, setSalesData] = useState<SalesReportData[]>([]);
  const [productData, setProductData] = useState<ProductReportData[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    activeFarmers: 0
  });

  useEffect(() => {
    loadReportData();
  }, [activeTab, filters]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'orders':
          const orders = await ReportService.generateOrderReport(filters);
          setOrderData(orders);
          setStats(prev => ({
            ...prev,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.total, 0)
          }));
          break;
        case 'sales':
          const sales = await ReportService.generateSalesReport(filters);
          setSalesData(sales);
          setStats(prev => ({
            ...prev,
            activeFarmers: sales.length,
            totalRevenue: sales.reduce((sum, sale) => sum + sale.totalRevenue, 0)
          }));
          break;
        case 'products':
          const products = await ReportService.generateProductReport(filters);
          setProductData(products);
          setStats(prev => ({
            ...prev,
            totalProducts: products.length
          }));
          break;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    try {
      switch (activeTab) {
        case 'orders':
          ReportService.generateOrderPDF(orderData, 'Order Report');
          break;
        case 'sales':
          ReportService.generateSalesPDF(salesData, 'Sales Report');
          break;
        case 'products':
          // We'll create a simple PDF for products
          ReportService.generateOrderPDF(
            productData.map(p => ({
              id: p.id,
              orderNumber: p.name,
              customerName: p.farmerName,
              customerEmail: p.category,
              farmerName: p.isOrganic ? 'Organic' : 'Regular',
              total: p.price,
              status: p.quantityInStock > 0 ? 'In Stock' : 'Out of Stock',
              itemCount: p.quantitySold,
              createdAt: new Date().toISOString(),
              items: []
            })),
            'Product Report'
          );
          break;
      }
      toast({
        title: 'Success',
        description: 'PDF report downloaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        variant: 'destructive'
      });
    }
  };

  const exportExcel = () => {
    try {
      switch (activeTab) {
        case 'orders':
          ReportService.generateOrderExcel(orderData, 'order-report');
          break;
        case 'sales':
          ReportService.generateSalesExcel(salesData, 'sales-report');
          break;
        case 'products':
          // Generate Excel for products using order format
          ReportService.generateOrderExcel(
            productData.map(p => ({
              id: p.id,
              orderNumber: p.name,
              customerName: p.farmerName,
              customerEmail: p.category,
              farmerName: p.isOrganic ? 'Organic' : 'Regular',
              total: p.price,
              status: p.quantityInStock > 0 ? 'In Stock' : 'Out of Stock',
              itemCount: p.quantitySold,
              createdAt: new Date().toISOString(),
              items: []
            })),
            'product-report'
          );
          break;
      }
      toast({
        title: 'Success',
        description: 'Excel report downloaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate Excel report',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-green-600" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Generate comprehensive reports and analytics for your marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPDF} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={exportExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">R{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Farmers</p>
                <p className="text-2xl font-bold">{stats.activeFarmers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="herbs">Herbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Orders Report</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="products">Products Report</TabsTrigger>
        </TabsList>

        {/* Orders Report */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders Report</CardTitle>
              <CardDescription>
                Detailed view of all orders with customer and product information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : orderData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Order #</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Items</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.map(order => (
                        <tr key={order.id}>
                          <td className="border border-gray-300 px-4 py-2">{order.orderNumber}</td>
                          <td className="border border-gray-300 px-4 py-2">{order.customerName}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{order.itemCount}</td>
                          <td className="border border-gray-300 px-4 py-2">R{order.total.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No orders found for the selected filters.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Report */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
              <CardDescription>
                Sales performance by farmer with top products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading sales data...</div>
              ) : salesData.length > 0 ? (
                <div className="space-y-6">
                  {salesData.map(sale => (
                    <div key={sale.farmerId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{sale.farmerName}</h3>
                          <p className="text-gray-600">Farmer ID: {sale.farmerId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            R{sale.totalRevenue.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {sale.totalOrders} orders
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Orders</p>
                          <p className="text-xl font-semibold">{sale.totalOrders}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                          <p className="text-xl font-semibold">R{sale.averageOrderValue.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Top Product</p>
                          <p className="text-xl font-semibold">{sale.topProducts[0]?.name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {sale.topProducts.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Top Products</h4>
                          <div className="space-y-1">
                            {sale.topProducts.slice(0, 3).map((product, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{product.name}</span>
                                <span>{product.quantitySold} sold • R{product.revenue.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No sales data found for the selected filters.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Report */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products Report</CardTitle>
              <CardDescription>
                Product performance with inventory and sales metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : productData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Farmer</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">In Stock</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Sold</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Revenue</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productData.map(product => (
                        <tr key={product.id}>
                          <td className="border border-gray-300 px-4 py-2 font-medium">{product.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{product.category}</td>
                          <td className="border border-gray-300 px-4 py-2">{product.farmerName}</td>
                          <td className="border border-gray-300 px-4 py-2">R{product.price.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2">{product.quantityInStock}</td>
                          <td className="border border-gray-300 px-4 py-2">{product.quantitySold}</td>
                          <td className="border border-gray-300 px-4 py-2">R{product.revenue.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <div className="flex gap-1">
                              {product.isOrganic && <Badge variant="outline">Organic</Badge>}
                              {product.isFeatured && <Badge variant="default">Featured</Badge>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No products found for the selected filters.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;