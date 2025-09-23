import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle } from "lucide-react";

const FAQ = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse our products, add items to your cart, and proceed to checkout. You can pay securely using various payment methods including card payments and PayFast."
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery typically takes 2-5 business days depending on your location and the farm's processing time. You'll receive tracking information once your order ships."
    },
    {
      question: "Are the products organic?",
      answer: "Many of our farms offer organic products, which are clearly marked with an organic badge. You can filter for organic products using our search filters."
    },
    {
      question: "Can I cancel my order?",
      answer: "You can cancel your order within 2 hours of placing it if it hasn't been processed yet. Contact support or check your order history for cancellation options."
    },
    {
      question: "How do I track my order?",
      answer: "Visit your Order History page to see real-time updates on your order status. You'll also receive email notifications for major status changes."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit/debit cards, PayFast, and other secure payment methods. All transactions are encrypted and secure."
    },
    {
      question: "How do I contact a farmer?",
      answer: "You can use our messaging system to communicate directly with farmers. Visit the Messages page or contact them through product pages."
    },
    {
      question: "What is your return policy?",
      answer: "Due to the fresh nature of our products, we have a limited return policy. Contact support within 24 hours if you receive damaged or unsatisfactory products."
    },
    {
      question: "How do subscriptions work?",
      answer: "Set up recurring deliveries of your favorite products. Manage your subscriptions in the Subscriptions page where you can pause, modify, or cancel anytime."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we take privacy seriously. All data is encrypted and we never share your personal information with third parties without your consent."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="flex items-center px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Find answers to common questions about FarmersBracket
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Still need help?</CardTitle>
            <CardDescription className="text-center">
              Can't find what you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              onClick={() => navigate('/contact-support')}
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FAQ;