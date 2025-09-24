import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/lib/notificationService";
// Removed unused import for useAuth as it is not used in this file.

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: Error | null }>;
  resendVerification: (email: string) => Promise<{ error?: Error | null }>;
  deleteAccount: () => Promise<{ error?: Error | null }>;
  exportUserData: () => Promise<{ data?: any; error?: Error | null }>;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Initialize notifications for authenticated user
      if (session?.user) {
        initializeNotifications(session.user.id);
        setIsEmailVerified(session.user.email_confirmed_at !== null);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        // Initialize notifications when user logs in
        await initializeNotifications(session.user.id);
      } else {
        // Clean up when user logs out
        await notificationService.unsubscribe();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeNotifications = async (userId: string) => {
    try {
      await notificationService.initialize();
      await notificationService.subscribeToRealTimeUpdates(userId);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to FarmersBracket",
      });
      
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: username
          }
        }
      });
      
      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Welcome to FarmersBracket!",
        description: "Your account has been created successfully. Please check your email for verification.",
      });
      
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast({
        title: "Goodbye!",
        description: "You have been logged out successfully",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions",
      });
      
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        toast({
          title: "Verification Email Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Verification Email Sent",
        description: "Check your email for verification instructions",
      });
      
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      // First, delete user data from our tables
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Delete the user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        toast({
          title: "Account Deletion Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
      
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const exportUserData = async () => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      // Collect user data from various tables
      const [
        { data: profile },
        { data: orders },
        { data: reviews }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('reviews').select('*').eq('user_id', user.id)
      ]);

      const userData = {
        account: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
        },
        profile,
        orders: orders || [],
        reviews: reviews || [],
        exportedAt: new Date().toISOString(),
      };

      return { data: userData };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendVerification,
    deleteAccount,
    exportUserData,
    isEmailVerified,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};