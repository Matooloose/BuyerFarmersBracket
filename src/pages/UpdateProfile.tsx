import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
<<<<<<< HEAD
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Camera, User, Key, Trash2, Download, CheckCircle, Shield, 
  Clock, MapPin, Bell, Lock, Eye, EyeOff, Smartphone, Globe, 
  AlertTriangle, FileText, Settings, Monitor, Wifi, Battery
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
=======
import { ArrowLeft, Camera, User, Key, Trash2, Download, Bell, LogOut } from "lucide-react";
import { Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client"; 
import BottomNav from "@/components/BottomNav";

export default function UpdateProfileWrapper() {
  return (
    <>
      <UpdateProfile />
      <BottomNav />
    </>
  );
}
>>>>>>> aeb7aacc8daba24402f7cfa7daf6ee404e6afaef

// Enhanced interfaces for comprehensive profile management
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  address: string;
}

interface DeliveryPreferences {
  leaveAtDoor: boolean;
  specificInstructions: string;
  preferredTimeSlot: string;
  contactPreference: 'call' | 'sms' | 'app';
  doorBellRing: boolean;
  safeLocation: string;
  accessCode: string;
}

interface CommunicationPreferences {
  orderUpdates: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketing: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  recommendations: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  promotions: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  newsletter: {
    email: boolean;
    sms: boolean;
  };
  farmerMessages: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

interface SecuritySession {
  id: string;
  deviceName: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
}

interface LoginHistory {
  id: string;
  timestamp: Date;
  location: string;
  device: string;
  ipAddress: string;
  success: boolean;
  method: 'password' | 'google' | 'facebook';
}

interface ProfileCompleteness {
  score: number;
  suggestions: {
    field: string;
    description: string;
    points: number;
    completed: boolean;
  }[];
}

interface DataExportOption {
  type: 'profile' | 'orders' | 'reviews' | 'complete';
  format: 'json' | 'csv' | 'pdf';
  description: string;
  estimatedSize: string;
}

const UpdateProfile = () => {
<<<<<<< HEAD
=======
  // Handler for dark mode toggle
  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Handler for notifications toggle
  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem('notifications', checked ? 'true' : 'false');
  };
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
>>>>>>> aeb7aacc8daba24402f7cfa7daf6ee404e6afaef
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Email verification enforcement
  const isEmailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  
  // Core state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    address: ''
  });

  // Enhanced feature state
  const [deliveryPreferences, setDeliveryPreferences] = useState<DeliveryPreferences>({
    leaveAtDoor: false,
    specificInstructions: '',
    preferredTimeSlot: 'anytime',
    contactPreference: 'app',
    doorBellRing: true,
    safeLocation: '',
    accessCode: ''
  });

  const [communicationPreferences, setCommunicationPreferences] = useState<CommunicationPreferences>({
    orderUpdates: { email: true, sms: true, push: true },
    marketing: { email: false, sms: false, push: false },
    recommendations: { email: true, sms: false, push: true },
    promotions: { email: false, sms: false, push: true },
    newsletter: { email: true, sms: false },
    farmerMessages: { email: true, sms: true, push: true }
  });

  const [securitySessions, setSecuritySessions] = useState<SecuritySession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [profileCompleteness, setProfileCompleteness] = useState<ProfileCompleteness>({
    score: 0,
    suggestions: []
  });

  // Enhanced form state
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [selectedExportOption, setSelectedExportOption] = useState<DataExportOption | null>(null);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const dataExportOptions: DataExportOption[] = [
    {
      type: 'profile',
      format: 'json',
      description: 'Your profile information and preferences',
      estimatedSize: '2 KB'
    },
    {
      type: 'orders',
      format: 'csv',
      description: 'Complete order history with details',
      estimatedSize: '150 KB'
    },
    {
      type: 'reviews',
      format: 'json',
      description: 'All your product reviews and ratings',
      estimatedSize: '45 KB'
    },
    {
      type: 'complete',
      format: 'pdf',
      description: 'Complete account data export (all information)',
      estimatedSize: '500 KB'
    }
  ];

  useEffect(() => {
    loadProfile();
    loadSecurityData();
    calculateProfileCompleteness();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityData = async () => {
    if (!user?.id) {
      console.error('User ID is required to load security data');
      return;
    }

    try {
      // Load real security sessions from Supabase
      const { data: sessions, error: sessionsError } = await supabase
        .from('security_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!sessionsError && sessions) {
        const transformedSessions: SecuritySession[] = sessions.map(session => ({
          id: session.id,
          deviceName: session.device || 'Unknown Device',
          location: session.location || 'Unknown Location',
          ipAddress: session.ip_address || '',
          browser: session.browser || 'Unknown Browser',
          lastActive: new Date(session.last_active || session.created_at),
          isCurrent: session.is_current || false,
          status: session.status || 'active'
        }));
        setSecuritySessions(transformedSessions);
      } else {
        setSecuritySessions([]);
      }

      // Load real login history from Supabase
      const { data: history, error: historyError } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!historyError && history) {
        const transformedHistory: LoginHistory[] = history.map(login => ({
          id: login.id,
          timestamp: new Date(login.created_at),
          location: login.location || 'Unknown Location',
          ipAddress: login.ip_address || '',
          device: login.device || 'Unknown Device',
          browser: login.browser || 'Unknown Browser',
          success: login.status === 'success',
          method: (login.method === 'google' || login.method === 'facebook') ? login.method : 'password'
        }));
        setLoginHistory(transformedHistory);
      } else {
        setLoginHistory([]);
      }

    } catch (error) {
      console.error('Error loading security data:', error);
      // Fallback to empty arrays
      setSecuritySessions([]);
      setLoginHistory([]);
    }
  };

  const calculateProfileCompleteness = () => {
  const suggestions = [
    {
      field: 'phone',
      description: 'Add your phone number',
      points: 10,
      completed: !!profileData.phone
    },
    {
      field: 'address',
      description: 'Complete your delivery address',
      points: 15,
      completed: !!profileData.address && profileData.address.length > 10
    },
    {
      field: 'delivery_preferences',
      description: 'Set up delivery preferences',
      points: 10,
      completed: !!deliveryPreferences.specificInstructions || deliveryPreferences.leaveAtDoor
    },
    {
      field: 'communication_preferences',
      description: 'Configure communication preferences',
      points: 5,
      completed: true // Always completed if they have any preferences set
    }
  ];

    const completedPoints = suggestions.filter(s => s.completed).reduce((sum, s) => sum + s.points, 0);
    const totalPoints = suggestions.reduce((sum, s) => sum + s.points, 0);
    const score = Math.round((completedPoints / totalPoints) * 100);

    setProfileCompleteness({ score, suggestions });
  };

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeliveryPreferenceChange = (field: keyof DeliveryPreferences, value: string | boolean) => {
    setDeliveryPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCommunicationPreferenceChange = (
    category: keyof CommunicationPreferences, 
    channel: string, 
    value: boolean
  ) => {
    setCommunicationPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: value
      }
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfileData(prev => ({
        ...prev,
        image_url: data.publicUrl
      }));

      toast({
        title: "Success",
        description: "Profile picture uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      calculateProfileCompleteness();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (!currentPassword || !newPassword || newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "Please fill all fields and ensure the new passwords match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setChangePwLoading(true);

      // Supabase does not support verifying the current password client-side
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Password changed successfully.",
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChangePwLoading(false);
    }
  };

  const handleExportData = async (option: DataExportOption) => {
    try {
      setLoading(true);
      
      // Generate real data export
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Create user data export
      const exportData = {
        profile: profileData,
        preferences: {
          notifications: {
            email: true, // Get from user preferences
            push: true,
            sms: false
          },
          privacy: {
            profileVisibility: 'public',
            dataSharing: false
          }
        },
        exportedAt: new Date().toISOString(),
        type: option.type,
        format: option.format,
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${option.type}-data-${format(new Date(), 'yyyy-MM-dd')}.${option.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `Your ${option.type} data has been downloaded`,
      });
      
      setIsExportDialogOpen(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      // In real app, call API to terminate session
      setSecuritySessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session terminated",
        description: "The selected session has been terminated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setDeleteLoading(true);

      // Delete profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        throw new Error("Failed to delete profile data.");
      }

      // Delete user account
      const { error: userError } = await supabase.auth.admin.deleteUser(user.id);

      if (userError) {
        throw new Error("Failed to delete user account.");
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });

      navigate('/register');
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    calculateProfileCompleteness();
  }, [profileData, deliveryPreferences]);

  return (
    <div className="min-h-screen bg-background">
      {/* Email Verification Blocker */}
      {!isEmailVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg flex flex-col items-center">
            <Shield className="h-10 w-10 text-yellow-500 mb-2" />
            <h2 className="text-lg font-bold mb-2">Verify Your Email</h2>
            <p className="text-sm text-muted-foreground mb-4 text-center">You must verify your email address before accessing account settings. Please check your inbox for a verification link.</p>
            <Button onClick={() => window.location.reload()} className="mb-2">I've Verified My Email</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Account Settings</h1>
          </div>
          
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
            {!isEmailVerified && <span className="text-xs text-red-500 ml-2">(Verify email to enable)</span>}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Completeness Meter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Profile Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Complete your profile to unlock all features</span>
                <Badge variant={profileCompleteness.score >= 80 ? 'default' : 'secondary'}>
                  {profileCompleteness.score}% Complete
                </Badge>
              </div>
<<<<<<< HEAD
              
              <Progress value={profileCompleteness.score} className="h-2" />
              
              {profileCompleteness.suggestions.filter(s => !s.completed).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Suggestions to improve your profile:</p>
                  <div className="space-y-1">
                    {profileCompleteness.suggestions
                      .filter(s => !s.completed)
                      .slice(0, 3)
                      .map((suggestion, index) => (
                        <div key={index} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                          <span>{suggestion.description}</span>
                          <Badge variant="outline" className="text-xs">+{suggestion.points} pts</Badge>
                        </div>
                      ))
                    }
=======

              <div>
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email ?? ""}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone ?? ""}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-foreground">Location</Label>
                <Input
                  id="location"
                  value={profileData.location ?? ""}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your city/area"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-foreground">Full Address</Label>
                <Textarea
                  id="address"
                  value={profileData.address ?? ""}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your complete address for deliveries"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-foreground">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>

            {/* Settings & Notifications (moved from drawer) */}
            <div className="mt-8 space-y-4">
              <h2 className="font-semibold text-lg">Settings</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {darkMode ? <Key className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                </div>
                <input
                  id="dark-mode"
                  type="checkbox"
                  checked={darkMode}
                  onChange={e => handleDarkModeChange(e.target.checked)}
                  title="Toggle dark mode"
                  aria-label="Toggle dark mode"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4" />
                  <Label htmlFor="notifications">Notifications</Label>
                </div>
                <input
                  id="notifications"
                  type="checkbox"
                  checked={notifications}
                  onChange={e => handleNotificationsChange(e.target.checked)}
                  title="Toggle notifications"
                  aria-label="Toggle notifications"
                />
              </div>
            </div>

            {/* Logout (moved from drawer) */}
            <div className="mt-8">
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure you want to logout?</DialogTitle>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      No
                    </Button>
                    <Button variant="destructive" onClick={() => {/* add your logout logic here */}}>
                      Yes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Communication Preferences */}
            <div className="mt-8 space-y-2">
              <h2 className="font-semibold text-lg">Communication Preferences</h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={profileData.email_opt_in} onChange={e => handleInputChange('email_opt_in', e.target.checked ? true : false)} />
                  <span>Email Updates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={profileData.sms_opt_in} onChange={e => handleInputChange('sms_opt_in', e.target.checked ? true : false)} />
                  <span>SMS Updates</span>
                </label>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mt-8 space-y-2">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Key className="h-5 w-5" /> Change Password</h2>
              <div className="space-y-2">
                <Input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                <Input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <Input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                <Button onClick={handleChangePassword} disabled={changePwLoading || !newPassword || newPassword !== confirmNewPassword} className="w-full mt-2">{changePwLoading ? 'Changing...' : 'Change Password'}</Button>
              </div>
            </div>

            {/* Download/Delete Data Section */}
            <div className="mt-8 space-y-2">
              <h2 className="font-semibold text-lg">Account & Data</h2>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleDownloadData} className="flex items-center gap-2"><Download className="h-4 w-4" /> Download My Data</Button>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading} className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete My Account</Button>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
                        {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {/* System Settings Section */}
            <div className="mt-8 space-y-4">
              <h2 className="font-semibold text-lg">System Settings</h2>
              {/* Location Access */}
              <div className="flex items-center gap-2">
                <Label className="font-medium">Location Access</Label>
                <Button variant="outline" onClick={async () => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const { latitude, longitude } = pos.coords;
                        toast({ title: 'Location Accessed', description: `Lat: ${latitude}, Lng: ${longitude}` });
                        handleInputChange('location', `${latitude},${longitude}`);
                      },
                      () => toast({ title: 'Error', description: 'Location access denied.', variant: 'destructive' })
                    );
                  } else {
                    toast({ title: 'Error', description: 'Geolocation not supported.', variant: 'destructive' });
                  }
                }}>Get Location</Button>
              </div>
              {/* Push Notifications */}
              <div className="flex items-center gap-2">
                <Label className="font-medium">Push Notifications</Label>
                <input type="checkbox" checked={profileData.push_opt_in ?? false} onChange={e => handleInputChange('push_opt_in', e.target.checked)} title="Enable push notifications" />
                <span>{profileData.push_opt_in ? 'Enabled' : 'Disabled'}</span>
              </div>
              {/* Cache Clearing */}
              <div className="flex items-center gap-2">
                <Label className="font-medium">Clear Cache</Label>
                <Button variant="outline" onClick={() => {
                  if ('caches' in window) {
                    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
                    toast({ title: 'Cache Cleared', description: 'App cache has been cleared.' });
                  } else {
                    toast({ title: 'Error', description: 'Cache API not supported.', variant: 'destructive' });
                  }
                }}>Clear</Button>
              </div>
              {/* Policies Display */}
              <div className="flex flex-col gap-2">
                <Label className="font-medium">Policies</Label>
                <Button variant="outline" onClick={() => setShowPolicies(true)}>View Policies</Button>
                {showPolicies && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
                      <h3 className="text-lg font-bold mb-2">App Policies</h3>
                      <div className="mb-4 text-sm max-h-64 overflow-y-auto">
                        <p><strong>Privacy Policy:</strong> We respect your privacy. Your data is stored securely and never shared without consent.</p>
                        <p className="mt-2"><strong>Terms of Service:</strong> By using this app, you agree to our terms and conditions. For details, contact support.</p>
                        <p className="mt-2"><strong>Refund Policy:</strong> Refunds are processed according to our payment provider's terms.</p>
                      </div>
                      <Button variant="outline" onClick={() => setShowPolicies(false)}>Close</Button>
                    </div>
>>>>>>> aeb7aacc8daba24402f7cfa7daf6ee404e6afaef
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" disabled={!isEmailVerified}>Profile</TabsTrigger>
            <TabsTrigger value="delivery" disabled={!isEmailVerified}>Delivery</TabsTrigger>
            <TabsTrigger value="communication" disabled={!isEmailVerified}>Communication</TabsTrigger>
            <TabsTrigger value="security" disabled={!isEmailVerified}>Security</TabsTrigger>
            <TabsTrigger value="privacy" disabled={!isEmailVerified}>Privacy</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {/* No image_url in ProfileData, fallback only */}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        title="Upload profile picture"
                      />
                    </label>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter your city/area"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your complete address for deliveries"
                    rows={3}
                  />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Preferences Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Leave at Door */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Leave packages at door</Label>
                    <p className="text-sm text-muted-foreground">Allow delivery without signature</p>
                  </div>
                  <Switch
                    checked={deliveryPreferences.leaveAtDoor}
                    onCheckedChange={(checked) => handleDeliveryPreferenceChange('leaveAtDoor', checked)}
                  />
                </div>

                <Separator />

                {/* Delivery Instructions */}
                <div>
                  <Label htmlFor="delivery-instructions">Special Instructions</Label>
                  <Textarea
                    id="delivery-instructions"
                    value={deliveryPreferences.specificInstructions}
                    onChange={(e) => handleDeliveryPreferenceChange('specificInstructions', e.target.value)}
                    placeholder="Any specific delivery instructions..."
                    rows={3}
                  />
                </div>

                {/* Preferred Time Slot */}
                <div>
                  <Label>Preferred Delivery Time</Label>
                  <Select
                    value={deliveryPreferences.preferredTimeSlot}
                    onValueChange={(value) => handleDeliveryPreferenceChange('preferredTimeSlot', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anytime">Anytime</SelectItem>
                      <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                      <SelectItem value="evening">Evening (6PM - 9PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Preference */}
                <div>
                  <Label>Contact Method for Delivery</Label>
                  <Select
                    value={deliveryPreferences.contactPreference}
                    onValueChange={(value) => handleDeliveryPreferenceChange('contactPreference', value as 'call' | 'sms' | 'app')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">App Notification</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Doorbell */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ring doorbell</Label>
                    <p className="text-sm text-muted-foreground">Alert when delivery arrives</p>
                  </div>
                  <Switch
                    checked={deliveryPreferences.doorBellRing}
                    onCheckedChange={(checked) => handleDeliveryPreferenceChange('doorBellRing', checked)}
                  />
                </div>

                {/* Safe Location */}
                <div>
                  <Label htmlFor="safe-location">Safe Drop Location</Label>
                  <Input
                    id="safe-location"
                    value={deliveryPreferences.safeLocation}
                    onChange={(e) => handleDeliveryPreferenceChange('safeLocation', e.target.value)}
                    placeholder="e.g., Behind potted plant, garage, etc."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication Preferences Tab */}
          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Communication Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you'd like to receive updates and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Updates */}
                <div>
                  <Label className="text-base font-medium">Order Updates</Label>
                  <p className="text-sm text-muted-foreground mb-3">Get notified about your order status</p>
                  <div className="grid grid-cols-3 gap-4">
                    {['email', 'sms', 'push'].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Switch
                          checked={communicationPreferences.orderUpdates[channel as keyof typeof communicationPreferences.orderUpdates]}
                          onCheckedChange={(checked) => handleCommunicationPreferenceChange('orderUpdates', channel, checked)}
                        />
                        <Label className="capitalize">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Marketing */}
                <div>
                  <Label className="text-base font-medium">Marketing & Promotions</Label>
                  <p className="text-sm text-muted-foreground mb-3">Receive offers and promotional content</p>
                  <div className="grid grid-cols-3 gap-4">
                    {['email', 'sms', 'push'].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Switch
                          checked={communicationPreferences.marketing[channel as keyof typeof communicationPreferences.marketing]}
                          onCheckedChange={(checked) => handleCommunicationPreferenceChange('marketing', channel, checked)}
                        />
                        <Label className="capitalize">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Recommendations */}
                <div>
                  <Label className="text-base font-medium">Product Recommendations</Label>
                  <p className="text-sm text-muted-foreground mb-3">Get personalized product suggestions</p>
                  <div className="grid grid-cols-3 gap-4">
                    {['email', 'sms', 'push'].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Switch
                          checked={communicationPreferences.recommendations[channel as keyof typeof communicationPreferences.recommendations]}
                          onCheckedChange={(checked) => handleCommunicationPreferenceChange('recommendations', channel, checked)}
                        />
                        <Label className="capitalize">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Farmer Messages */}
                <div>
                  <Label className="text-base font-medium">Farmer Communications</Label>
                  <p className="text-sm text-muted-foreground mb-3">Direct messages from farmers</p>
                  <div className="grid grid-cols-3 gap-4">
                    {['email', 'sms', 'push'].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Switch
                          checked={communicationPreferences.farmerMessages[channel as keyof typeof communicationPreferences.farmerMessages]}
                          onCheckedChange={(checked) => handleCommunicationPreferenceChange('farmerMessages', channel, checked)}
                        />
                        <Label className="capitalize">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Newsletter */}
                <div>
                  <Label className="text-base font-medium">Newsletter</Label>
                  <p className="text-sm text-muted-foreground mb-3">Weekly updates and farming tips</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['email', 'sms'].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Switch
                          checked={communicationPreferences.newsletter[channel as keyof typeof communicationPreferences.newsletter]}
                          onCheckedChange={(checked) => handleCommunicationPreferenceChange('newsletter', channel, checked)}
                        />
                        <Label className="capitalize">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button 
                  onClick={handleChangePassword} 
                  disabled={!isEmailVerified || changePwLoading || !newPassword || newPassword !== confirmNewPassword}
                  className="w-full"
                >
                  {changePwLoading ? 'Changing...' : 'Change Password'}
                  {!isEmailVerified && <span className="text-xs text-red-500 ml-2">(Verify email to enable)</span>}
                </Button>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Active Sessions
                </CardTitle>
                <CardDescription>
                  Manage devices that are currently signed in to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securitySessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          {session.deviceName.includes('iPhone') || session.deviceName.includes('Android') ? 
                            <Smartphone className="h-5 w-5" /> : 
                            <Monitor className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{session.deviceName}</span>
                            {session.isCurrent && (
                              <Badge variant="default" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{session.browser}</p>
                          <p className="text-sm text-muted-foreground">{session.location} • {session.ipAddress}</p>
                          <p className="text-xs text-muted-foreground">
                            Last active: {format(session.lastActive, 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Login History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Login Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loginHistory.slice(0, 5).map((login) => (
                    <div key={login.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${login.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {login.success ? 'Successful' : 'Failed'} login via {login.method}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {login.device} • {login.location} • {login.ipAddress}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(login.timestamp, 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Export
                </CardTitle>
                <CardDescription>
                  Download your account data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export My Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control your privacy and data visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Visibility */}
                <div>
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground mb-3">Who can see your profile information</p>
                  <Select
                    value={''}
                    onValueChange={() => {}}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can see</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private - Only me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Data Visibility Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Show in Profile</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Purchase History</Label>
                      <p className="text-sm text-muted-foreground">Display your order history to others</p>
                    </div>
                    <Switch
                      checked={false}
                      onCheckedChange={() => {}}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Product Reviews</Label>
                      <p className="text-sm text-muted-foreground">Show reviews you've written</p>
                    </div>
                    <Switch
                      checked={false}
                      onCheckedChange={() => {}}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activity Status</Label>
                      <p className="text-sm text-muted-foreground">Show when you're online</p>
                    </div>
                    <Switch
                      checked={false}
                      onCheckedChange={() => {}}
                    />
                  </div>
                </div>

                <Separator />

                {/* System Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">System Information</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Location Access</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Enabled</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Notifications</Label>
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span>Enabled</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Network Status</Label>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        <span>Online</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">App Version</Label>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>v2.1.0</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <Button variant="outline" onClick={() => setShowPolicies(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Privacy Policy
                    </Button>
                    <Button variant="outline" onClick={() => setShowSupport(true)}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Data Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Your Data</DialogTitle>
            <DialogDescription>
              Choose what data you'd like to export and in which format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {dataExportOptions.map((option, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedExportOption?.type === option.type 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedExportOption(option)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium capitalize">{option.type} Data</h4>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: {option.format.toUpperCase()} • Size: {option.estimatedSize}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {option.format.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedExportOption && handleExportData(selectedExportOption)}
              disabled={!selectedExportOption || loading}
            >
              {loading ? 'Exporting...' : 'Export Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your profile and personal information</li>
                <li>• Order history and transaction records</li>
                <li>• Product reviews and ratings</li>
                <li>• Saved preferences and settings</li>
                <li>• All messages and communications</li>
              </ul>
            </div>
            
            <div>
              <Label htmlFor="confirmDelete">Type "DELETE" to confirm:</Label>
              <Input
                id="confirmDelete"
                placeholder="DELETE"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policies Modal */}
      {showPolicies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-2">App Policies</h3>
            <div className="mb-4 text-sm space-y-4">
              <div>
                <h4 className="font-semibold">Privacy Policy:</h4>
                <p>We respect your privacy. Your data is stored securely and never shared without explicit consent. We use industry-standard encryption and follow GDPR guidelines.</p>
              </div>
              <div>
                <h4 className="font-semibold">Terms of Service:</h4>
                <p>By using this app, you agree to our terms and conditions. We provide fresh farm products with quality guarantees. For full details, contact support.</p>
              </div>
              <div>
                <h4 className="font-semibold">Refund Policy:</h4>
                <p>Refunds are processed according to our payment provider's terms. Quality issues are resolved within 24 hours with full refunds or replacements.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowPolicies(false)}>Close</Button>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-2">Contact Support</h3>
            <div className="mb-4 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Website: verdantvillage.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📧</span>
                <span>Email: support@verdantvillage.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>Phone: +27 123 456 7890</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Hours: Mon-Fri 8AM-6PM SAST</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowSupport(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};