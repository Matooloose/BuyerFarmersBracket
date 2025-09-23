import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Lock, MessageCircle, Home, ShoppingCart, Package, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/contexts/AppStateContext";

interface UserProfile {
  id: string;
  name: string;
  image_url: string | null;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

const Messages: React.FC = () => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { cartItems, getTotalItems } = useCart();
  const bottomNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Package, label: "Track", path: "/track-order" },
    { icon: Search, label: "Browse", path: "/browse-products" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
  ];
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification, notifications } = useAppState();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [userList, setUserList] = useState<UserProfile[]>([]);

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

  const fetchAdminId = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      setAdminId(data?.[0]?.id || null);
    } catch (error) {
      console.error("Error fetching admin ID:", error);
    }
  }, []);

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
              type: "admin",
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
            notif.type === "admin" &&
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
    try {
      const { error } = await supabase
        .from("chats")
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message: newMessage.trim()
        });
      if (error) throw error;
      setNewMessage("");
      fetchMessages(selectedUser.id);
      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${selectedUser.name ? selectedUser.name : "user"}.`,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  }, [newMessage, user, selectedUser, fetchMessages, toast]);

  useEffect(() => {
    if (user) {
      checkSubscription();
      fetchAdminId();
    }
  }, [user, checkSubscription, fetchAdminId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}> <ArrowLeft className="h-4 w-4 mr-2" /> Back </Button>
          </div>
          <div className="text-center">Checking subscription status...</div>
        </div>
      </div>
      );
    }


return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {showChatList ? (
          <>
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}> <ArrowLeft className="h-4 w-4 mr-2" /> Back </Button>
              <h2 className="text-lg font-semibold ml-2">Chats</h2>
            </div>
            <ScrollArea className="h-[380px] mb-6">
              {userList.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No chats yet</div>
              ) : (
                <div className="space-y-2">
                  {userList.map((u) => {
                    const lastMsg = messages
                      .filter(m => m.sender_id === u.id && m.receiver_id === user?.id)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                    return (
                      <Card
                        key={u.id}
                        className={"flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors" + (selectedUser?.id === u.id ? " bg-primary/10" : "")}
                        onClick={() => {
                          setSelectedUser(u);
                          setShowChatList(false);
                        }}
                      >
                        {u.image_url ? (
                          <img src={u.image_url} alt={u.name ? u.name : "User"} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">{u.name && u.name[0] ? u.name[0] : "U"}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{u.name ? u.name : "User"}</p>
                          {lastMsg && (
                            <p className="text-xs text-muted-foreground truncate">{lastMsg.message.slice(0, 40)}{lastMsg.message.length > 40 ? "..." : ""}</p>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => setShowChatList(true)}> <ArrowLeft className="h-4 w-4 mr-2" /> Back </Button>
              <h1 className="text-xl font-semibold">Messenger</h1>
              <div></div>
            </div>
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{selectedUser ? selectedUser.name || "User" : "Select a chat"}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 mb-4 pr-4">
                  <div className="space-y-4">
                    {selectedUser && messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">No messages yet. Start a conversation!</div>
                    ) : (
                      messages
                        .filter(m => (m.sender_id === selectedUser?.id && m.receiver_id === user?.id) || (m.sender_id === user?.id && m.receiver_id === selectedUser?.id))
                        .map((message) => (
                          <div key={message.id} className={"flex " + (message.sender_id === user?.id ? "justify-end" : "justify-start") }>
                            <div className={"max-w-[80%] p-3 rounded-lg " + (message.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted") }>
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
                {selectedUser && (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}> <Send className="h-4 w-4" /> </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      {/* Single Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-strong">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center px-3 py-2 h-auto`}
              onClick={() => navigate(item.path)}
            >
              <div className="relative">
                <item.icon className="h-5 w-5 mb-1" />
                {item.label === "Cart" && getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0.5 rounded-full bg-primary text-white">
                    {getTotalItems()}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
};


export default Messages;