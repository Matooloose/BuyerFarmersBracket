import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Leaf, Users, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useAppState } from "@/contexts/AppStateContext";

const Welcome = () => {
  const navigate = useNavigate();
  const { setHasCompletedWelcome } = useAppState();
  const { toast } = useToast();
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  useStatusBar();

  useEffect(() => {
    // Auto-advance after 3 seconds if user does not interact
    if (locationPermission === 'pending' && !autoAdvanced) {
      const timer = setTimeout(() => {
        setAutoAdvanced(true);
        setHasCompletedWelcome(true);
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [locationPermission, autoAdvanced, setHasCompletedWelcome, navigate]);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        toast({
          title: "Location access granted!",
          description: "We'll show you the best farms and products near you",
        });
        // Store location coordinates if needed
        localStorage.setItem('userLocation', JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      },
      (error) => {
        setLocationPermission('denied');
        toast({
          title: "Location access denied",
          description: "You can still browse all products and farms",
          variant: "destructive",
        });
      }
    );
  };

  const continueToApp = () => {
    setHasCompletedWelcome(true);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
            <Leaf className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">FarmersBracket</h1>
            <p className="text-lg text-muted-foreground font-medium">shopleft</p>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="p-6 space-y-6 shadow-medium">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Welcome to Fresh Markets</h2>
            <p className="text-muted-foreground">
              Connect directly with local farmers and get the freshest produce delivered to your door
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">Direct from Farmers</p>
                <p className="text-sm text-muted-foreground">Support local agriculture</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                <Leaf className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-foreground">Fresh & Organic</p>
                <p className="text-sm text-muted-foreground">Quality guaranteed produce</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-info/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="font-medium text-foreground">Easy Shopping</p>
                <p className="text-sm text-muted-foreground">Browse, order, and track delivery</p>
              </div>
            </div>
          </div>

          {/* Location Permission */}
          {locationPermission === 'pending' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <MapPin className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold text-foreground">Enable Location Access</h3>
                <p className="text-sm text-muted-foreground">
                  Allow location access to find farms and products near you
                </p>
              </div>
              <div className="space-y-2">
                <Button onClick={requestLocation} className="w-full bg-gradient-to-r from-primary to-primary-light">
                  <MapPin className="h-4 w-4 mr-2" />
                  Allow Location Access
                </Button>
                <Button variant="outline" onClick={continueToApp} className="w-full">
                  Continue Without Location
                </Button>
              </div>
            </div>
          )}

          {/* Continue Button (after location permission) */}
          {locationPermission !== 'pending' && (
            <Button onClick={continueToApp} className="w-full bg-gradient-to-r from-primary to-primary-light">
              Get Started
            </Button>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Fresh produce, delivered with care
        </p>
      </div>
    </div>
  );
};

export default Welcome;