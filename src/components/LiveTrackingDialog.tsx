import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, Clock, CheckCircle } from "lucide-react";

interface LiveTrackingDialogProps {
  orderId: string;
  trigger: React.ReactNode;
}

const LiveTrackingDialog = ({ orderId, trigger }: LiveTrackingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [trackingSteps] = useState([
    {
      id: 1,
      title: "Order Confirmed",
      description: "Your order has been received and confirmed",
      status: "completed",
      time: "2 hours ago"
    },
    {
      id: 2,
      title: "Preparing for Shipment",
      description: "Farm is preparing your fresh produce",
      status: "completed",
      time: "1 hour ago"
    },
    {
      id: 3,
      title: "Out for Delivery",
      description: "Your order is on its way",
      status: "current",
      time: "30 minutes ago"
    },
    {
      id: 4,
      title: "Delivered",
      description: "Order delivered successfully",
      status: "pending",
      time: "Estimated in 45 minutes"
    }
  ]);

  const [currentLocation, setCurrentLocation] = useState("Roodepoort, Gauteng");

  useEffect(() => {
    if (open) {
      // Simulate live location updates
      const interval = setInterval(() => {
        const locations = [
          "Roodepoort, Gauteng",
          "Johannesburg CBD, Gauteng", 
          "Sandton, Gauteng",
          "Your neighborhood"
        ];
        setCurrentLocation(locations[Math.floor(Math.random() * locations.length)]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [open]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'current':
        return <Truck className="h-5 w-5 text-primary" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStepStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'current':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Live Order Tracking</DialogTitle>
          <DialogDescription>
            Track your order in real-time from farm to your doorstep.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Location */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Current Location</span>
            </div>
            <p className="text-sm text-muted-foreground">{currentLocation}</p>
            <div className="flex items-center space-x-1 mt-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-xs text-primary">Live tracking active</span>
            </div>
          </div>

          {/* Tracking Steps */}
          <div className="space-y-4">
            {trackingSteps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-3">
                <div className="flex flex-col items-center">
                  {getStepIcon(step.status)}
                  {index < trackingSteps.length - 1 && (
                    <div className={`w-px h-8 mt-2 ${
                      step.status === 'completed' ? 'bg-success' : 'bg-muted'
                    }`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <Badge className={`${getStepStatus(step.status)} border text-xs`}>
                      {step.status === 'current' ? 'In Progress' : 
                       step.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{step.description}</p>
                  <p className="text-xs text-muted-foreground">{step.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Delivery */}
          <div className="bg-accent/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimated Delivery</span>
              <span className="text-sm text-primary font-medium">45 minutes</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveTrackingDialog;