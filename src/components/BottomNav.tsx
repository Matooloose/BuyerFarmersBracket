import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ShoppingCart, Package, Search, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: ShoppingCart, label: "Cart", path: "/cart" },
  { icon: Package, label: "Track", path: "/track-order" },
  { icon: Search, label: "Browse", path: "/browse-products" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong z-[100]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            (item.path === "/home" && (location.pathname === "/" || location.pathname === "/home")) ||
            location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={`flex flex-col items-center px-3 py-2 h-auto ${isActive ? "text-green-600" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={`h-5 w-5 mb-1 ${isActive ? "text-green-600" : "text-muted-foreground"}`} />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
