import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Star,
  StarOff,
  Search,
  Filter,
  MoreVertical,
  Package,
  MessageCircle,
  Heart,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Settings,
  X,
  Pin,
  PinOff,
  ExternalLink,
  Users,
  Leaf,
  ShoppingCart,
  Calendar,
  Mail,
  Smartphone
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

interface InAppNotification {
  id: string;
  type: 'order' | 'message' | 'product' | 'promotion' | 'community' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  is_read: boolean;
  is_starred: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  action_label?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
    type: 'user' | 'farmer' | 'system' | 'admin';
  };
  metadata?: {
    order_id?: string;
    product_id?: string;
    farmer_id?: string;
    expires_at?: Date;
    image_url?: string;
  };
  channels: ('email' | 'push' | 'sms' | 'in_app')[];
}

interface NotificationGroup {
  id: string;
  title: string;
  notifications: InAppNotification[];
  count: number;
  latest_timestamp: Date;
}

interface NotificationStats {
  total: number;
  unread: number;
  starred: number;
  pinned: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

const InAppNotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const soundRef = useRef<HTMLAudioElement>(null);

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'starred' | 'pinned'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      if (autoRefresh) {
        const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [user, autoRefresh]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchQuery, selectedFilter, selectedType, selectedPriority]);

  const loadNotifications = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockNotifications: InAppNotification[] = [
        {
          id: '1',
          type: 'order',
          title: 'Order shipped',
          message: 'Your order #12345 has been shipped and will arrive tomorrow.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          is_read: false,
          is_starred: false,
          is_pinned: true,
          is_archived: false,
          priority: 'high',
          action_url: '/orders/12345',
          action_label: 'Track Order',
          sender: {
            id: 'farm1',
            name: 'Green Valley Farm',
            avatar: '/farm-avatar-1.jpg',
            type: 'farmer'
          },
          metadata: {
            order_id: '12345',
            image_url: '/vegetables.jpg'
          },
          channels: ['email', 'push', 'in_app']
        },
        {
          id: '2',
          type: 'message',
          title: 'New message from farmer',
          message: 'Thank you for your order! We have some extra tomatoes available if you are interested.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          is_read: false,
          is_starred: true,
          is_pinned: false,
          is_archived: false,
          priority: 'medium',
          action_url: '/messages/farm1',
          action_label: 'Reply',
          sender: {
            id: 'farm1',
            name: 'Green Valley Farm',
            avatar: '/farm-avatar-1.jpg',
            type: 'farmer'
          },
          metadata: {
            farmer_id: 'farm1'
          },
          channels: ['push', 'in_app']
        },
        {
          id: '3',
          type: 'product',
          title: 'Wishlist item back in stock',
          message: 'Organic apples from Sunset Orchards are now available.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          is_read: true,
          is_starred: false,
          is_pinned: false,
          is_archived: false,
          priority: 'medium',
          action_url: '/product/apples-organic',
          action_label: 'View Product',
          sender: {
            id: 'system',
            name: 'FarmersBracket',
            type: 'system'
          },
          metadata: {
            product_id: 'apples-organic',
            image_url: '/apples.jpg'
          },
          channels: ['email', 'in_app']
        },
        {
          id: '4',
          type: 'promotion',
          title: '20% off seasonal produce',
          message: 'Special discount on all summer fruits and vegetables this week only.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          is_read: true,
          is_starred: false,
          is_pinned: false,
          is_archived: false,
          priority: 'low',
          action_url: '/browse-products?category=seasonal',
          action_label: 'Shop Now',
          sender: {
            id: 'system',
            name: 'FarmersBracket',
            type: 'system'
          },
          metadata: {
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6) // Expires in 6 days
          },
          channels: ['email', 'push', 'in_app']
        },
        {
          id: '5',
          type: 'community',
          title: 'New farmer joined your area',
          message: 'Mountain View Organic Farm is now delivering to your neighborhood.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          is_read: true,
          is_starred: false,
          is_pinned: false,
          is_archived: false,
          priority: 'low',
          action_url: '/farmer/mountain-view-organic',
          action_label: 'View Farm',
          sender: {
            id: 'mountain-view',
            name: 'Mountain View Organic Farm',
            avatar: '/farm-avatar-2.jpg',
            type: 'farmer'
          },
          metadata: {
            farmer_id: 'mountain-view'
          },
          channels: ['in_app']
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error loading notifications",
        description: "Could not load your notifications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.sender?.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(n => !n.is_read);
        break;
      case 'starred':
        filtered = filtered.filter(n => n.is_starred);
        break;
      case 'pinned':
        filtered = filtered.filter(n => n.is_pinned);
        break;
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === selectedPriority);
    }

    // Sort by pinned first, then by timestamp
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setFilteredNotifications(filtered);
  };

  const markAsRead = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, is_read: true }
          : notification
      )
    );
  };

  const markAsUnread = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, is_read: false }
          : notification
      )
    );
  };

  const toggleStar = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_starred: !notification.is_starred }
          : notification
      )
    );
  };

  const togglePin = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_pinned: !notification.is_pinned }
          : notification
      )
    );
  };

  const archiveNotifications = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, is_archived: true }
          : notification
      )
    );
  };

  const deleteNotifications = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.filter(notification => !notificationIds.includes(notification.id))
    );
    setSelectedNotifications(new Set());
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    markAsRead(unreadIds);
    toast({
      title: "All notifications marked as read",
      description: `${unreadIds.length} notifications marked as read.`,
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setSelectedNotifications(new Set());
    toast({
      title: "All notifications cleared",
      description: "Your notification center has been cleared.",
    });
  };

  const handleNotificationClick = (notification: InAppNotification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }

    if (notification.action_url) {
      // In real app, navigate to the URL
  // ...existing code...
    }
  };

  const getNotificationStats = (): NotificationStats => {
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      starred: notifications.filter(n => n.is_starred).length,
      pinned: notifications.filter(n => n.is_pinned).length,
      by_type: {},
      by_priority: {}
    };

    notifications.forEach(n => {
      stats.by_type[n.type] = (stats.by_type[n.type] || 0) + 1;
      stats.by_priority[n.priority] = (stats.by_priority[n.priority] || 0) + 1;
    });

    return stats;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-4 w-4" />;
      case 'message': return <MessageCircle className="h-4 w-4" />;
      case 'product': return <Leaf className="h-4 w-4" />;
      case 'promotion': return <TrendingUp className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTimeDisplay = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'h:mm a');
    } else if (isYesterday(timestamp)) {
      return 'Yesterday';
    } else if (isThisWeek(timestamp)) {
      return format(timestamp, 'EEEE');
    } else {
      return format(timestamp, 'MMM d');
    }
  };

  const stats = getNotificationStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Center
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Manage your notifications and stay updated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={stats.unread === 0}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllNotifications} disabled={stats.total === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.starred}</div>
              <div className="text-sm text-muted-foreground">Starred</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.pinned}</div>
              <div className="text-sm text-muted-foreground">Pinned</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Tabs value={selectedFilter} onValueChange={(value: any) => setSelectedFilter(value)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="starred">Starred</TabsTrigger>
                  <TabsTrigger value="pinned">Pinned</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm border rounded px-3 py-1"
                aria-label="Filter notifications by type"
                title="Filter notifications by type"
              >
                <option value="all">All Types</option>
                <option value="order">Orders</option>
                <option value="message">Messages</option>
                <option value="product">Products</option>
                <option value="promotion">Promotions</option>
                <option value="community">Community</option>
                <option value="system">System</option>
              </select>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-sm border rounded px-3 py-1"
                aria-label="Filter notifications by priority"
                title="Filter notifications by priority"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || selectedFilter !== 'all' 
                      ? 'No notifications match your filters' 
                      : "You're all caught up!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    } ${notification.is_pinned ? 'border-l-4 border-l-yellow-400' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar/Icon */}
                      <div className="flex-shrink-0">
                        {notification.sender?.avatar ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={notification.sender.avatar} />
                            <AvatarFallback>
                              {notification.sender.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                            {getTypeIcon(notification.type)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {notification.is_pinned && (
                              <Pin className="h-3 w-3 text-yellow-500" />
                            )}
                            {notification.is_starred && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {getTimeDisplay(notification.timestamp)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>

                        {notification.sender && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">
                              From: {notification.sender.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {notification.sender.type}
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {notification.channels.map(channel => {
                              const ChannelIcon = channel === 'email' ? Mail : 
                                                 channel === 'push' ? Smartphone : 
                                                 channel === 'sms' ? MessageCircle : Bell;
                              return (
                                <ChannelIcon key={channel} className="h-3 w-3 text-muted-foreground" />
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(notification.id);
                              }}
                            >
                              {notification.is_starred ? (
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              ) : (
                                <StarOff className="h-3 w-3" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(notification.id);
                              }}
                            >
                              {notification.is_pinned ? (
                                <Pin className="h-3 w-3 text-yellow-500" />
                              ) : (
                                <PinOff className="h-3 w-3" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.is_read ? markAsUnread([notification.id]) : markAsRead([notification.id]);
                              }}
                            >
                              {notification.is_read ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveNotifications([notification.id]);
                              }}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>

                            {notification.action_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open action URL
                                  // ...existing code...
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {notification.action_label && notification.action_url && (
                          <Button variant="outline" size="sm" className="mt-2">
                            {notification.action_label}
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default InAppNotificationCenter;