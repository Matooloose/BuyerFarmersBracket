import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  Smile,
  MapPin,
  Calendar,
  X,
  FileText,
  Video
} from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (content: string, attachments?: File[], messageType?: string) => Promise<void>;
  recipientName?: string;
  disabled?: boolean;
  placeholder?: string;
}

interface Attachment {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  recipientName = 'farmer',
  disabled = false,
  placeholder = 'Type your message...'
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Pre-defined message templates for common farmer communications
  const messageTemplates = [
    {
      id: 'availability',
      title: 'Product Availability',
      content: `Hi! I'm interested in your products. Could you please let me know what's currently available and when you expect the next harvest?`,
      category: 'inquiry'
    },
    {
      id: 'delivery',
      title: 'Delivery Question',
      content: `Hello! I'd like to know about delivery options to my area. What are your delivery days and minimum order requirements?`,
      category: 'logistics'
    },
    {
      id: 'organic',
      title: 'Organic Certification',
      content: `Hi there! I'm particularly interested in organic produce. Do you have organic certification for your products?`,
      category: 'quality'
    },
    {
      id: 'bulk',
      title: 'Bulk Order',
      content: `Hello! I'm interested in placing a bulk order. Could you provide pricing for larger quantities and any available discounts?`,
      category: 'business'
    },
    {
      id: 'seasonal',
      title: 'Seasonal Produce',
      content: `Hi! What seasonal produce do you currently have available, and what should I expect in the coming weeks?`,
      category: 'seasonal'
    },
    {
      id: 'custom',
      title: 'Custom Request',
      content: `Hello! I have a specific request for my order. Could we discuss some customization options?`,
      category: 'custom'
    }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Please choose a smaller file.`,
          variant: "destructive",
        });
        return;
      }

      const attachment: Attachment = {
        file,
        type: getFileType(file.type)
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, attachment]);
      }
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const getFileType = (mimeType: string): Attachment['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) {
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(
        message.trim(), 
        attachments.map(a => a.file),
        attachments.length > 0 ? 'multimedia' : 'text'
      );
      
      setMessage('');
      setAttachments([]);
      
      toast({
        title: "Message sent",
        description: `Your message was sent to ${recipientName}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelect = (template: typeof messageTemplates[0]) => {
    setMessage(template.content);
    setShowTemplates(false);
  };

  const getFileIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Mic className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <Paperclip className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-t">
      <CardContent className="p-4 space-y-3">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative">
                {attachment.type === 'image' && attachment.preview ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <img 
                      src={attachment.preview} 
                      alt={attachment.file.name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-background rounded border">
                    {getFileIcon(attachment.type)}
                    <span className="text-xs max-w-20 truncate">{attachment.file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* File Attachment */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSending}
              className="text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              aria-label="Upload attachments"
            />

            {/* Message Templates */}
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled || isSending}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Message Templates</DialogTitle>
                  <DialogDescription>
                    Choose a template to start your conversation with {recipientName}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {messageTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{template.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Character count for longer messages */}
            {message.length > 100 && (
              <span className="text-xs text-muted-foreground">
                {message.length}/500
              </span>
            )}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
            className="min-w-[80px]"
          >
            {isSending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>

        {/* Quick tip */}
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>💡 Pro tip: Press Ctrl+Enter to send quickly</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageComposer;