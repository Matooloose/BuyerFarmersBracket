import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Phone, 
  Mail,
  Package,
  CreditCard,
  ShoppingCart,
  Settings,
  Smartphone,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
}

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  count: number;
}

const FAQ = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Categories for organizing FAQ items
  const categories: FAQCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Basic setup and first steps',
      icon: Lightbulb,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      count: 3
    },
    {
      id: 'orders',
      name: 'Orders & Delivery',
      description: 'Placing orders and delivery information',
      icon: Package,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      count: 4
    },
    {
      id: 'payments',
      name: 'Payments & Billing',
      description: 'Payment methods and billing questions',
      icon: CreditCard,
      color: 'bg-green-100 text-green-800 border-green-200',
      count: 2
    },
    {
      id: 'account',
      name: 'Account & Profile',
      description: 'Managing your account and preferences',
      icon: Settings,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      count: 1
    }
  ];

  // FAQ items - these could be moved to Supabase in the future
  const faqItems: FAQItem[] = [
    {
      id: 'how-to-order',
      question: "How do I place an order?",
      answer: "Browse our products, add items to your cart, and proceed to checkout. You can pay securely using various payment methods including card payments and PayFast.",
      category: 'getting-started',
      tags: ['ordering', 'checkout', 'cart'],
      helpful: 25,
      notHelpful: 2
    },
    {
      id: 'delivery-times',
      question: "How long does delivery take?",
      answer: "Delivery typically takes 2-5 business days depending on your location and the farm's processing time. You'll receive tracking information once your order ships.",
      category: 'orders',
      tags: ['delivery', 'shipping', 'timing'],
      helpful: 18,
      notHelpful: 1
    },
    {
      id: 'organic-products',
      question: "Are the products organic?",
      answer: "Many of our farms offer organic products, which are clearly marked with an organic badge. You can filter for organic products using our search filters.",
      category: 'getting-started',
      tags: ['organic', 'products', 'quality'],
      helpful: 22,
      notHelpful: 0
    },
    {
      id: 'cancel-order',
      question: "Can I cancel my order?",
      answer: "You can cancel your order within 2 hours of placing it if it hasn't been processed yet. Contact support or check your order history for cancellation options.",
      category: 'orders',
      tags: ['cancel', 'orders', 'refund'],
      helpful: 15,
      notHelpful: 3
    },
    {
      id: 'track-order',
      question: "How do I track my order?",
      answer: "Visit your Order History page to see real-time updates on your order status. You'll also receive email notifications for major status changes.",
      category: 'orders',
      tags: ['tracking', 'status', 'history'],
      helpful: 30,
      notHelpful: 1
    },
    {
      id: 'payment-methods',
      question: "What payment methods do you accept?",
      answer: "We accept major credit/debit cards, PayFast, and other secure payment methods. All transactions are encrypted and secure.",
      category: 'payments',
      tags: ['payment', 'security', 'methods'],
      helpful: 20,
      notHelpful: 0
    },
    {
      id: 'contact-farmer',
      question: "How do I contact a farmer?",
      answer: "You can use our messaging system to communicate directly with farmers. Visit the Messages page or contact them through product pages.",
      category: 'getting-started',
      tags: ['communication', 'farmers', 'messaging'],
      helpful: 12,
      notHelpful: 2
    },
    {
      id: 'return-policy',
      question: "What is your return policy?",
      answer: "Due to the fresh nature of our products, we have a limited return policy. Contact support within 24 hours if you receive damaged or unsatisfactory products.",
      category: 'orders',
      tags: ['returns', 'policy', 'fresh'],
      helpful: 16,
      notHelpful: 4
    },
    {
      id: 'subscriptions',
      question: "How do subscriptions work?",
      answer: "Set up recurring deliveries of your favorite products. Manage your subscriptions in the Subscriptions page where you can pause, modify, or cancel anytime.",
      category: 'account',
      tags: ['subscriptions', 'recurring', 'management'],
      helpful: 8,
      notHelpful: 1
    },
    {
      id: 'privacy-security',
      question: "Is my personal information secure?",
      answer: "Yes, we take privacy seriously. All data is encrypted and we never share your personal information with third parties without your consent.",
      category: 'payments',
      tags: ['privacy', 'security', 'data'],
      helpful: 35,
      notHelpful: 0
    }
  ];

  // Filter FAQ items based on search and category
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleToggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleVote = (questionId: string, vote: 'helpful' | 'not_helpful') => {
    // In a real app, this would update the database
    const item = faqItems.find(f => f.id === questionId);
    if (item) {
      if (vote === 'helpful') {
        item.helpful += 1;
      } else {
        item.notHelpful += 1;
      }
    }

    toast({
      title: "Thank you for your feedback!",
      description: vote === 'helpful' ? "Glad this was helpful!" : "We'll work on improving this answer.",
    });
  };

  const handleShare = async (questionId: string) => {
    const item = faqItems.find(f => f.id === questionId);
    if (!item) return;

    const shareUrl = `${window.location.origin}/faq#${questionId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.question,
          text: item.answer.substring(0, 200) + '...',
          url: shareUrl
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "FAQ link copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "FAQ link copied to clipboard",
      });
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : HelpCircle;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">FAQ</h1>
                <p className="text-sm text-muted-foreground">Frequently Asked Questions</p>
              </div>
            </div>
            
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card 
              className={`cursor-pointer transition-colors ${selectedCategory === 'all' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => setSelectedCategory('all')}
            >
              <CardContent className="p-3 text-center">
                <HelpCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">All</p>
                <p className="text-xs text-muted-foreground">{faqItems.length} items</p>
              </CardContent>
            </Card>
            
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-colors ${selectedCategory === category.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-3 text-center">
                    <IconComponent className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.count} items</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No FAQs found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or browse different categories
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFAQs.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const CategoryIcon = getCategoryIcon(item.category);
              
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(item.category)}>
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {categories.find(c => c.id === item.category)?.name}
                          </Badge>
                        </div>
                        <CardTitle 
                          className="text-base cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleToggleExpand(item.id)}
                        >
                          {item.question}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleExpand(item.id)}
                      >
                        {isExpanded ? '−' : '+'}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {item.answer}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVote(item.id, 'helpful')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {item.helpful}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVote(item.id, 'not_helpful')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              {item.notHelpful}
                            </Button>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(item.id)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Still need help?</CardTitle>
            <CardDescription className="text-center">
              Can't find what you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/messages')}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Live Chat
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/contact-support')}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('tel:+27123456789')}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                Call Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FAQ;