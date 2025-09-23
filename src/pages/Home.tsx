import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "../integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Plus, Home as HomeIcon, ShoppingCart, Package, MessageCircle, Filter, Leaf } from "lucide-react";
import { NotificationIcon } from "@/components/NotificationIcon";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  images: string[];
  is_organic: boolean;
  is_featured: boolean;
  farmer_id: string;
  quantity: number;
}

interface Farm {
  id: string;
  name: string;
  location: string;
  description: string;
  image_url: string;
  farmer_id: string;
  // Removed address property
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, cartItems, getTotalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, description, price, unit, category, images, is_organic, is_featured, farmer_id, quantity')
        .gt('quantity', 0)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch farms
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('id, name, location, description, image_url, farmer_id')
        .order('created_at', { ascending: false });

      if (farmsError) throw farmsError;

      setProducts(productsData || []);
      setFarms(farmsData || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load products and farms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addProductToCart = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Get farm name from database
      let farmName = 'Local Farm';
      try {
        const { data: farm } = await supabase
          .from('farms')
          .select('name')
          .eq('farmer_id', product.farmer_id)
          .single();
        
        if (farm) {
          farmName = farm.name;
        }
      } catch (error) {
        console.error('Error fetching farm name:', error);
      }

      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.images[0],
        farmName,
        category: product.category
      });
      
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart`,
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bottomNavItems = [
    { icon: HomeIcon, label: "Home", path: "/home", active: true },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Package, label: "Track", path: "/track-order" },
    { icon: Search, label: "Browse", path: "/browse-products" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Fresh Market</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Your Location</span>
                </div>
              </div>
            </div>
            <NotificationIcon />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, farms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading fresh products...</p>
          </div>
        ) : (
          <>
            {/* Featured Farms */}
            {farms.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Featured Farms</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {farms.slice(0, 3).map((farm) => (
                    <div
                      key={farm.id}
                      className="inline-block min-w-[240px] max-w-xs bg-card border rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer align-top farm-scroll-card"
                      onClick={() => navigate(`/farmer/${farm.farmer_id}`)}
                    >
                      <div className="w-full h-28 bg-primary/10 rounded-t-lg flex items-center justify-center overflow-hidden">
                        {farm.image_url ? (
                          <img
                            src={farm.image_url}
                            alt={farm.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (

                          <Leaf className="h-10 w-10 text-primary" />
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-lg text-foreground truncate mb-1">{farm.name}</h4>
                        {/* Removed address display */}
                        {farm.location ? (
                          <p className="text-xs text-muted-foreground mb-1"><span className="font-medium">Location:</span> {farm.location}</p>
                        ) : null}
                        <p className="text-sm text-muted-foreground line-clamp-2">{farm.description || "No bio available."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Featured Products */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Fresh Products</h2>
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                      {product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-primary/40" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                            {product.name}
                          </h3>
                          {product.is_organic && (
                            <Badge variant="secondary" className="text-xs">
                              Organic
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-primary">
                              R{product.price}/{product.unit}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.quantity} {product.unit} available
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => addProductToCart(product.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center px-3 py-2 h-auto ${
                item.active ? 'text-primary' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <div className="relative">
                <item.icon className="h-5 w-5 mb-1" />
                {item.label === "Cart" && getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0.5 rounded-full bg-primary text-white">
                    {getTotalItems()}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Home;