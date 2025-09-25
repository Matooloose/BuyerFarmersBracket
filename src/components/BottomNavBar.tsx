import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Package, CheckCircle, Truck, Clock, Home, ShoppingCart, MessageCircle, Search } from "lucide-react";

const bottomNavItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: ShoppingCart, label: "Cart", path: "/cart" },
  { icon: Package, label: "Track", path: "/track-order" },
  { icon: Search, label: "Browse", path: "/browse-products" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
];

const undeliveredStatuses = [
  "pending", "processing", "shipped", "out_for_delivery", "preparing", "ready", "confirmed"
];

function getStatusProgress(status: string) {
  switch (status?.toLowerCase()) {
    case "pending": return 25;
    case "confirmed": case "processing": return 50;
    case "preparing": case "ready": return 75;
    case "out_for_delivery": case "shipped": return 90;
    case "delivered": return 100;
    case "cancelled": return 0;
    default: return 25;
  }
}
function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "delivered": return "bg-green-500";
    case "cancelled": return "bg-red-500";
    case "out_for_delivery": case "shipped": return "bg-blue-500";
    case "processing": case "preparing": return "bg-yellow-500";
    default: return "bg-gray-500";
  }
}
function getStatusIconTrack(status: string) {
  switch (status?.toLowerCase()) {
    case "delivered": return CheckCircle;
    case "out_for_delivery": case "shipped": return Truck;
    case "processing": case "preparing": return Package;
    default: return Clock;
  }
}

const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTotalItems } = useCart();
  const [trackOrdersOpen, setTrackOrdersOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (trackOrdersOpen && user?.id) {
      setOrdersLoading(true);
      import("@/integrations/supabase/client").then(({ supabase }) => {
        supabase
          .from("orders")
          .select("id, status, total, created_at, order_items (products (name, images)), payment_status, shipping_address")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            setOrders(data || []);
            setOrdersLoading(false);
          });
      });
    }
  }, [trackOrdersOpen, user]);

  const undeliveredOrders = orders.filter(order => undeliveredStatuses.includes(order.status));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong safe-area-bottom-nav" role="navigation" aria-label="Main navigation">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map(item => {
            const isActive = window.location.pathname === item.path;
            if (item.label === "Track") {
              return (
                <Button
                  key={item.path}
                  variant={trackOrdersOpen ? "default" : isActive ? "default" : "ghost"}
                  size="sm"
                  className={`flex flex-col items-center px-3 py-2 h-auto ${trackOrdersOpen || isActive ? "text-primary font-bold bg-green-500/30" : "text-muted-foreground"}`}
                  onClick={() => setTrackOrdersOpen(true)}
                  aria-label="Track Orders"
                >
                  <div className="relative">
                    <item.icon className="h-5 w-5 mb-1" />
                  </div>
                  <span className="text-xs">Track</span>
                </Button>
              );
            }
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`flex flex-col items-center px-3 py-2 h-auto ${isActive ? "text-primary font-bold bg-green-500/30" : "text-muted-foreground"}`}
                onClick={() => navigate(item.path)}
                aria-label={`Navigate to ${item.label}`}
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
            );
          })}
        </div>
      </nav>
      <Dialog open={trackOrdersOpen} onOpenChange={setTrackOrdersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Track Orders</DialogTitle>
            <DialogDescription>View and track your undelivered orders</DialogDescription>
          </DialogHeader>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : undeliveredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No undelivered orders to track.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {undeliveredOrders.map(order => {
                const StatusIcon = getStatusIconTrack(order.status);
                return (
                  <div key={order.id} className="bg-card rounded-lg shadow p-4 flex items-center gap-4">
                    <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}> <StatusIcon className="h-6 w-6 text-white" /> </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">Order #{order.id.slice(0,8)}</h3>
                      <p className="text-sm text-muted-foreground">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                      <Progress value={getStatusProgress(order.status)} className="h-1 mt-2" />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setTrackOrdersOpen(false); navigate(`/track-order?orderId=${order.id}`); }}>View Details</Button>
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackOrdersOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BottomNavBar;
