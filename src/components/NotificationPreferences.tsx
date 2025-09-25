import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell,
  Mail,
  Smartphone,
  MessageCircle,
  Package,
  Heart,
  Star,
  TrendingUp,
  Volume2,
  Clock,
  Moon,
  Sun,
  Zap,
  Shield,
  Settings,
  TestTube
} from 'lucide-react';

interface NotificationPreferences {
  // Channel preferences
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;

  // Content preferences
  order_updates: boolean;
  farmer_messages: boolean;
  product_reviews: boolean;
  promotions: boolean;
  price_alerts: boolean;
  stock_alerts: boolean;
  delivery_updates: boolean;
  community_activity: boolean;
  system_updates: boolean;

  // Timing preferences
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  weekend_notifications: boolean;
  
  // Frequency preferences
  digest_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  urgent_only: boolean;
  batch_notifications: boolean;
  
  // Advanced preferences
  sound_enabled: boolean;
  vibration_enabled: boolean;
  led_enabled: boolean;
  priority_filtering: boolean;
  auto_read_timeout: number; // seconds
  notification_preview: boolean;
}

interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  available: boolean;
  settings?: Record<string, any>;
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  priority: 'low' | 'medium' | 'high';
  channels: string[];
  enabled: boolean;
  customizable: boolean;
}

const NotificationPreferences: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    // Channel preferences
    email_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,

    // Content preferences
    order_updates: true,
    farmer_messages: true,
    product_reviews: true,
    promotions: true,
    price_alerts: true,
    stock_alerts: true,
    delivery_updates: true,
    community_activity: false,
    system_updates: true,

    // Timing preferences
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    weekend_notifications: true,
    
    // Frequency preferences
    digest_frequency: 'daily',
    urgent_only: false,
    batch_notifications: false,
    
    // Advanced preferences
    sound_enabled: true,
    vibration_enabled: true,
    led_enabled: true,
    priority_filtering: false,
    auto_read_timeout: 30,
    notification_preview: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Notification channels configuration
  const notificationChannels: NotificationChannel[] = [
    {
      id: 'email',
      name: 'Email',
      description: 'Receive notifications via email',
      icon: <Mail className="h-4 w-4" />,
      enabled: preferences.email_enabled,
      available: true,
    },
    {
      id: 'push',
      name: 'Push Notifications',
      description: 'Browser and mobile push notifications',
      icon: <Smartphone className="h-4 w-4" />,
      enabled: preferences.push_enabled,
      available: 'Notification' in window,
    },
    {
      id: 'sms',
      name: 'SMS',
      description: 'Text message notifications (Premium feature)',
      icon: <MessageCircle className="h-4 w-4" />,
      enabled: preferences.sms_enabled,
      available: true, // Would check subscription in real app
    },
    {
      id: 'in_app',
      name: 'In-App',
      description: 'Notifications within the application',
      icon: <Bell className="h-4 w-4" />,
      enabled: preferences.in_app_enabled,
      available: true,
    }
  ];

  // Notification categories configuration
  const notificationCategories: NotificationCategory[] = [
    {
      id: 'order_updates',
      name: 'Order Updates',
      description: 'Status changes, delivery updates, and order confirmations',
      icon: <Package className="h-4 w-4" />,
      priority: 'high',
      channels: ['email', 'push', 'sms'],
      enabled: preferences.order_updates,
      customizable: false,
    },
    {
      id: 'farmer_messages',
      name: 'Farmer Messages',
      description: 'Direct messages from farmers and producers',
      icon: <MessageCircle className="h-4 w-4" />,
      priority: 'high',
      channels: ['email', 'push', 'in_app'],
      enabled: preferences.farmer_messages,
      customizable: true,
    },
    {
      id: 'product_reviews',
      name: 'Product Reviews',
      description: 'Review requests and responses to your reviews',
      icon: <Star className="h-4 w-4" />,
      priority: 'medium',
      channels: ['email', 'in_app'],
      enabled: preferences.product_reviews,
      customizable: true,
    },
    {
      id: 'promotions',
      name: 'Promotions & Offers',
      description: 'Special deals, discounts, and promotional content',
      icon: <TrendingUp className="h-4 w-4" />,
      priority: 'low',
      channels: ['email', 'push'],
      enabled: preferences.promotions,
      customizable: true,
    },
    {
      id: 'price_alerts',
      name: 'Price Alerts',
      description: 'Notifications when prices drop on wishlist items',
      icon: <TrendingUp className="h-4 w-4" />,
      priority: 'medium',
      channels: ['email', 'push', 'in_app'],
      enabled: preferences.price_alerts,
      customizable: true,
    },
    {
      id: 'stock_alerts',
      name: 'Stock Alerts',
      description: 'Notifications when out-of-stock items become available',
      icon: <Package className="h-4 w-4" />,
      priority: 'medium',
      channels: ['email', 'push', 'in_app'],
      enabled: preferences.stock_alerts,
      customizable: true,
    },
    {
      id: 'community_activity',
      name: 'Community Activity',
      description: 'Updates from farmers and community interactions',
      icon: <Heart className="h-4 w-4" />,
      priority: 'low',
      channels: ['in_app'],
      enabled: preferences.community_activity,
      customizable: true,
    }
  ];

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      // In a real app, load from database
      const savedPreferences = localStorage.getItem(`notification_preferences_${user?.id}`);
      if (savedPreferences) {
        setPreferences({ ...preferences, ...JSON.parse(savedPreferences) });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      // In a real app, save to database
      localStorage.setItem(`notification_preferences_${user?.id}`, JSON.stringify(preferences));
      
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated successfully.",
      });
      
      setHasUnsavedChanges(false);
    } catch (error) {
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const requestPushPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Push notifications enabled",
          description: "You'll now receive push notifications when enabled.",
        });
      }
    }
  };

  const testNotification = (channel: string) => {
    switch (channel) {
      case 'push':
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Test Notification', {
            body: 'This is a test notification from FarmersBracket',
            icon: '/favicon.ico',
          });
        } else {
          requestPushPermission();
        }
        break;
      case 'email':
        toast({
          title: "Test email sent",
          description: "Check your email for a test notification.",
        });
        break;
      default:
        toast({
          title: "Test notification",
          description: `This is a test ${channel} notification.`,
        });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Preferences</h2>
          <p className="text-muted-foreground">
            Customize how you receive notifications and updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved changes
            </Badge>
          )}
          <Button onClick={savePreferences} disabled={isLoading || !hasUnsavedChanges}>
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Notification Channels */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationChannels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {channel.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{channel.name}</h4>
                        {!channel.available && (
                          <Badge variant="outline" className="text-xs">
                            Not Available
                          </Badge>
                        )}
                        {channel.id === 'sms' && (
                          <Badge variant="outline" className="text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={channel.enabled && channel.available}
                      onCheckedChange={(checked) => {
                        const key = `${channel.id}_enabled` as keyof NotificationPreferences;
                        updatePreference(key, checked);
                        if (channel.id === 'push' && checked) {
                          requestPushPermission();
                        }
                      }}
                      disabled={!channel.available}
                    />
                    {channel.enabled && channel.available && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testNotification(channel.id)}
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Categories */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Categories
              </CardTitle>
              <CardDescription>
                Control what types of notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{category.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(category.priority)}`}
                        >
                          {category.priority} priority
                        </Badge>
                        {!category.customizable && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {category.description}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Via:</span>
                        {category.channels.map(channelId => {
                          const channel = notificationChannels.find(c => c.id === channelId);
                          return channel ? (
                            <Badge key={channelId} variant="secondary" className="text-xs">
                              {channel.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={category.enabled}
                    onCheckedChange={(checked) => {
                      const key = category.id as keyof NotificationPreferences;
                      updatePreference(key, checked);
                    }}
                    disabled={!category.customizable}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timing Preferences */}
        <TabsContent value="timing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Quiet Hours
                </CardTitle>
                <CardDescription>
                  Set times when you don't want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-hours">Enable quiet hours</Label>
                  <Switch
                    id="quiet-hours"
                    checked={preferences.quiet_hours_enabled}
                    onCheckedChange={(checked) => updatePreference('quiet_hours_enabled', checked)}
                  />
                </div>
                
                {preferences.quiet_hours_enabled && (
                  <div className="grid gap-4 pt-4 border-t">
                    <div>
                      <Label>Start time</Label>
                      <Select
                        value={preferences.quiet_hours_start}
                        onValueChange={(value) => updatePreference('quiet_hours_start', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                {`${hour}:00`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>End time</Label>
                      <Select
                        value={preferences.quiet_hours_end}
                        onValueChange={(value) => updatePreference('quiet_hours_end', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                {`${hour}:00`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Digest
                </CardTitle>
                <CardDescription>
                  Get summarized notifications via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Digest frequency</Label>
                  <Select
                    value={preferences.digest_frequency}
                    onValueChange={(value: any) => updatePreference('digest_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive a summary of notifications at regular intervals
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="weekend-notifications">Weekend notifications</Label>
                  <Switch
                    id="weekend-notifications"
                    checked={preferences.weekend_notifications}
                    onCheckedChange={(checked) => updatePreference('weekend_notifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Fine-tune your notification experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sound">Notification sound</Label>
                      <p className="text-xs text-muted-foreground">Play sound for new notifications</p>
                    </div>
                    <Switch
                      id="sound"
                      checked={preferences.sound_enabled}
                      onCheckedChange={(checked) => updatePreference('sound_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="vibration">Vibration</Label>
                      <p className="text-xs text-muted-foreground">Vibrate device for notifications</p>
                    </div>
                    <Switch
                      id="vibration"
                      checked={preferences.vibration_enabled}
                      onCheckedChange={(checked) => updatePreference('vibration_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="led">LED indicator</Label>
                      <p className="text-xs text-muted-foreground">Flash LED light for notifications</p>
                    </div>
                    <Switch
                      id="led"
                      checked={preferences.led_enabled}
                      onCheckedChange={(checked) => updatePreference('led_enabled', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="priority">Priority filtering</Label>
                      <p className="text-xs text-muted-foreground">Only show high-priority notifications</p>
                    </div>
                    <Switch
                      id="priority"
                      checked={preferences.priority_filtering}
                      onCheckedChange={(checked) => updatePreference('priority_filtering', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="batch">Batch notifications</Label>
                      <p className="text-xs text-muted-foreground">Group similar notifications together</p>
                    </div>
                    <Switch
                      id="batch"
                      checked={preferences.batch_notifications}
                      onCheckedChange={(checked) => updatePreference('batch_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="preview">Show preview</Label>
                      <p className="text-xs text-muted-foreground">Display notification content in preview</p>
                    </div>
                    <Switch
                      id="preview"
                      checked={preferences.notification_preview}
                      onCheckedChange={(checked) => updatePreference('notification_preview', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label>Auto-read timeout (seconds)</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    value={[preferences.auto_read_timeout]}
                    onValueChange={([value]) => updatePreference('auto_read_timeout', value)}
                    max={300}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10s</span>
                    <span>Current: {preferences.auto_read_timeout}s</span>
                    <span>300s</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically mark notifications as read after this time
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationPreferences;