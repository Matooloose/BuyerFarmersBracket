import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  Flag,
  Pin,
  Users,
  Sprout,
  Lightbulb,
  HelpCircle,
  Megaphone,
  TrendingUp,
  Clock,
  Eye,
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Trophy,
  Heart,
  Star,
  Camera,
  Video,
  FileText,
  Link,
  Hash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    image_url: string;
    role: string;
    reputation: number;
    farm_name?: string;
    location?: string;
  };
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  replies_count: number;
  views_count: number;
  is_pinned: boolean;
  is_solved: boolean;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  last_reply?: {
    author: string;
    created_at: string;
  };
}

interface ForumReply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    image_url: string;
    role: string;
    reputation: number;
  };
  created_at: string;
  likes_count: number;
  is_liked?: boolean;
  is_solution?: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  posts_count: number;
}

const CommunityFeatures: React.FC = () => {
  const navigate = useNavigate();
  const { category, postId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [filterBy, setFilterBy] = useState<'all' | 'unanswered' | 'solved'>('all');
  const [activeTab, setActiveTab] = useState<'forum' | 'events' | 'groups'>('forum');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  });
  const [newReply, setNewReply] = useState('');

  const categories: ForumCategory[] = [
    {
      id: 'general',
      name: 'General Discussion',
      description: 'General farming topics and discussions',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-700',
      posts_count: 145
    },
    {
      id: 'growing-tips',
      name: 'Growing Tips',
      description: 'Share and learn growing techniques',
      icon: Sprout,
      color: 'bg-green-100 text-green-700',
      posts_count: 89
    },
    {
      id: 'innovation',
      name: 'Innovation & Tech',
      description: 'Farming technology and innovations',
      icon: Lightbulb,
      color: 'bg-purple-100 text-purple-700',
      posts_count: 67
    },
    {
      id: 'questions',
      name: 'Questions & Answers',
      description: 'Ask questions and get answers',
      icon: HelpCircle,
      color: 'bg-orange-100 text-orange-700',
      posts_count: 123
    },
    {
      id: 'announcements',
      name: 'Announcements',
      description: 'Official platform announcements',
      icon: Megaphone,
      color: 'bg-red-100 text-red-700',
      posts_count: 12
    }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadPosts();
  }, [user, category, sortBy, filterBy]);

  useEffect(() => {
    if (postId && posts.length > 0) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        setSelectedPost(post);
        loadReplies(postId);
      }
    }
  }, [postId, posts]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      // No forum tables exist in database yet - show empty state
      setPosts([]);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error Loading Posts",
        description: "Failed to load forum posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadReplies = async (postId: string) => {
    try {
      // No forum tables exist in database yet - show empty state
      setReplies([]);
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const createPost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;

    toast({
      title: "Feature Coming Soon",
      description: "Community forum is not yet available. Please use customer support for assistance.",
      variant: "default",
    });

    setNewPost({ title: '', content: '', category: '', tags: '' });
    setShowCreatePost(false);
  };

  const toggleLike = async (postId: string) => {
    // Feature not available yet
    toast({
      title: "Feature Coming Soon",
      description: "Community features are not yet available.",
      variant: "default",
    });
  };

  const toggleBookmark = async (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, is_bookmarked: !post.is_bookmarked }
        : post
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading community...</p>
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
            <h1 className="text-lg font-semibold">Community</h1>
            <Badge variant="secondary">{posts.length} posts</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setShowCreatePost(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'forum' | 'events' | 'groups')}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="forum" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Forum
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Groups
            </TabsTrigger>
          </TabsList>

          {/* Forum Tab */}
          <TabsContent value="forum" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant={!category || category === 'all' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => navigate('/community')}
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      All Categories
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={category === cat.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => navigate(`/community/category/${cat.id}`)}
                      >
                        <cat.icon className="h-4 w-4 mr-2" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{cat.name}</div>
                          <div className="text-xs text-muted-foreground">{cat.posts_count} posts</div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts, topics, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(value: 'latest' | 'popular' | 'trending') => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Latest</SelectItem>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterBy} onValueChange={(value: 'all' | 'unanswered' | 'solved') => setFilterBy(value)}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Posts</SelectItem>
                        <SelectItem value="unanswered">Unanswered</SelectItem>
                        <SelectItem value="solved">Solved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Posts List or Post Detail */}
                {selectedPost ? (
                  /* Post Detail View */
                  <div className="space-y-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedPost(null);
                        navigate('/community');
                      }}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Posts
                    </Button>

                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {selectedPost.is_pinned && (
                                <Pin className="h-4 w-4 text-primary" />
                              )}
                              {selectedPost.is_solved && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              <Badge variant="outline">
                                {categories.find(c => c.id === selectedPost.category)?.name}
                              </Badge>
                            </div>
                            <CardTitle className="text-xl">{selectedPost.title}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={selectedPost.author.image_url} />
                                  <AvatarFallback>{selectedPost.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{selectedPost.author.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {selectedPost.author.role}
                                </Badge>
                              </div>
                              <span>{formatDistanceToNow(new Date(selectedPost.created_at))} ago</span>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {selectedPost.views_count} views
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none mb-6">
                          <p>{selectedPost.content}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                          {selectedPost.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4">
                            <Button 
                              variant={selectedPost.is_liked ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleLike(selectedPost.id)}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {selectedPost.likes_count}
                            </Button>
                            <Button variant="outline" size="sm">
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              {selectedPost.dislikes_count}
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {selectedPost.replies_count} replies
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant={selectedPost.is_bookmarked ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleBookmark(selectedPost.id)}
                            >
                              <Bookmark className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Flag className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Replies */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {replies.map((reply) => (
                          <div key={reply.id} className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={reply.author.image_url} />
                                <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{reply.author.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {reply.author.role}
                                  </Badge>
                                  {reply.is_solution && (
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Solution
                                    </Badge>
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.created_at))} ago
                                  </span>
                                </div>
                                <p className="text-sm mb-3">{reply.content}</p>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant={reply.is_liked ? "default" : "outline"}
                                    size="sm"
                                  >
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    {reply.likes_count}
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    Reply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        <Separator />

                        {/* Reply Form */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Add a reply</h4>
                          <Textarea
                            placeholder="Write your reply..."
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button disabled={!newReply.trim()}>Post Reply</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  /* Posts List View */
                  <div className="space-y-4">
                    {posts.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                        <p className="text-muted-foreground mb-4">
                          Be the first to start a discussion in this category!
                        </p>
                        <Button onClick={() => setShowCreatePost(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Post
                        </Button>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <Card 
                          key={post.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedPost(post);
                            navigate(`/community/post/${post.id}`);
                          }}
                        >
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    {post.is_pinned && (
                                      <Pin className="h-4 w-4 text-primary" />
                                    )}
                                    {post.is_solved && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {categories.find(c => c.id === post.category)?.name}
                                    </Badge>
                                  </div>
                                  <h3 className="font-semibold text-lg hover:text-primary">
                                    {post.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {post.content}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {post.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Button 
                                  variant={post.is_bookmarked ? "default" : "outline"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(post.id);
                                  }}
                                >
                                  <Bookmark className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={post.author.image_url} />
                                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{post.author.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {post.author.role}
                                    </Badge>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(post.created_at))} ago
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {post.likes_count}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {post.replies_count}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {post.views_count}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Events Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Community events, workshops, and farming meetups will be available here soon.
              </p>
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Groups Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Connect with other customers and share experiences about fresh produce.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
              <CardDescription>
                Share your knowledge and start a discussion with the community.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title for your post"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newPost.category} 
                  onValueChange={(value) => setNewPost({...newPost, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content here..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="min-h-[200px]"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (optional)</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas (e.g. organic, vegetables, tips)"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreatePost(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createPost}
                  disabled={!newPost.title.trim() || !newPost.content.trim() || !newPost.category}
                >
                  Create Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CommunityFeatures;