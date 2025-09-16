import { useState } from "react";
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
import AvailableFarms from "@/components/AvailableFarms";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const bottomNavItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Package, label: "Track", path: "/track-order" },
    
    { icon: Search, label: "Browse", path: "/browse-products" },
  ];

  return (
    <div className="min-h-screen bg-background">
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
                  {/* Profile Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Profile</h3>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => handleNavigation('/profile')}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Update Profile
                    </Button>
                  </div>

                  <Separator />

                  {/* Settings Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Settings</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <Label htmlFor="dark-mode">Dark Mode</Label>
                      </div>
                      <Switch
                        id="dark-mode"
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-4 w-4" />
                        <Label htmlFor="notifications">Notifications</Label>
                      </div>
                      <Switch
                        id="notifications"
                        checked={notifications}
                        onCheckedChange={setNotifications}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Logout */}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
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
      <main className="p-4 pb-20 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
          <CardHeader>
            <CardTitle>Welcome to FarmersBracket!</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Discover fresh produce from local farms
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Available Farms */}
        <AvailableFarms />

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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center px-3 py-2 h-auto"
              onClick={() => handleNavigation(item.path)}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;