import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Lock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/contexts/AppStateContext";
// Define the UserProfile interface
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

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useAppState();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userList, setUserList] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (user) {
      checkSubscription();
      fetchAdminId();
    }
  }, [user]);

  useEffect(() => {
    if (hasSubscription && adminId) {
      // fetchMessages(); // Removed or commented out as the function is not defined
    }
  }, [hasSubscription, adminId]);

  const checkSubscription = async () => {
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
  };

  const fetchAdminId = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
              .select('*'); // Specify the fields to retrieve
            if (error) throw error;
            setAdminId(data?.[0]?.id || null);
          } catch (error) {
            console.error("Error fetching admin ID:", error);
          }
        };
      
        useEffect(() => {
            if (user) {
              fetchUserList();
            }
          }, [user]);

          useEffect(() => {
            if (hasSubscription && selectedUser) {
              fetchMessages(selectedUser.id);
            }
          }, [hasSubscription, selectedUser]);

          // Fetch users who have chatted with this user (or admin/farmer)
          const fetchUserList = async () => {
            if (!user) return;
            try {
              // Get all unique user ids from chats where user is sender or receiver
              const { data: chatUsers, error } = await supabase
                .from("chats")
                .select("sender_id,receiver_id")
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
              if (error) throw error;
              const ids = Array.from(new Set(
                (chatUsers || [])
                  .flatMap((c) => [c.sender_id, c.receiver_id])
                  .filter((id) => id && id !== user.id)
              ));
              if (ids.length === 0) return;
              // Fetch profiles for those ids
              const { data: profiles, error: profileError } = await supabase
                .from("profiles")
                .select("id, name, image_url")
                .in("id", ids);
              if (profileError) throw profileError;
              setUserList(profiles || []);
            } catch (error) {
              console.error("Error fetching user list:", error);
            }
          };

          const fetchMessages = async (otherUserId: string) => {
            if (!user || !otherUserId) return;
            try {
              const { data, error } = await supabase
                .from("chats")
                .select("*")
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
                .order("created_at", { ascending: true });
              if (error) throw error;
              setMessages(data || []);
            } catch (error) {
              console.error("Error fetching messages:", error);
            }
          };

          const sendMessage = async () => {
            if (!newMessage.trim() || !user || !selectedUser) return;
            try {
              const { error } = await supabase
                .from("chats")
                .insert({
                  sender_id: user.id,
                  receiver_id: selectedUser.id,
                  message: newMessage.trim(),
                });
              if (error) throw error;
              setNewMessage("");
              fetchMessages(selectedUser.id);
              toast({
                title: "Message sent!",
                description: `Your message has been sent to ${selectedUser.name || "user"}.`,
              });
              addNotification({
                title: "New Message",
                message: `Message sent to ${selectedUser.name || "user"}.`,
                type: "admin",
                read: false,
              });
            } catch (error) {
              console.error("Error sending message:", error);
              toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
              });
            }
          };

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

          if (!hasSubscription) {
            return (
              <div className="min-h-screen bg-background p-4">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center mb-6">
                    <Button variant="ghost" onClick={() => navigate("/dashboard")}> <ArrowLeft className="h-4 w-4 mr-2" /> Back </Button>
                  </div>
                  <Card className="text-center">
                    <CardHeader>
                      <div className="mx-auto mb-4 p-4 bg-muted rounded-full w-fit"> <Lock className="h-8 w-8 text-muted-foreground" /> </div>
                      <CardTitle>Subscription Required</CardTitle>
                      <CardDescription> You need an active subscription to access chat features and communicate with farmers and admin. </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => navigate("/subscriptions")} className="w-full"> <MessageCircle className="h-4 w-4 mr-2" /> View Subscription Plans </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          }

          return (
            <div className="min-h-screen bg-background p-4">
              <div className="max-w-4xl mx-auto flex gap-6">
                {/* User List Sidebar */}
                <div className="w-80 border-r pr-4">
                  <h2 className="text-lg font-semibold mb-4">Chats</h2>
                  <ScrollArea className="h-[600px]">
                    {userList.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">No chats yet</div>
                    ) : (
                      <div className="space-y-2">
                        {userList.map((u) => (
                          <Card
                            key={u.id}
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${selectedUser?.id === u.id ? "bg-primary/10" : ""}`}
                            onClick={() => setSelectedUser(u)}
                          >
                            {u.image_url ? (
                              <img src={u.image_url} alt={u.name || "User"} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">{u.name?.[0] || "U"}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{u.name || "User"}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => navigate("/dashboard")}> <ArrowLeft className="h-4 w-4 mr-2" /> Back </Button>
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
                            messages.map((message) => (
                              <div key={message.id} className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg ${message.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                  <p className="text-sm">{message.message}</p>
                                  <p className="text-xs opacity-70 mt-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                      {/* Message Input */}
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
                </div>
              </div>
            </div>
          );
};

export default Messages;