import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Headphones, Mail, Phone, MessageCircle, Clock, Upload, 
  FileText, Image as ImageIcon, Video as VideoIcon, File as FileIcon,
  X, AlertTriangle, Info, Shield, Search, Filter, Tag, Calendar,
  User, Star, CheckCircle, ExternalLink, Download, Eye, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Enhanced interfaces
interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedAgent?: string;
  estimatedResolution?: string;
  attachments: TicketAttachment[];
  messages: TicketMessage[];
  tags: string[];
  satisfactionRating?: number;
  resolutionTime?: number;
}

interface TicketAttachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  url: string;
  thumbnailUrl?: string;
}

interface TicketMessage {
  id: string;
  content: string;
  author: string;
  authorType: 'customer' | 'agent' | 'system';
  timestamp: string;
  attachments?: TicketAttachment[];
}

interface KnowledgeBaseSuggestion {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  relevanceScore: number;
  url: string;
  type: 'faq' | 'guide' | 'video' | 'troubleshoot';
}

interface ServiceLevel {
  priority: string;
  responseTime: string;
  resolutionTime: string;
  availability: string;
  escalationPath: string[];
}

interface EmergencyContact {
  type: 'phone' | 'email' | 'chat';
  label: string;
  value: string;
  availability: string;
  description: string;
}

const ContactSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [activeTab, setActiveTab] = useState('new-ticket');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [knowledgeBaseSuggestions, setKnowledgeBaseSuggestions] = useState<KnowledgeBaseSuggestion[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    category: searchParams.get('category') || '',
    priority: 'medium' as const,
    subject: '',
    message: '',
    tags: [] as string[]
  });

  // File upload state
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  // Dialog states
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
  const [isSLADialogOpen, setIsSLADialogOpen] = useState(false);

  // Filter state
  const [ticketFilter, setTicketFilter] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    sortBy: 'recent'
  });

  // State for support tickets and data loading
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSupportTickets();
    }
  }, [user]);

  const loadSupportTickets = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('User ID is required to load support tickets');
        return;
      }

      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          support_messages (
            *
          ),
          support_attachments (
            *
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedTickets: SupportTicket[] = (tickets || []).map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category as any,
        priority: ticket.priority as any,
        status: ticket.status as any,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        assignedAgent: ticket.assigned_agent || undefined,
        estimatedResolution: ticket.estimated_resolution || undefined,
        satisfactionRating: ticket.satisfaction_rating || undefined,
        resolutionTime: ticket.resolution_time || undefined,
        tags: ticket.tags || [],
        attachments: (ticket.support_attachments || []).map((att: any) => ({
          id: att.id,
          filename: att.filename,
          fileType: att.file_type,
          fileSize: att.file_size,
          uploadedAt: att.uploaded_at,
          url: att.url,
          thumbnailUrl: att.thumbnail_url || undefined
        })),
        messages: (ticket.support_messages || []).map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          author: msg.author,
          authorType: msg.author_type as any,
          timestamp: msg.created_at
        }))
      }));

      setSupportTickets(transformedTickets);
    } catch (error) {
      console.error('Error loading support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Static service levels - could be moved to database later
  const serviceLevels: ServiceLevel[] = [
    {
      priority: 'Low',
      responseTime: '48 hours',
      resolutionTime: '5 business days',
      availability: 'Business hours',
      escalationPath: ['Level 1 Support', 'Level 2 Support', 'Manager']
    },
    {
      priority: 'Medium',
      responseTime: '24 hours',
      resolutionTime: '3 business days',
      availability: 'Business hours',
      escalationPath: ['Level 1 Support', 'Level 2 Support', 'Senior Agent', 'Manager']
    },
    {
      priority: 'High',
      responseTime: '8 hours',
      resolutionTime: '2 business days',
      availability: 'Extended hours',
      escalationPath: ['Level 2 Support', 'Senior Agent', 'Manager', 'Director']
    },
    {
      priority: 'Urgent',
      responseTime: '2 hours',
      resolutionTime: 'Same day',
      availability: '24/7',
      escalationPath: ['Senior Agent', 'Manager', 'Director', 'Emergency Team']
    }
  ];

  const emergencyContacts: EmergencyContact[] = [
    {
      type: 'phone',
      label: 'Emergency Hotline',
      value: '+27 11 999 0000',
      availability: '24/7',
      description: 'For payment fraud, account security, or urgent delivery issues'
    },
    {
      type: 'email',
      label: 'Emergency Email',
      value: 'emergency@farmersbracket.com',
      availability: '24/7 monitoring',
      description: 'Critical system issues or security concerns'
    },
    {
      type: 'chat',
      label: 'Priority Chat',
      value: 'priority-chat',
      availability: '24/7',
      description: 'Immediate assistance for urgent matters'
    }
  ];

  useEffect(() => {
    // Load user's existing tickets
    if (user) {
      setActiveTab('ticket-history');
    }

    // Set initial category from URL params
    const category = searchParams.get('category');
    if (category) {
      setFormData(prev => ({ ...prev, category }));
    }
  }, [user, searchParams]);

  useEffect(() => {
    // Generate knowledge base suggestions based on form data
    if (formData.message || formData.subject) {
      const suggestions = generateKnowledgeBaseSuggestions(formData.message + ' ' + formData.subject);
      setKnowledgeBaseSuggestions(suggestions);
    }
  }, [formData.message, formData.subject]);

  const generateKnowledgeBaseSuggestions = (query: string): KnowledgeBaseSuggestion[] => {
    const suggestions: KnowledgeBaseSuggestion[] = [
      {
        id: 'kb1',
        title: 'How to troubleshoot payment issues',
        excerpt: 'Step-by-step guide to resolve common payment problems including card errors and processing failures.',
        category: 'Payments',
        relevanceScore: 0.95,
        url: '/faq#payment-issues',
        type: 'guide'
      },
      {
        id: 'kb2',
        title: 'Delivery policy and tracking',
        excerpt: 'Learn about our delivery windows, tracking system, and what to do if your order is delayed.',
        category: 'Delivery',
        relevanceScore: 0.87,
        url: '/faq#delivery-tracking',
        type: 'faq'
      },
      {
        id: 'kb3',
        title: 'Mobile app troubleshooting',
        excerpt: 'Fix common mobile app issues including crashes, login problems, and sync errors.',
        category: 'Technical',
        relevanceScore: 0.82,
        url: '/how-it-works#mobile-troubleshooting',
        type: 'troubleshoot'
      }
    ];

    // Filter based on query relevance
    return suggestions.filter(s => 
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.excerpt.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive"
        });
        return false;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf', 'text/plain', 'application/zip'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    });

    setAttachments(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(file => {
      const fileId = file.name + file.size;
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      }, 200);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission with file upload
    setTimeout(() => {
      const ticketId = `TICK-${new Date().getFullYear()}-${String(supportTickets.length + 1).padStart(3, '0')}`;
      
      toast({
        title: "Support ticket created",
        description: `Your ticket ${ticketId} has been submitted. We'll respond within ${getResponseTime(formData.priority)}.`,
      });
      
      setIsSubmitting(false);
      setActiveTab('ticket-history');
      
      // Reset form
      setFormData({
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        category: '',
        priority: 'medium',
        subject: '',
        message: '',
        tags: []
      });
      setAttachments([]);
      setUploadProgress({});
    }, 2000);
  };

  const getResponseTime = (priority: string) => {
    const sla = serviceLevels.find(s => s.priority.toLowerCase() === priority);
    return sla?.responseTime || '24 hours';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_customer': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType.startsWith('video/')) return VideoIcon;
    if (fileType === 'application/pdf') return FileText;
    return FileIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesStatus = ticketFilter.status === 'all' || ticket.status === ticketFilter.status;
    const matchesPriority = ticketFilter.priority === 'all' || ticket.priority === ticketFilter.priority;
    const matchesCategory = ticketFilter.category === 'all' || ticket.category === ticketFilter.category;
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  }).sort((a, b) => {
    switch (ticketFilter.sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default: // recent
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Contact Support</h1>
                <p className="text-sm text-muted-foreground">Get help from our support team</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEmergencyDialogOpen(true)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Emergency
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSLADialogOpen(true)}>
                <Info className="h-4 w-4 mr-2" />
                SLA Info
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Quick Stats */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">2h</p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">98%</p>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">24/7</p>
                <p className="text-sm text-muted-foreground">Emergency Support</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">4.9★</p>
                <p className="text-sm text-muted-foreground">Satisfaction Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new-ticket">New Ticket</TabsTrigger>
            <TabsTrigger value="ticket-history">Ticket History</TabsTrigger>
            <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          </TabsList>

          {/* New Ticket Tab */}
          <TabsContent value="new-ticket" className="space-y-6">
            {/* Support Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/messages?support=true')}>
                <CardContent className="p-6">
                  <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Chat with support agents in real-time
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Available Now
                  </Badge>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open('tel:+27123456789')}>
                <CardContent className="p-6">
                  <Phone className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">+27 11 123 4567</p>
                  <Badge variant="secondary" className="text-xs">8 AM - 6 PM</Badge>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open('mailto:support@farmersbracket.com')}>
                <CardContent className="p-6">
                  <Mail className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">support@farmersbracket.com</p>
                  <Badge variant="secondary" className="text-xs">24h Response</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Form */}
            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>
                  Provide detailed information about your issue for faster resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  {/* Category and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">Payment Issues</SelectItem>
                          <SelectItem value="delivery">Delivery Problems</SelectItem>
                          <SelectItem value="account">Account Support</SelectItem>
                          <SelectItem value="technical">Technical Issues</SelectItem>
                          <SelectItem value="product">Product Quality</SelectItem>
                          <SelectItem value="farmer">Farmer Communication</SelectItem>
                          <SelectItem value="subscription">Subscription Management</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - General inquiry</SelectItem>
                          <SelectItem value="medium">Medium - Standard issue</SelectItem>
                          <SelectItem value="high">High - Urgent assistance needed</SelectItem>
                          <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject and Message */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Detailed Description *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Please provide as much detail as possible about your issue..."
                        rows={6}
                        required
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Attachments (Optional)</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop files here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Supports: Images, Videos, PDFs, Text files (Max 10MB each)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*,video/*,.pdf,.txt,.zip"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        aria-label="Upload attachments"
                      />
                    </div>

                    {/* Uploaded Files */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Attached Files:</h4>
                        <div className="space-y-2">
                          {attachments.map((file, index) => {
                            const fileId = file.name + file.size;
                            const progress = uploadProgress[fileId] || 0;
                            const FileIconComponent = getFileIcon(file.type);
                            
                            return (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                <FileIconComponent className="h-8 w-8 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                  {progress < 100 && (
                                    <Progress value={progress} className="mt-1 h-1" />
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAttachment(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Level Agreement Info */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Expected Response Time</h4>
                    <p className="text-sm text-blue-700">
                      Based on your selected priority ({formData.priority}), you can expect a response within{' '}
                      <strong>{getResponseTime(formData.priority)}</strong>.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Support Ticket'
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Knowledge Base Suggestions */}
            {knowledgeBaseSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Solutions
                  </CardTitle>
                  <CardDescription>
                    These articles might help resolve your issue instantly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {knowledgeBaseSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{suggestion.excerpt}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
                              <Badge variant="secondary" className="text-xs">{suggestion.type}</Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate(suggestion.url)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Ticket History Tab */}
          <TabsContent value="ticket-history" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={ticketFilter.status} onValueChange={(value) => setTicketFilter(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_customer">Waiting</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={ticketFilter.priority} onValueChange={(value) => setTicketFilter(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={ticketFilter.sortBy} onValueChange={(value) => setTicketFilter(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No tickets found</h3>
                    <p className="text-sm text-muted-foreground">
                      {supportTickets.length === 0 
                        ? "You haven't submitted any support tickets yet."
                        : "No tickets match your current filters."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{ticket.title}</h4>
                            <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {ticket.id}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            {ticket.assignedAgent && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {ticket.assignedAgent}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {ticket.satisfactionRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{ticket.satisfactionRating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {ticket.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ticket.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge-base" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Knowledge Base
                </CardTitle>
                <CardDescription>
                  Find instant answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: "Payment Issues", description: "Troubleshoot payment problems", icon: "💳", url: "/faq#payments" },
                    { title: "Delivery Questions", description: "Track orders and delivery info", icon: "🚚", url: "/faq#delivery" },
                    { title: "Account Management", description: "Profile and subscription help", icon: "👤", url: "/faq#account" },
                    { title: "Product Quality", description: "Freshness and quality concerns", icon: "🥬", url: "/faq#quality" },
                    { title: "Mobile App Help", description: "App features and troubleshooting", icon: "📱", url: "/faq#mobile" },
                    { title: "Farm Communication", description: "Connect with farmers", icon: "🌾", url: "/faq#farmers" }
                  ].map((item, index) => (
                    <Card key={index} className="text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(item.url)}>
                      <CardContent className="p-4">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {selectedTicket?.id} - {selectedTicket?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6 overflow-y-auto">
              {/* Ticket Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="font-semibold">
                    <Badge className={`text-xs ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Priority</span>
                  <p className="font-semibold">
                    <Badge className={`text-xs ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Assigned Agent</span>
                  <p className="font-semibold text-sm">{selectedTicket.assignedAgent || 'Unassigned'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Created</span>
                  <p className="font-semibold text-sm">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h4 className="font-semibold">Messages</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className={`p-3 rounded-lg ${
                      message.authorType === 'customer' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.author}</span>
                        <Badge variant="outline" className="text-xs">
                          {message.authorType}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              {selectedTicket.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Attachments</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedTicket.attachments.map((attachment) => {
                      const FileIconComponent = getFileIcon(attachment.fileType);
                      return (
                        <div key={attachment.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FileIconComponent className="h-6 w-6 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{attachment.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.fileSize)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Close
            </Button>
            <Button onClick={() => navigate('/messages?support=true')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Continue Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Contact Dialog */}
      <Dialog open={isEmergencyDialogOpen} onOpenChange={setIsEmergencyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Emergency Contact Information
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">When to Use Emergency Contact</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Payment fraud or unauthorized charges</li>
                <li>• Account security breaches</li>
                <li>• Critical delivery issues (missing perishables)</li>
                <li>• System-wide outages affecting orders</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      {contact.type === 'phone' && <Phone className="h-5 w-5 text-red-600" />}
                      {contact.type === 'email' && <Mail className="h-5 w-5 text-red-600" />}
                      {contact.type === 'chat' && <MessageCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{contact.label}</h4>
                      <p className="text-sm text-primary font-medium">{contact.value}</p>
                      <p className="text-xs text-muted-foreground">{contact.availability}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{contact.description}</p>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmergencyDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SLA Information Dialog */}
      <Dialog open={isSLADialogOpen} onOpenChange={setIsSLADialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Service Level Agreement
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Our Commitment to You</h4>
              <p className="text-sm text-blue-700">
                We guarantee response times based on priority levels and provide escalation paths for unresolved issues.
              </p>
            </div>
            
            <div className="space-y-4">
              {serviceLevels.map((level, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{level.priority} Priority</h4>
                    <Badge className={`${getPriorityColor(level.priority.toLowerCase())}`}>
                      {level.priority}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Response Time:</span>
                      <p className="font-medium">{level.responseTime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resolution Time:</span>
                      <p className="font-medium">{level.resolutionTime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Availability:</span>
                      <p className="font-medium">{level.availability}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Escalation:</span>
                      <p className="font-medium">{level.escalationPath.length} levels</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Quality Guarantee</h4>
              <p className="text-sm text-green-700">
                If we don't meet our SLA commitments, we'll provide service credits or compensation as appropriate.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSLADialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContactSupport;