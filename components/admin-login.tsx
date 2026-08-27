'use client';

import { signIn, getSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Mail01Icon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffSlashIcon,
  Loading03Icon,
} from '@hugeicons/core-free-icons';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import AuthShell from '@/components/auth/AuthShell';

const formSchema = z.object({
  identifier: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const adminPoints = [
  "Approve compliance forms and purchasing units",
  "Manage products, inventory and warehouses",
  "Track every order through to delivery",
];

export default function AdminLogin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const callbackUrl = searchParams.get('callbackUrl') || '/admin-dashboard';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          router.push(callbackUrl);
        }
      } catch (error) {
        console.log('Session check failed, continuing to login page');
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [router, callbackUrl]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const result = await signIn('admin_login', {
        redirect: false,
        identifier: values.identifier,
        password: values.password,
        callbackUrl,
      });

      if (result?.error) {
        console.error('Admin sign-in error:', result.error);

        // Handle specific error cases
        if (result.error.includes('Failed to fetch') ||
            result.error.includes('Network connection failed') ||
            result.error.includes('Unable to connect')) {
          toast.error('Unable to connect to server. Please check your internet connection and try again.');
        } else if (result.error.includes('timeout') || result.error.includes('TIMEOUT')) {
          toast.error('Request timed out. Please try again.');
        } else if (result.error.includes('Invalid email or password') || result.error.includes('Invalid credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (result.error.includes('Server is currently unavailable')) {
          toast.error('Server is currently unavailable. Please try again later.');
        } else if (result.error.includes('Too many login attempts')) {
          toast.error('Too many login attempts. Please wait a few minutes and try again.');
        } else if (result.error.includes('Server configuration error')) {
          toast.error('Server configuration error. Please contact support.');
        } else {
          // Show the actual error message from NextAuth
          toast.error(result.error);
        }

        return;
      }

      if (!result?.ok) {
        console.error('Admin sign-in not ok:', result);
        toast.error('Authentication failed. Please try again.');
        return;
      }

      if (result?.url) {
        toast.success('Signed in');
        router.push(result.url);
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);

      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="font-header flex min-h-screen items-center justify-center bg-white">
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
          Checking your session
        </p>
      </div>
    );
  }

  return (
    <AuthShell
      title="Administrator sign in"
      subtitle="Use the email address and password issued to your admin account."
      backHref="/"
      backLabel="Back to marketplace"
      panelTitle="Run the scheme from one console."
      points={adminPoints}
      panelNote="This area is restricted to Enugu State scheme administrators. Staff sign-ins are on their own pages."
      
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-slate-700">
                  Email address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={1.8} />
                    </span>
                    <Input
                      type="email"
                      autoFocus
                      autoComplete="email"
                      placeholder="admin@enugustate.gov.ng"
                      disabled={isLoading}
                      className="h-11 rounded-md border-slate-300 pl-10 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-slate-700">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <HugeiconsIcon icon={LockPasswordIcon} size={18} strokeWidth={1.8} />
                    </span>
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      disabled={isLoading}
                      className="h-11 rounded-md border-slate-300 pl-10 pr-10 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((shown) => !shown)}
                      disabled={isLoading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <HugeiconsIcon
                        icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                        size={18}
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-700 text-sm font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isLoading ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={16}
                  strokeWidth={2}
                  className="animate-spin"
                />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </Form>
    </AuthShell>
  );
}
