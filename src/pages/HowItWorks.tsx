import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Leaf, ShoppingCart, Package, MessageCircle, CreditCard } from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Leaf className="h-8 w-8 text-primary" />,
      title: "Browse Fresh Produce",
      description: "Discover fresh, local produce from verified farmers in your area. Filter by organic, seasonal, or category preferences."
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      title: "Add to Cart",
      description: "Select your desired quantities and add items to your cart. See real-time availability and pricing from each farm."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      title: "Secure Checkout",
      description: "Complete your purchase with secure payment options. Choose delivery or pickup based on farmer availability."
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Track Your Order",
      description: "Monitor your order status from harvest to delivery. Get notifications when your fresh produce is ready."
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: "Connect with Farmers",
      description: "Chat directly with farmers about their products, farming practices, and get personalized recommendations."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">How It Works</h1>
        </div>
      </header>

      <main className="p-4 pb-20 space-y-6">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-6 w-6" />
              Welcome to FarmersBracket
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Your direct connection to fresh, local produce from trusted farmers
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Steps */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Getting Started</h2>
          {steps.map((step, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-primary bg-primary/10 rounded-full px-2 py-1">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Why Choose FarmersBracket?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-primary mb-2">🌱</div>
                <h4 className="font-semibold mb-1">Fresh & Local</h4>
                <p className="text-sm text-muted-foreground">Direct from farm to your table</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-primary mb-2">🤝</div>
                <h4 className="font-semibold mb-1">Support Farmers</h4>
                <p className="text-sm text-muted-foreground">Help local farmers thrive</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-primary mb-2">💚</div>
                <h4 className="font-semibold mb-1">Sustainable</h4>
                <p className="text-sm text-muted-foreground">Environmentally responsible</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-primary mb-2">📱</div>
                <h4 className="font-semibold mb-1">Convenient</h4>
                <p className="text-sm text-muted-foreground">Easy ordering and delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button onClick={() => navigate('/browse-products')} className="w-full">
            Start Shopping Fresh Produce
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;