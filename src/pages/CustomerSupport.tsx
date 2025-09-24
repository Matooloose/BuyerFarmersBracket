import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, MessageSquare, User, Clock, AlertCircle, 
  CheckCircle, XCircle, ArrowLeft, Send, RefreshCcw 
} from 'lucide-react';

// Database interfaces matching actual schema
interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  messages?: SupportMessage[];
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  content: string;
  author_type: string;
  author: string;
  created_at: string;
}

interface NewTicket {
  title: string;
  description: string;
  category: string;
  priority: string;
}

const CustomerSupport: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New ticket form state
  const [newTicket, setNewTicket] = useState<NewTicket>({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });
  
  // Message composition state
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Load user's support tickets
  const loadTickets = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          support_messages(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading support tickets:', error);
        setTickets([]);
        return;
      }

      const transformedTickets: SupportTicket[] = (ticketsData || []).map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        user_id: ticket.user_id,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        messages: (ticket.support_messages || []).map((msg: any) => ({
          id: msg.id,
          ticket_id: msg.ticket_id,
          content: msg.content,
          author_type: msg.author_type,
          author: msg.author,
          created_at: msg.created_at
        }))
      }));

      setTickets(transformedTickets);
      
    } catch (error) {
      console.error('Error loading support tickets:', error);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new support ticket
  const createTicket = async () => {
    if (!user) return;
    
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and description for your ticket.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          status: 'open',
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating support ticket:', error);
        toast({
          title: "Error",
          description: "Failed to submit your support request. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Support Request Submitted",
        description: "Your support request has been submitted successfully. We'll get back to you soon!",
      });
      
      setShowTicketForm(false);
      setNewTicket({ title: '', description: '', category: 'other', priority: 'medium' });
      
      // Reload tickets to show the new one
      await loadTickets();
      
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send message to ticket
  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user) return;

    setIsSendingMessage(true);
    
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          content: newMessage.trim(),
          author_type: 'customer',
          author: user.user_metadata?.name || user.email || 'Customer'
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send your message. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setNewMessage('');
      
      // Reload the selected ticket to show the new message
      await loadTicketMessages(selectedTicket.id);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Load messages for a specific ticket
  const loadTicketMessages = async (ticketId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading ticket messages:', error);
        return;
      }

      // Update the selected ticket with new messages
      setSelectedTicket(prev => {
        if (!prev || prev.id !== ticketId) return prev;
        return {
          ...prev,
          messages: (messagesData || []).map((msg: any) => ({
            id: msg.id,
            ticket_id: msg.ticket_id,
            content: msg.content,
            author_type: msg.author_type,
            author: msg.author,
            created_at: msg.created_at
          }))
        };
      });
      
    } catch (error) {
      console.error('Error loading ticket messages:', error);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user]);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to access customer support.</p>
        </div>
      </div>
    );
  }

  // If viewing a specific ticket
  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedTicket(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tickets
            </Button>
            <h1 className="text-2xl font-bold">Support Ticket</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{selectedTicket.title}</CardTitle>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge variant="outline">
                      {selectedTicket.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Created: {formatDate(selectedTicket.created_at)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{selectedTicket.description}</p>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((message) => (
                    <div key={message.id} className={`p-4 rounded-lg ${
                      message.author_type === 'customer' 
                        ? 'bg-blue-50 ml-8' 
                        : 'bg-gray-50 mr-8'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{message.author}</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(message.created_at)}
                        </span>
                        <Badge variant={message.author_type === 'customer' ? 'default' : 'secondary'}>
                          {message.author_type}
                        </Badge>
                      </div>
                      <p className="text-gray-700">{message.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No messages yet</p>
                )}
              </div>

              {/* New Message Form */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="self-end gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSendingMessage ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main tickets list view
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Customer Support</h1>
          <div className="flex gap-2">
            <Button onClick={loadTickets} variant="outline" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Support Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Support Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of your issue"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Order Issues</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="product">Product Quality</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="technical">Technical Issues</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTicket.priority} onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={createTicket} 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading your support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Support Tickets</h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any support requests yet.
              </p>
              <Button onClick={() => setShowTicketForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTicket(ticket)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium truncate">{ticket.title}</h3>
                      <p className="text-sm text-gray-600 truncate mt-1">{ticket.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline">
                          {ticket.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ticket.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {ticket.messages?.length || 0} messages
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSupport;