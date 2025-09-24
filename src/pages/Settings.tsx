import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  Bell,
  Shield,
  Globe,
  Palette,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  CreditCard,
  User,
  Settings as SettingsGear,
  Accessibility,
  Languages,
  AlertTriangle
} from 'lucide-react';

interface UserPreferences {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    newProducts: boolean;
    priceDrops: boolean;
    farmNews: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showPurchaseHistory: boolean;
    showReviews: boolean;
    allowLocationTracking: boolean;
    dataProcessing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    region: string;
    currency: string;
    dateFormat: string;
    measurements: 'metric' | 'imperial';
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
    colorBlind: boolean;
  };
  communication: {
    preferredContactMethod: 'email' | 'sms' | 'push';
    marketingConsent: boolean;
    surveyParticipation: boolean;
    betaProgram: boolean;
  };
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, deleteAccount, exportUserData } = useAuth();
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: {
      push: true,
      email: true,
      sms: false,
      orderUpdates: true,
      promotions: false,
      newProducts: true,
      priceDrops: true,
      farmNews: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },
    privacy: {
      profileVisibility: 'public',
      showPurchaseHistory: false,
      showReviews: true,
      allowLocationTracking: true,
      dataProcessing: true
    },
    appearance: {
      theme: 'system',
      language: 'en',
      region: 'US',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      measurements: 'metric'
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false,
      colorBlind: false
    },
    communication: {
      preferredContactMethod: 'email',
      marketingConsent: false,
      surveyParticipation: true,
      betaProgram: false
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    loadUserPreferences();
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data.preferences as unknown as UserPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const saveUserPreferences = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: preferences as any,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error Saving Settings",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords do not match or are empty.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Password Update Failed",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      const { data, error } = await exportUserData();
      
      if (error) throw error;

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farmersbracket-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await deleteAccount();
      
      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete your account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updatePreference = (path: string, value: any) => {
    const pathArray = path.split('.');
    const newPreferences = { ...preferences };
    
    let current: any = newPreferences;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    setPreferences(newPreferences);
  };

  if (!user) {
    navigate('/login');
    return null;
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
            <h1 className="text-lg font-semibold">Settings & Preferences</h1>
          </div>
          
          <Button 
            onClick={saveUserPreferences}
            disabled={isLoading}
            className="bg-primary"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications and updates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Methods */}
                  <div>
                    <h4 className="font-medium mb-4">Delivery Methods</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get instant updates on your phone</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preferences.notifications.push}
                          onCheckedChange={(checked) => updatePreference('notifications.push', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive updates via email</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preferences.notifications.email}
                          onCheckedChange={(checked) => updatePreference('notifications.email', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label>SMS Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get text messages for important updates</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preferences.notifications.sms}
                          onCheckedChange={(checked) => updatePreference('notifications.sms', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notification Types */}
                  <div>
                    <h4 className="font-medium mb-4">What to notify me about</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Order Updates</Label>
                        <Switch 
                          checked={preferences.notifications.orderUpdates}
                          onCheckedChange={(checked) => updatePreference('notifications.orderUpdates', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>New Products & Farms</Label>
                        <Switch 
                          checked={preferences.notifications.newProducts}
                          onCheckedChange={(checked) => updatePreference('notifications.newProducts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Price Drops</Label>
                        <Switch 
                          checked={preferences.notifications.priceDrops}
                          onCheckedChange={(checked) => updatePreference('notifications.priceDrops', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Promotions & Deals</Label>
                        <Switch 
                          checked={preferences.notifications.promotions}
                          onCheckedChange={(checked) => updatePreference('notifications.promotions', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Farm News & Updates</Label>
                        <Switch 
                          checked={preferences.notifications.farmNews}
                          onCheckedChange={(checked) => updatePreference('notifications.farmNews', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Quiet Hours */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Quiet Hours</h4>
                        <p className="text-sm text-muted-foreground">Don't send notifications during these hours</p>
                      </div>
                      <Switch 
                        checked={preferences.notifications.quietHours.enabled}
                        onCheckedChange={(checked) => updatePreference('notifications.quietHours.enabled', checked)}
                      />
                    </div>

                    {preferences.notifications.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={preferences.notifications.quietHours.start}
                            onChange={(e) => updatePreference('notifications.quietHours.start', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={preferences.notifications.quietHours.end}
                            onChange={(e) => updatePreference('notifications.quietHours.end', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy & Data Controls
                  </CardTitle>
                  <CardDescription>
                    Manage your privacy settings and data sharing preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Profile Visibility</Label>
                    <Select
                      value={preferences.privacy.profileVisibility}
                      onValueChange={(value: any) => updatePreference('privacy.profileVisibility', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private - Only me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Purchase History</Label>
                        <p className="text-sm text-muted-foreground">Let others see what you've bought</p>
                      </div>
                      <Switch 
                        checked={preferences.privacy.showPurchaseHistory}
                        onCheckedChange={(checked) => updatePreference('privacy.showPurchaseHistory', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show My Reviews</Label>
                        <p className="text-sm text-muted-foreground">Display your reviews publicly</p>
                      </div>
                      <Switch 
                        checked={preferences.privacy.showReviews}
                        onCheckedChange={(checked) => updatePreference('privacy.showReviews', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Location Tracking</Label>
                        <p className="text-sm text-muted-foreground">Help us find nearby farms and delivery options</p>
                      </div>
                      <Switch 
                        checked={preferences.privacy.allowLocationTracking}
                        onCheckedChange={(checked) => updatePreference('privacy.allowLocationTracking', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Data Processing Consent</Label>
                        <p className="text-sm text-muted-foreground">Allow processing for personalized recommendations</p>
                      </div>
                      <Switch 
                        checked={preferences.privacy.dataProcessing}
                        onCheckedChange={(checked) => updatePreference('privacy.dataProcessing', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance & Language
                  </CardTitle>
                  <CardDescription>
                    Customize how the app looks and feels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Theme</Label>
                    <Select
                      value={preferences.appearance.theme}
                      onValueChange={(value: any) => updatePreference('appearance.theme', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Light Mode
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark Mode
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <SettingsGear className="h-4 w-4" />
                            Follow System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Language</Label>
                    <Select
                      value={preferences.appearance.language}
                      onValueChange={(value) => updatePreference('appearance.language', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Region</Label>
                    <Select
                      value={preferences.appearance.region}
                      onValueChange={(value) => updatePreference('appearance.region', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="EU">European Union</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={preferences.appearance.currency}
                      onValueChange={(value) => updatePreference('appearance.currency', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
                        <SelectItem value="ZAR">South African Rand (R)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Measurements</Label>
                    <Select
                      value={preferences.appearance.measurements}
                      onValueChange={(value: any) => updatePreference('appearance.measurements', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric (kg, km, °C)</SelectItem>
                        <SelectItem value="imperial">Imperial (lb, mi, °F)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5" />
                    Accessibility Options
                  </CardTitle>
                  <CardDescription>
                    Customize the app to meet your accessibility needs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>High Contrast</Label>
                        <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                      </div>
                      <Switch 
                        checked={preferences.accessibility.highContrast}
                        onCheckedChange={(checked) => updatePreference('accessibility.highContrast', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Large Text</Label>
                        <p className="text-sm text-muted-foreground">Increase font sizes throughout the app</p>
                      </div>
                      <Switch 
                        checked={preferences.accessibility.largeText}
                        onCheckedChange={(checked) => updatePreference('accessibility.largeText', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Reduce Motion</Label>
                        <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                      </div>
                      <Switch 
                        checked={preferences.accessibility.reduceMotion}
                        onCheckedChange={(checked) => updatePreference('accessibility.reduceMotion', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Screen Reader Support</Label>
                        <p className="text-sm text-muted-foreground">Optimize for screen reader compatibility</p>
                      </div>
                      <Switch 
                        checked={preferences.accessibility.screenReader}
                        onCheckedChange={(checked) => updatePreference('accessibility.screenReader', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Color Blind Support</Label>
                        <p className="text-sm text-muted-foreground">Use color-blind friendly color schemes</p>
                      </div>
                      <Switch 
                        checked={preferences.accessibility.colorBlind}
                        onCheckedChange={(checked) => updatePreference('accessibility.colorBlind', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your account password for better security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button 
                    onClick={handlePasswordChange}
                    disabled={!newPassword || !confirmPassword}
                  >
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Your Data
                  </CardTitle>
                  <CardDescription>
                    Download a copy of all your data from FarmersBracket.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will include your profile information, order history, reviews, and preferences in JSON format.
                  </p>
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>

              {/* Account Deletion */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Account
                  </CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </p>
                  
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <p className="text-sm">
                          Type <strong>DELETE</strong> to confirm:
                        </p>
                        <Input
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE here"
                        />
                      </div>

                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== 'DELETE'}
                        >
                          Delete Account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;