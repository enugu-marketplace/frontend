
'use client'

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCallback, useState, useEffect } from "react";

// Helper function to extract user-friendly error message
function getErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred';
  
  // If it's already a user-friendly message, return it
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle NextAuth errors
  if (typeof error === 'object') {
    // NextAuth error structure
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
    
    // Error object with message
    if (error.error && typeof error.error === 'string') {
      return error.error;
    }
    
    // Axios/fetch error structure
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    // Generic error object
    if (error.toString && error.toString() !== '[object Object]') {
      const errorString = error.toString();
      if (errorString.startsWith('Error: ')) {
        return errorString.substring(7);
      }
      return errorString;
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}

export const useAuth = () => {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSessionSync = useCallback(async () => {
    try {
      if (status === "authenticated" && !session?.user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updated = await update();
        if (!updated?.user) {
          console.error('Session update failed - no user data');
          return false;
        }
        return true;
      }
      return true;
    } catch (error) {
      console.error('Session sync error:', error);
      return false;
    }
  }, [status, session, update]);

  const redirectBasedOnRole = useCallback(async () => {
    setLoading(true);
    try {
      if (status === "authenticated" && session?.user) {
        redirectUser(session.user.role);
        return;
      }

      const sessionValid = await handleSessionSync();
      if (!sessionValid) {
        throw new Error('Session synchronization failed');
      }

      if (status === "authenticated" && session?.user) {
        redirectUser(session.user.role);
      } else {
        throw new Error('No active session');
      }
    } catch (error) {
      console.error('Redirect error:', error);
      toast.error('Please log in to continue');
      router.push('/admin-login');
    } finally {
      setLoading(false);
    }
  }, [session, status, router, handleSessionSync]);

  const redirectUser = (role: string | undefined) => {
    switch (role) {
      case "super_admin":
      case "admin":
        router.push('/admin-dashboard');
        break;
      case "fulfillment_officer":
        router.push('/agent-dashboard');
        break;
      case "cashier":
        router.push('/cashier-dashboard');
        break;
      case "user":
        router.push('/employee-dashboard');
        break;
      default:
        toast.error('Unknown user role');
        router.push('/');
    }
  };

  const handleOTPLogin = async (userId: string, otp: string) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        userId,
        otp,
        redirect: false
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (!result?.ok) {
        throw new Error('OTP verification failed');
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      await update();
      
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const result = await signIn('admin_login', {
        identifier,
        password,
        redirect: false
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (!result?.ok) {
        throw new Error('Admin login failed');
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      await update();
      
      toast.success('Admin login successful!');
      return true;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillmentOfficerLogin = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const result = await signIn('fulfillment_officer_login', {
        identifier,
        password,
        redirect: false
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (!result?.ok) {
        throw new Error('Fulfillment officer login failed');
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      await update();
      
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCashierLogin = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const result = await signIn('cashier_login', {
        identifier,
        password,
        redirect: false
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (!result?.ok) {
        throw new Error('Cashier login failed');
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      await update();
      
      toast.success('Cashier login successful!');
      return true;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { 
    handleOTPLogin,
    handleAdminLogin,
    handleFulfillmentOfficerLogin,
    handleCashierLogin,
    redirectBasedOnRole,
    loading,
    session,
    status
  };
};