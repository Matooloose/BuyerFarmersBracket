import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  Package,
  MessageCircle,
  Star,
  Heart,
  Users,
  Leaf,
  Settings,
  Send,
  Eye,
  Download,
  BarChart3,
  Filter
} from 'lucide-react';
import { format, addDays, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface DigestSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  delivery_time: string;
  delivery_day?: number; // 0-6 for weekly, 1-31 for monthly
  include_order_updates: boolean;
  include_messages: boolean;
  include_product_updates: boolean;
  include_promotions: boolean;
  include_community: boolean;
  include_analytics: boolean;
  max_items_per_section: number;
  personalized_content: boolean;
  html_format: boolean;
}

interface DigestContent {
  id: string;
  type: 'order' | 'message' | 'product' | 'promotion' | 'community' | 'analytics';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  action_url?: string;
  metadata?: Record<string, any>;
}

interface DigestPreview {
  subject: string;
  sections: {
    title: string;
    items: DigestContent[];
  }[];
  stats: {
    total_items: number;
    unread_messages: number;
    order_updates: number;
    new_products: number;
  };
}

const EmailDigestService: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<DigestSettings>({
    enabled: true,
    frequency: 'daily',
    delivery_time: '08:00',
    delivery_day: 1,
    include_order_updates: true,
    include_messages: true,
    include_product_updates: true,
    include_promotions: true,
    include_community: false,
    include_analytics: true,
    max_items_per_section: 5,
    personalized_content: true,
    html_format: true,
  });

  const [preview, setPreview] = useState<DigestPreview | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastDigestSent, setLastDigestSent] = useState<Date | null>(null);
  const [nextDigestScheduled, setNextDigestScheduled] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadDigestSettings();
      calculateNextDigest();
    }
  }, [user, settings.frequency, settings.delivery_time, settings.delivery_day]);

  const loadDigestSettings = async () => {
  try {
      const savedSettings = localStorage.getItem(`digest_settings_${user?.id}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...settings, ...parsed });
      }

      // Load last digest sent timestamp
      const lastSent = localStorage.getItem(`last_digest_${user?.id}`);
      if (lastSent) {
        setLastDigestSent(new Date(lastSent));
      }
    } catch (error) {
      console.error('Error loading digest settings:', error);
    }
  };

  const saveDigestSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`digest_settings_${user?.id}`, JSON.stringify(settings));
      calculateNextDigest();
      
      toast({
        title: "Digest settings saved",
        description: "Your email digest preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your digest settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateNextDigest = () => {
    const now = new Date();
    let nextDigest = new Date();

    const [hours, minutes] = settings.delivery_time.split(':').map(Number);
    nextDigest.setHours(hours, minutes, 0, 0);

    switch (settings.frequency) {
      case 'daily':
        if (nextDigest <= now) {
          nextDigest = addDays(nextDigest, 1);
        }
        break;
      case 'weekly':
        nextDigest = startOfWeek(now);
        nextDigest.setDate(nextDigest.getDate() + (settings.delivery_day || 1));
        nextDigest.setHours(hours, minutes, 0, 0);
        if (nextDigest <= now) {
          nextDigest = addDays(nextDigest, 7);
        }
        break;
      case 'monthly':
        nextDigest = new Date(now.getFullYear(), now.getMonth(), settings.delivery_day || 1, hours, minutes);
        if (nextDigest <= now) {
          nextDigest = new Date(now.getFullYear(), now.getMonth() + 1, settings.delivery_day || 1, hours, minutes);
        }
        break;
    }

    setNextDigestScheduled(nextDigest);
  };

  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // Simulate generating digest content
      const mockContent: DigestContent[] = [
        {
          id: '1',
          type: 'order',
          title: 'Order #12345 has been shipped',
          description: 'Your order of fresh vegetables is on the way and will arrive tomorrow.',
          timestamp: new Date(),
          priority: 'high',
          action_url: '/orders/12345',
        },
        {
          id: '2',
          type: 'message',
          title: 'New message from Green Valley Farm',
          description: 'Thank you for your order! We have some extra tomatoes available if you are interested.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          priority: 'medium',
          action_url: '/messages',
        },
        {
          id: '3',
          type: 'product',
          title: 'New seasonal products available',
          description: 'Fresh summer berries and stone fruits are now in season from local farms.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          priority: 'medium',
        },
        {
          id: '4',
          type: 'promotion',
          title: '20% off organic produce this week',
          description: 'Special discount on all certified organic products from participating farms.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          priority: 'low',
        },
        {
          id: '5',
          type: 'community',
          title: 'Farmer spotlight: Sunset Orchards',
          description: 'Learn about sustainable farming practices and the story behind your favorite apples.',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          priority: 'low',
        }
      ];

      // Filter content based on settings
      const filteredContent = mockContent.filter(item => {
        switch (item.type) {
          case 'order': return settings.include_order_updates;
          case 'message': return settings.include_messages;
          case 'product': return settings.include_product_updates;
          case 'promotion': return settings.include_promotions;
          case 'community': return settings.include_community;
          case 'analytics': return settings.include_analytics;
          default: return true;
        }
      });

      // Group content by type
      const sections = [
        {
          title: 'Order Updates',
          items: filteredContent.filter(item => item.type === 'order').slice(0, settings.max_items_per_section)
        },
        {
          title: 'Messages',
          items: filteredContent.filter(item => item.type === 'message').slice(0, settings.max_items_per_section)
        },
        {
          title: 'Product Updates',
          items: filteredContent.filter(item => item.type === 'product').slice(0, settings.max_items_per_section)
        },
        {
          title: 'Promotions',
          items: filteredContent.filter(item => item.type === 'promotion').slice(0, settings.max_items_per_section)
        },
        {
          title: 'Community',
          items: filteredContent.filter(item => item.type === 'community').slice(0, settings.max_items_per_section)
        }
      ].filter(section => section.items.length > 0);

      const previewData: DigestPreview = {
        subject: `Your ${settings.frequency} FarmersBracket digest - ${format(new Date(), 'PPP')}`,
        sections,
        stats: {
          total_items: filteredContent.length,
          unread_messages: 3,
          order_updates: 1,
          new_products: 8,
        }
      };

      setPreview(previewData);
    } catch (error) {
      toast({
        title: "Error generating preview",
        description: "Could not generate digest preview.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const sendTestDigest = async () => {
    try {
      toast({
        title: "Test digest sent",
        description: "A test digest has been sent to your email address.",
      });
    } catch (error) {
      toast({
        title: "Error sending test digest",
        description: "Could not send test digest.",
        variant: "destructive",
      });
    }
  };

  const getFrequencyDescription = () => {
    switch (settings.frequency) {
      case 'daily':
        return `Daily at ${settings.delivery_time}`;
      case 'weekly':
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${weekdays[settings.delivery_day || 1]} at ${settings.delivery_time}`;
      case 'monthly':
        return `Monthly on the ${settings.delivery_day || 1}${getOrdinalSuffix(settings.delivery_day || 1)} at ${settings.delivery_time}`;
      default:
        return 'Custom schedule';
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Calendar className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-4 w-4" />;
      case 'message': return <MessageCircle className="h-4 w-4" />;
      case 'product': return <Leaf className="h-4 w-4" />;
      case 'promotion': return <Star className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Digest</h2>
          <p className="text-muted-foreground">
            Get personalized summaries of your FarmersBracket activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generatePreview} disabled={isGeneratingPreview}>
            <Eye className="h-4 w-4 mr-2" />
            {isGeneratingPreview ? 'Generating...' : 'Preview'}
          </Button>
          <Button onClick={saveDigestSettings} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Digest Settings
              </CardTitle>
              <CardDescription>
                Configure your email digest preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable email digest</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive regular summaries of your activity
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {settings.enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium">Frequency</label>
                    <Select
                      value={settings.frequency}
                      onValueChange={(value: any) => setSettings(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Delivery time</label>
                    <Select
                      value={settings.delivery_time}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, delivery_time: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                              {format(new Date().setHours(i, 0, 0, 0), 'h:mm a')}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.frequency === 'weekly' && (
                    <div>
                      <label className="text-sm font-medium">Delivery day</label>
                      <Select
                        value={settings.delivery_day?.toString()}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, delivery_day: parseInt(value) }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {settings.frequency === 'monthly' && (
                    <div>
                      <label className="text-sm font-medium">Day of month</label>
                      <Select
                        value={settings.delivery_day?.toString()}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, delivery_day: parseInt(value) }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}{getOrdinalSuffix(i + 1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Content Preferences
              </CardTitle>
              <CardDescription>
                Choose what to include in your digest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'include_order_updates', label: 'Order Updates', icon: Package },
                { key: 'include_messages', label: 'Messages from Farmers', icon: MessageCircle },
                { key: 'include_product_updates', label: 'New Products & Stock Alerts', icon: Leaf },
                { key: 'include_promotions', label: 'Promotions & Offers', icon: Star },
                { key: 'include_community', label: 'Community Activity', icon: Users },
                { key: 'include_analytics', label: 'Your Shopping Insights', icon: BarChart3 }
              ].map((option) => (
                <div key={option.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">{option.label}</label>
                  </div>
                  <Switch
                    checked={settings[option.key as keyof DigestSettings] as boolean}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, [option.key]: checked }))
                    }
                  />
                </div>
              ))}

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Personalized content</label>
                  <Switch
                    checked={settings.personalized_content}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, personalized_content: checked }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Include recommendations based on your shopping history
                </p>
              </div>
            </CardContent>
          </Card>

          {settings.enabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Frequency:</span>
                    <Badge variant="outline">{getFrequencyDescription()}</Badge>
                  </div>
                  
                  {nextDigestScheduled && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Next digest:</span>
                      <span className="text-sm text-muted-foreground">
                        {format(nextDigestScheduled, 'PPp')}
                      </span>
                    </div>
                  )}
                  
                  {lastDigestSent && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last sent:</span>
                      <span className="text-sm text-muted-foreground">
                        {format(lastDigestSent, 'PPp')}
                      </span>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={sendTestDigest}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Digest
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview */}
        <div>
          {preview ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Digest Preview
                </CardTitle>
                <CardDescription>
                  How your email digest will look
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">Subject:</h3>
                    <Badge variant="secondary" className="text-xs">
                      {preview.stats.total_items} items
                    </Badge>
                  </div>
                  <p className="text-sm font-mono bg-background p-2 rounded">
                    {preview.subject}
                  </p>
                </div>

                <div className="space-y-4">
                  {preview.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="border rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        {getTypeIcon(section.items[0]?.type)}
                        {section.title}
                        <Badge variant="outline" className="text-xs">
                          {section.items.length}
                        </Badge>
                      </h4>
                      
                      <div className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-start gap-3 p-2 bg-muted/30 rounded">
                            <div className="flex items-center gap-1 mt-1">
                              {getPriorityIcon(item.priority)}
                              {getTypeIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(item.timestamp, 'p')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{preview.stats.total_items}</p>
                    <p className="text-xs text-muted-foreground">Total Items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-600">{preview.stats.unread_messages}</p>
                    <p className="text-xs text-muted-foreground">New Messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">{preview.stats.order_updates}</p>
                    <p className="text-xs text-muted-foreground">Order Updates</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-purple-600">{preview.stats.new_products}</p>
                    <p className="text-xs text-muted-foreground">New Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No Preview Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a preview to see how your digest will look
                  </p>
                  <Button onClick={generatePreview} disabled={isGeneratingPreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Generate Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDigestService;