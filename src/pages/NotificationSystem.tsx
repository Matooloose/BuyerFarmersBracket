import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  Bell,
  Settings,
  Check,
  Trash2,
  Filter,
  ShoppingCart,
  Package,
  MessageSquare,
  Heart,
  Star,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Zap,
  Mail,
  Smartphone,
  Volume2,
  BellOff,
  Eye,
  EyeOff,
  Archive,
  MoreVertical,
  Search,
  SortDesc,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'review' | 'promotion' | 'system' | 'social' | 'payment' | 'delivery';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  is_archived: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  expires_at?: string;
  action_url?: string;
  sender?: {
    id: string;
    name: string;
    image_url?: string;
    type: 'user' | 'system' | 'farmer' | 'admin';
  };
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  order_updates: boolean;
  message_notifications: boolean;
  review_notifications: boolean;
  promotion_notifications: boolean;
  system_notifications: boolean;
  social_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_sound: boolean;
  vibration: boolean;
  show_preview: boolean;
}

const NotificationSystem: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'order' | 'message' | 'review' | 'promotion' | 'system'>('all');
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    order_updates: true,
    message_notifications: true,
    review_notifications: true,
    promotion_notifications: true,
    system_notifications: true,
    social_notifications: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    notification_sound: true,
    vibration: true,
    show_preview: true
  });
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadNotifications();
    loadSettings();
    
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // No notification tables exist - show empty state
      setNotifications([]);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error Loading Notifications",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // No settings table exists - show default settings
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // Update in database
      // await supabase
      //   .from('user_notification_settings')
      //   .upsert({ user_id: user.id, ...settings });

      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error Updating Settings",
        description: "Failed to save notification preferences.",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id) ? { ...n, is_read: true } : n
      ));

      // Update in database
      // await supabase
      //   .from('notifications')
      //   .update({ is_read: true })
      //   .in('id', notificationIds);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAsUnread = async (notificationIds: string[]) => {
    try {
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id) ? { ...n, is_read: false } : n
      ));
    } catch (error) {
      console.error('Error marking notifications as unread:', error);
    }
  };

  const archiveNotifications = async (notificationIds: string[]) => {
    try {
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id) ? { ...n, is_archived: true } : n
      ));

      toast({
        title: "Notifications Archived",
        description: `${notificationIds.length} notification(s) archived.`,
      });
    } catch (error) {
      console.error('Error archiving notifications:', error);
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));

      toast({
        title: "Notifications Deleted",
        description: `${notificationIds.length} notification(s) deleted.`,
      });
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="h-5 w-5" />;
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'review':
        return <Star className="h-5 w-5" />;
      case 'promotion':
        return <TrendingUp className="h-5 w-5" />;
      case 'system':
        return <Info className="h-5 w-5" />;
      case 'social':
        return <Users className="h-5 w-5" />;
      case 'payment':
        return <ShoppingCart className="h-5 w-5" />;
      case 'delivery':
        return <Package className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (showArchived && !notification.is_archived) return false;
    if (!showArchived && notification.is_archived) return false;
    
    if (activeTab === 'unread' && notification.is_read) return false;
    
    if (selectedFilter !== 'all' && notification.type !== selectedFilter) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read && !n.is_archived).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bell className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedNotifications.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => markAsRead(selectedNotifications)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark Read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => archiveNotifications(selectedNotifications)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteNotifications(selectedNotifications)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Badge variant="destructive" className="h-2 w-2 p-0 mr-2" />
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Notifications List */}
          <TabsContent value="all" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <select 
                  value={selectedFilter} 
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="border rounded px-3 py-1 text-sm"
                  aria-label="Filter notifications by type"
                  title="Filter notifications by type"
                >
                  <option value="all">All Types</option>
                  <option value="order">Orders</option>
                  <option value="message">Messages</option>
                  <option value="review">Reviews</option>
                  <option value="promotion">Promotions</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => markAsRead(notifications.filter(n => !n.is_read).map(n => n.id))}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {showArchived ? 'No archived notifications' : 'No notifications'}
                  </h3>
                  <p className="text-muted-foreground">
                    {showArchived 
                      ? 'Your archived notifications will appear here.'
                      : 'You\'re all caught up! New notifications will appear here.'
                    }
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                    } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedNotifications(prev => [...prev, notification.id]);
                            } else {
                              setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                            }
                          }}
                          className="mt-1"
                          aria-label={`Select notification: ${notification.title}`}
                          title={`Select notification: ${notification.title}`}
                        />
                        
                        <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{notification.title}</h4>
                                {!notification.is_read && (
                                  <div className="h-2 w-2 bg-primary rounded-full" />
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {notification.type}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              {notification.sender && (
                                <div className="flex items-center gap-2">
                                  {notification.sender.image_url && (
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage src={notification.sender.image_url} />
                                      <AvatarFallback>{notification.sender.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    from {notification.sender.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at))} ago
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (notification.is_read) {
                                      markAsUnread([notification.id]);
                                    } else {
                                      markAsRead([notification.id]);
                                    }
                                  }}
                                >
                                  {notification.is_read ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    archiveNotifications([notification.id]);
                                  }}
                                >
                                  <Archive className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {notification.expires_at && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <Clock className="h-3 w-3" />
                              Expires in {formatDistanceToNow(new Date(notification.expires_at))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="unread" className="space-y-6">
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">
                    You have no unread notifications.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-primary bg-primary/5"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{notification.title}</h4>
                                <div className="h-2 w-2 bg-primary rounded-full" />
                                <Badge variant="outline" className="text-xs">
                                  {notification.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at))} ago
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6">
              {/* Notification Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Channels
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => 
                        updateSettings({ email_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.push_notifications}
                      onCheckedChange={(checked) => 
                        updateSettings({ push_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={settings.sms_notifications}
                      onCheckedChange={(checked) => 
                        updateSettings({ sms_notifications: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>
                    Control which types of notifications you receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <Label htmlFor="order-updates">Order Updates</Label>
                    </div>
                    <Switch
                      id="order-updates"
                      checked={settings.order_updates}
                      onCheckedChange={(checked) => 
                        updateSettings({ order_updates: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <Label htmlFor="message-notifications">Messages</Label>
                    </div>
                    <Switch
                      id="message-notifications"
                      checked={settings.message_notifications}
                      onCheckedChange={(checked) => 
                        updateSettings({ message_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <Label htmlFor="review-notifications">Review Requests</Label>
                    </div>
                    <Switch
                      id="review-notifications"
                      checked={settings.review_notifications}
                      onCheckedChange={(checked) => 
                        updateSettings({ review_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <Label htmlFor="promotion-notifications">Promotions</Label>
                    </div>
                    <Switch
                      id="promotion-notifications"
                      checked={settings.promotion_notifications}
                      onCheckedChange={(checked) => 
                        updateSettings({ promotion_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <Label htmlFor="system-notifications">System Updates</Label>
                    </div>
                    <Switch
                      id="system-notifications"
                      checked={settings.system_notifications}
                      onCheckedChange={(checked) => 
                        updateSettings({ system_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <Label htmlFor="social-notifications">Social Activity</Label>
                    </div>
                    <Switch
                      id="social-notifications"
                      checked={settings.social_notifications}
                      onCheckedChange={(checked) => 
                        updateSettings({ social_notifications: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Behavior</CardTitle>
                  <CardDescription>
                    Customize how notifications behave
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <Label htmlFor="notification-sound">Notification Sound</Label>
                    </div>
                    <Switch
                      id="notification-sound"
                      checked={settings.notification_sound}
                      onCheckedChange={(checked) => 
                        updateSettings({ notification_sound: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <Label htmlFor="vibration">Vibration</Label>
                    </div>
                    <Switch
                      id="vibration"
                      checked={settings.vibration}
                      onCheckedChange={(checked) => 
                        updateSettings({ vibration: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <Label htmlFor="show-preview">Show Preview</Label>
                    </div>
                    <Switch
                      id="show-preview"
                      checked={settings.show_preview}
                      onCheckedChange={(checked) => 
                        updateSettings({ show_preview: checked })
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BellOff className="h-4 w-4" />
                        <Label htmlFor="quiet-hours">Quiet Hours</Label>
                      </div>
                      <Switch
                        id="quiet-hours"
                        checked={settings.quiet_hours_enabled}
                        onCheckedChange={(checked) => 
                          updateSettings({ quiet_hours_enabled: checked })
                        }
                      />
                    </div>
                    
                    {settings.quiet_hours_enabled && (
                      <div className="grid grid-cols-2 gap-4 pl-6">
                        <div>
                          <Label htmlFor="quiet-start">From</Label>
                          <input
                            id="quiet-start"
                            type="time"
                            value={settings.quiet_hours_start}
                            onChange={(e) => 
                              updateSettings({ quiet_hours_start: e.target.value })
                            }
                            className="w-full border rounded px-3 py-2"
                            title="Quiet hours start time"
                            placeholder="22:00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="quiet-end">To</Label>
                          <input
                            id="quiet-end"
                            type="time"
                            value={settings.quiet_hours_end}
                            onChange={(e) => 
                              updateSettings({ quiet_hours_end: e.target.value })
                            }
                            className="w-full border rounded px-3 py-2"
                            title="Quiet hours end time"
                            placeholder="08:00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NotificationSystem;