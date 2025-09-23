import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Menu, 
  Home, 
  ShoppingCart, 
  Package, 
  MessageCircle, 
  Search,
  User,
  Settings,
  Moon,
  Sun,
  LogOut,
  Leaf,
  Bell
} from "lucide-react";
import { NotificationIcon } from "@/components/NotificationIcon";
import BottomNav from "@/components/BottomNav";
import AvailableFarms from "@/components/AvailableFarms";

const Dashboard = () => {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notifications') !== 'false';
    }
    return true;
  });
  // Sync notifications toggle with localStorage
  const handleNotificationsChange = (value: boolean) => {
    setNotifications(value);
    localStorage.setItem('notifications', value ? 'true' : 'false');
    // Optionally, trigger global notification enable/disable logic here
  };
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);


  // Sync dark mode with document and localStorage
  const handleDarkModeChange = (value: boolean) => {
    setDarkMode(value);
    if (value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Ensure theme is applied on mount
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  const handleLogout = async () => {
  await signOut();
  setLogoutDialogOpen(false);
  navigate('/login');
  };

  const bottomNavItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: ShoppingCart, label: "Cart", path: "/cart" },
  { icon: Package, label: "Track", path: "/track-order" },
  { icon: Search, label: "Browse", path: "/browse-products" },
  { icon: User, label: "Profile", path: "/profile" },
];

  return (
  <div className="min-h-screen bg-background overflow-visible">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                      <Leaf className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <SheetTitle className="text-lg">FarmersBracket</SheetTitle>
                      <p className="text-sm text-muted-foreground">shopleft</p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                  {/* Profile Section removed as requested */}

                  {/* Settings, Notifications, and Logout moved to Profile */}
                </div>
              </SheetContent>
            </Sheet>
            
            <div>
              <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back!</p>
            </div>
          </div>

          <NotificationIcon />
        </div>
      </header>

      {/* Main Content */}
  <main className="p-4 pb-20 space-y-6" style={{ marginBottom: 'env(safe-area-inset-bottom, 32px)' }}>
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
          <CardHeader>
            <CardTitle>Welcome to FarmersBracket!</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Discover fresh produce from local farms
            </CardDescription>
          </CardHeader>
        </Card>

                        {/* Search Bar Under App Bar */}
                        <div className="w-full px-4 py-3 bg-background border-b flex items-center gap-2">
                          <Search className="h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search farms, products..."
                            className="w-full p-2 rounded-md border bg-card text-foreground focus:outline-none focus:ring focus:border-primary"
                          />
                        </div>

  {/* Available Farms */}
  <AvailableFarms searchQuery={searchQuery} />

        {/* Blog Posts/Updates */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Farmers Blog & Updates</CardTitle>
            <CardDescription>Latest news, tips, and updates from your favorite farmers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Example blog posts, replace with dynamic fetch if needed */}
              <div className="border rounded p-3">
                <h4 className="font-semibold mb-1">How to Store Fresh Produce</h4>
                <p className="text-sm text-muted-foreground">Learn best practices for keeping your veggies fresh longer.</p>
                <span className="text-xs text-info">Posted by Farmer Joe · 2 days ago</span>
              </div>
              <div className="border rounded p-3">
                <h4 className="font-semibold mb-1">Organic Farming Benefits</h4>
                <p className="text-sm text-muted-foreground">Discover why organic farming is better for you and the planet.</p>
                <span className="text-xs text-info">Posted by Green Acres · 5 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-medium transition-shadow" onClick={() => handleNavigation('/home')}>
            <CardContent className="p-4 text-center">
              <Home className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Browse Products</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-medium transition-shadow" onClick={() => handleNavigation('/cart')}>
            <CardContent className="p-4 text-center">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">View Cart</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-medium transition-shadow" onClick={() => handleNavigation('/track-order')}>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Track Orders</p>
              {/* Track Live Recommendation */}
              <div className="mt-2">
                <span className="block text-xs text-muted-foreground">Track Live:</span>
                <span className="block text-xs text-info">Enable live order tracking with map integration or real-time status updates. <br />Recommended: Integrate Google Maps or show delivery driver location.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-medium transition-shadow" onClick={() => handleNavigation('/subscriptions')}>
            <CardContent className="p-4 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Chat & Support</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Shared Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;