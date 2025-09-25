import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BottomNavBar from "@/components/BottomNavBar";
import { 
  ArrowLeft, 
  Send, 
  Lock, 
  MessageCircle, 
  Home, 
  ShoppingCart, 
  Package, 
  Search,
  Crown,
  Phone,
  Video,
  MoreVertical,
  Pin,
  Archive,
  Trash2,
  UserPlus,
  Settings
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/contexts/AppStateContext";
import { format, isToday, isYesterday } from "date-fns";

interface UserProfile {
  id: string;
  name: string | null;
  image_url: string | null;
  user_type?: 'customer' | 'farmer' | 'admin';
  is_online?: boolean;
  last_seen?: string;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  message_type?: 'text' | 'image' | 'system';
  reply_to?: string;
}

interface Conversation {
  id: string;
  other_user: UserProfile;
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

const Messages: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { cartItems, getTotalItems } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification, notifications } = useAppState();

  // State
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Bottom navigation
  const bottomNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Package, label: "Track", path: "/track-order" },
    { icon: Search, label: "Browse", path: "/browse-products" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!user || !selectedUser) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id}))`
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages(prev => [...prev, payload.new as Message]);
          
          // Show notification for received messages
          if (payload.new.sender_id !== user.id) {
            addNotification({
              title: "New Message",
              message: `New message from ${selectedUser.name || 'user'}`,
              type: "farmer",
              read: false,
            });
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, selectedUser, addNotification]);

  const checkSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('has_active_subscription', { _user_id: user.id });
      if (error) throw error;
      setHasSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUserList = useCallback(async () => {
    if (!user) return;
    try {
      const { data: chatUsers, error } = await supabase
        .from("chats")
        .select("sender_id,receiver_id")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      if (error) throw error;
      const ids = Array.from(new Set(
        (chatUsers || [])
          .flatMap((c: { sender_id: string; receiver_id: string }) => [c.sender_id, c.receiver_id])
          .filter((id: string) => id && id !== user.id)
      ));
      if (ids.length === 0) return;
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, image_url")
        .in("id", ids);
      if (profileError) throw profileError;
      setUserList(profiles || []);
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  }, [user]);

  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user || !otherUserId) return;
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data || []);
      // Trigger notification for unread messages received by current user
      if (data && Array.isArray(data)) {
        data.forEach((msg: Message) => {
          if (msg.receiver_id === user.id && !msg.is_read) {
            addNotification({
              // Use message id for notification id
              title: "New Message",
              message: `You received a new message from ${selectedUser?.name || "user"}.`,
              type: "farmer",
              read: false,
              // senderId is removed as it is not part of the Notification type
            });
          }
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [user, addNotification, selectedUser]);
  // Mark notification as read when chat is opened
  useEffect(() => {
    if (!showChatList && selectedUser) {
      // Only mark notifications as read for received messages from this user
      if (notifications && notifications.length > 0) {
        notifications.forEach((notif) => {
          if (
            notif.type === "farmer" &&
            notif.message &&
            notif.message.indexOf("new message from " + selectedUser.name) !== -1 &&
            !notif.read
          ) {
            if (typeof notif.id !== "undefined" && typeof notif.read !== "undefined") {
              // Mark as read
              if (typeof window !== "undefined" && typeof addNotification === "function") {
                addNotification({ ...notif, read: true });
              }
            }
          }
        });
      }
    }
  }, [showChatList, selectedUser, notifications, addNotification]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user || !selectedUser) return;
    
    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX
    
    try {
      const { error } = await supabase
        .from("chats")
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message: messageText,
          is_read: false
        });
      
      if (error) throw error;
      
      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${selectedUser.name || "user"}.`,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageText); // Restore message on error
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  }, [newMessage, user, selectedUser, toast]);

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user, checkSubscription]);

  useEffect(() => {
    if (user) {
      fetchUserList();
    }
  }, [user, fetchUserList]);

  useEffect(() => {
    if (hasSubscription && selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [hasSubscription, selectedUser, fetchMessages]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getUserTypeIcon = (userType?: string) => {
    switch (userType) {
      case 'farmer':
        return <Crown className="h-3 w-3 text-green-600" />;
      case 'admin':
        return <Crown className="h-3 w-3 text-blue-600" />;
      default:
        return null;
    }
  };

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.other_user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.last_message?.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeTab) {
      case 'unread':
        return matchesSearch && conv.unread_count > 0;
      case 'farmers':
        return matchesSearch && conv.other_user.user_type === 'farmer';
      case 'support':
        return matchesSearch && conv.other_user.user_type === 'admin';
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="ml-2 text-lg font-semibold">Messages</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show subscription requirement
  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="ml-2 text-lg font-semibold">Messages</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-800">
                <Lock className="h-5 w-5 mr-2" />
                Subscription Required
              </CardTitle>
              <CardDescription className="text-amber-700">
                You need an active subscription to access messaging features and chat with farmers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-amber-200">
                  <h3 className="font-medium mb-2">With a subscription, you can:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Chat directly with farmers</li>
                    <li>• Ask questions about products</li>
                    <li>• Get priority support</li>
                    <li>• Coordinate delivery details</li>
                  </ul>
                </div>
                <Button onClick={() => navigate('/subscriptions')} className="w-full">
                  <Crown className="h-4 w-4 mr-2" />
                  View Subscription Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }


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
                <h1 className="text-lg font-semibold">
                  {!showChatList && selectedUser ? selectedUser.name || 'User' : 'Messages'}
                </h1>
                {!showChatList && selectedUser?.user_type && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {getUserTypeIcon(selectedUser.user_type)}
                    {selectedUser.user_type === 'farmer' ? 'Farmer' : 
                     selectedUser.user_type === 'admin' ? 'Support' : 'User'}
                    {selectedUser.is_online && (
                      <Badge variant="secondary" className="text-xs ml-2">Online</Badge>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            {!showChatList && selectedUser && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(true)}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        {showChatList ? (
          <>
            {/* Search and Tabs */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="farmers">Farmers</TabsTrigger>
                  <TabsTrigger value="support">Support</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Conversations List */}
            <div className="space-y-2">
              {filteredConversations.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start chatting with farmers to get the conversation going!
                    </p>
                    <Button onClick={() => navigate('/browse-products')}>
                      <Search className="h-4 w-4 mr-2" />
                      Browse Products
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedUser(conversation.other_user);
                      setShowChatList(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {conversation.other_user.image_url ? (
                          <img 
                            src={conversation.other_user.image_url} 
                            alt={conversation.other_user.name || "User"} 
                            className="w-12 h-12 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                            {conversation.other_user.name?.[0] || "U"}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {conversation.other_user.name || "User"}
                              </p>
                              {getUserTypeIcon(conversation.other_user.user_type)}
                            </div>
                            <div className="flex items-center gap-2">
                              {conversation.last_message && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(conversation.last_message.created_at)}
                                </span>
                              )}
                              {conversation.unread_count > 0 && (
                                <Badge className="bg-primary text-primary-foreground">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {conversation.last_message && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conversation.last_message.message.slice(0, 60)}
                              {conversation.last_message.message.length > 60 ? "..." : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Chat Interface */}
            <Card className="h-[600px] flex flex-col">
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet. Start a conversation!</p>
                      </div>
                    ) : (
                      messages
                        .filter(m => 
                          (m.sender_id === selectedUser?.id && m.receiver_id === user?.id) || 
                          (m.sender_id === user?.id && m.receiver_id === selectedUser?.id)
                        )
                        .map((message) => (
                          <div 
                            key={message.id} 
                            className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                          >
                            <div 
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.sender_id === user?.id 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {format(new Date(message.created_at), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
            <DialogDescription>
              Manage your conversation with {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Pin className="h-4 w-4 mr-2" />
              Pin Conversation
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Archive className="h-4 w-4 mr-2" />
              Archive Conversation
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Conversation
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};


export default Messages;