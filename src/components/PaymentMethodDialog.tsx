import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Banknote, Building, ShieldCheck, Zap } from "lucide-react";

interface PaymentMethodDialogProps {
  amount: string;
  onPaymentMethodSelect: (method: string) => void;
  trigger: React.ReactNode;
}

const PaymentMethodDialog = ({ amount, onPaymentMethodSelect, trigger }: PaymentMethodDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");

  const paymentMethods = [
    {
      id: "payfast",
      name: "PayFast",
      description: "Secure South African payment gateway",
      icon: ShieldCheck,
      badge: "Recommended",
      badgeVariant: "default" as const,
      features: ["Credit/Debit Cards", "EFT", "Instant EFT"]
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Pay directly with your card via Stripe",
      icon: CreditCard,
      badge: "International",
      badgeVariant: "secondary" as const,
      features: ["Visa", "Mastercard", "American Express"]
    },
    {
      id: "eft",
      name: "Manual EFT",
      description: "Bank transfer with manual verification",
      icon: Building,
      badge: "2-3 Days",
      badgeVariant: "outline" as const,
      features: ["All SA Banks", "Manual verification"]
    },
    {
      id: "cash",
      name: "Cash on Delivery",
      description: "Pay cash when your order arrives",
      icon: Banknote,
      badge: "Available",
      badgeVariant: "secondary" as const,
      features: ["Pay on delivery", "No processing fees"]
    }
  ];

  const handlePayment = () => {
    if (selectedMethod) {
      onPaymentMethodSelect(selectedMethod);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Select Payment Method
          </DialogTitle>
          <DialogDescription>
            Choose your preferred payment method for R{amount}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <Label htmlFor={method.id} className="font-medium cursor-pointer">
                        {method.name}
                      </Label>
                      <Badge variant={method.badgeVariant} className="text-xs">
                        {method.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {method.features.map((feature, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              All payments are encrypted and processed securely. Your financial information is never stored.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setOpen(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              className="flex-1 gap-2" 
              disabled={!selectedMethod}
            >
              <Zap className="h-4 w-4" />
              Pay R{amount}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDialog;