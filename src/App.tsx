import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { AppStateProvider } from "./contexts/AppStateContext";

// Pages
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import TrackOrder from "./pages/TrackOrder";

import BrowseProducts from "./pages/BrowseProducts";
import Checkout from "./pages/Checkout";
import UpdateProfile from "./pages/UpdateProfile";
import Subscriptions from "./pages/Subscriptions";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import FarmerProfile from "./pages/FarmerProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppStateProvider>
          <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
               <Route path="/home" element={<Dashboard />} />
               <Route path="/" element={<Dashboard />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/browse-products" element={<BrowseProducts />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<UpdateProfile />} />
              <Route path="/update-profile" element={<UpdateProfile />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/farmer/:id" element={<FarmerProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </CartProvider>
        </AppStateProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;