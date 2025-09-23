import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  image_url: string;
  location: string;
  email_opt_in?: boolean;
  sms_opt_in?: boolean;
  push_opt_in?: boolean; // Added this property
}

const UpdateProfile = () => {
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    image_url: '',
    location: '',
    email_opt_in: true,
    sms_opt_in: false
  });
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
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
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          bio: data.bio || '',
          image_url: data.image_url || '',
          location: data.location || ''
        });
      } else {
        // Set email from auth if no profile exists
        setProfileData(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
      setProfileData(prev => ({
        ...prev,
        [field]: value
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
        });
  // Change Password
  const handleChangePassword = async () => {
    if (!user) return;
    if (!currentPassword || !newPassword || newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "Please fill all fields and confirm new password.", variant: "destructive" });
      return;
    }
    setChangePwLoading(true);
    // Supabase does not support password change with current password client-side, so just update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password changed successfully." });
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    }
    setChangePwLoading(false);
  };

  // Download Data
  const handleDownloadData = async () => {
    if (!user) return;
    toast({ title: "Preparing Data...", description: "Exporting your profile and orders." });
    // Fetch profile and orders
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id);
    const exportData = { profile, orders };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download Ready", description: "Your data has been downloaded." });
  };

  // Delete Account
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

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      navigate('/dashboard');
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

  const handleChangePassword = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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
  const handleDownloadData = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!user) return;

    try {
      toast({
        title: "Preparing Data...",
        description: "Exporting your profile and orders.",
      });

      // Fetch profile and orders
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);

      if (profileError || ordersError) {
        throw new Error("Failed to fetch data for export.");
      }

      const exportData = { profile, orders };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my_data.json';
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Download Ready",
        description: "Your data has been downloaded.",
      });
    } catch (error) {
      console.error("Error downloading data:", error);
      toast({
        title: "Error",
        description: "Failed to download data. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleDeleteAccount = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmDelete) return;

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
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-soft">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Update Profile</h1>
        </div>
      </header>

      <main className="p-4 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.image_url} />
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name ?? ""}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

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
                  </div>
                )}
              </div>
              {/* Support Contact */}
              <div className="flex flex-col gap-2">
                <Label className="font-medium">Support</Label>
                <Button variant="outline" onClick={() => setShowSupport(true)}>Contact Support</Button>
                {showSupport && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                      <h3 className="text-lg font-bold mb-2">Contact Support</h3>
                      <div className="mb-4 text-sm">Email: support@verdantvillage.com<br />Phone: +27 123 456 7890</div>
                      <Button variant="outline" onClick={() => setShowSupport(false)}>Close</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};