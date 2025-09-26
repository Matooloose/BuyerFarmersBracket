import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageCircle,
  Bell,
  Settings,
  Mail,
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  Star,
  Archive,
  Filter,
  Search,
  Plus,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Import our enhanced communication components
import MessageComposer from './MessageComposer';
import NotificationPreferences from './NotificationPreferences';
import EmailDigestService from './EmailDigestService';
import InAppNotificationCenter from './InAppNotificationCenter';

interface CommunicationStats {
  totalMessages: number;
  unreadMessages: number;
  totalNotifications: number;
  unreadNotifications: number;
  emailDigests: number;
  activeConversations: number;
  responseTime: string;
  satisfactionScore: number;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'notification' | 'email' | 'setting';
  title: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
}

const EnhancedCommunicationHub: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('messages');
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState<CommunicationStats>({
    totalMessages: 0,
    unreadMessages: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    emailDigests: 0,
    activeConversations: 0,
    responseTime: '0h',
    satisfactionScore: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCommunicationStats();
      loadRecentActivity();
    }
  }, [user]);

  const loadCommunicationStats = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockStats: CommunicationStats = {
        totalMessages: 47,
        unreadMessages: 8,
        totalNotifications: 23,
        unreadNotifications: 5,
        emailDigests: 3,
        activeConversations: 6,
        responseTime: '2.4h',
        satisfactionScore: 4.8
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error loading communication stats:', error);
      toast({
        title: "Error loading stats",
        description: "Could not load communication statistics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'message',
          title: 'New message from Green Valley Farm',
          description: 'Thank you for your order! We have some extra tomatoes available.',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          status: 'completed',
          priority: 'medium'
        },
        {
          id: '2',
          type: 'notification',
          title: 'Order shipped notification',
          description: 'Your order #12345 has been shipped and will arrive tomorrow.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          status: 'completed',
          priority: 'high'
        },
        {
          id: '3',
          type: 'email',
          title: 'Weekly digest sent',
          description: 'Your weekly summary of orders and new products.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          status: 'completed',
          priority: 'low'
        },
        {
          id: '4',
          type: 'setting',
          title: 'Notification preferences updated',
          description: 'Email notifications enabled for order updates.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          status: 'completed',
          priority: 'low'
        }
      ];

      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'setting': return <Settings className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Enhanced Communication Hub
          </h1>
          <p className="text-muted-foreground">
            Manage messages, notifications, and communication preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Communication Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-xs text-muted-foreground">Total Messages</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
            {stats.unreadMessages > 0 && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stats.unreadMessages} unread
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalNotifications}</p>
                <p className="text-xs text-muted-foreground">Notifications</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-500" />
            </div>
            {stats.unreadNotifications > 0 && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stats.unreadNotifications} unread
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.activeConversations}</p>
                <p className="text-xs text-muted-foreground">Active Chats</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Avg: {stats.responseTime}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.satisfactionScore}</p>
                <p className="text-xs text-muted-foreground">Satisfaction</p>
              </div>
              <Star className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                /5.0 rating
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {!isExpanded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest communication activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Communication Features */}
      <Card className={isExpanded ? 'h-screen' : ''}>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6 pb-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="messages" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                  {stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {stats.unreadMessages}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                  {stats.unreadNotifications > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {stats.unreadNotifications}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="email-digest" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Digest
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Preferences
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="messages" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Message Composer</h3>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      View All Messages
                    </Button>
                  </div>
                  <MessageComposer 
                    onSendMessage={async (content: string, attachments?: File[], messageType?: string) => {
                      try {
                        // In real app, send message via API
                        // ...existing code...
                        
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        toast({
                          title: "Message sent successfully",
                          description: "Your message has been sent to the farmer.",
                        });
                        
                        // Update stats
                        setStats(prev => ({
                          ...prev,
                          totalMessages: prev.totalMessages + 1,
                          activeConversations: prev.activeConversations + 1
                        }));
                        
                        // Add to recent activity
                        const newActivity: RecentActivity = {
                          id: Date.now().toString(),
                          type: 'message',
                          title: 'Message sent',
                          description: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                          timestamp: new Date(),
                          status: 'completed',
                          priority: messageType === 'urgent' ? 'high' : 'medium'
                        };
                        
                        setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
                        
                      } catch (error) {
                        console.error('Error sending message:', error);
                        toast({
                          title: "Error sending message",
                          description: "Could not send your message. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    placeholder="Type your message to the farmer..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <InAppNotificationCenter />
              </TabsContent>

              <TabsContent value="email-digest" className="mt-0">
                <EmailDigestService />
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">
                <NotificationPreferences />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {!isExpanded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">New Message</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <Bell className="h-5 w-5" />
                <span className="text-xs">Mark All Read</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <Settings className="h-5 w-5" />
                <span className="text-xs">Update Settings</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-1">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedCommunicationHub;