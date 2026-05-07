'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';

const formSchema = z.object({
  identifier: z.string().min(1, "Email, ID or phone number is required"),
});

export default function EmployeeLogin() {
   const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
    },
  });
  

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/employee/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: values.identifier
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate login');
      }

      // Get the returnUrl from query params
    const searchParams = new URLSearchParams(window.location.search);
    const returnUrl = searchParams.get('returnUrl') || '/employee-dashboard';

      // Handle redirection based on backend's response
      if (data.nextStep === 'set_phone_number') {
        window.location.href = `/auth/set-phone-number?userId=${data.userId}&returnUrl=${encodeURIComponent(returnUrl)}`;
      } else if (data.nextStep === 'verify_otp') {
        window.location.href = `/auth/verify-otp?userId=${data.userId}&returnUrl=${encodeURIComponent(returnUrl)}`;
      } else {
        throw new Error('Unexpected next step from server');
      }

    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      console.error('Login error:', error);
    }
    finally{
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center font-header justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Employee Login</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your identifier" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-green-700 hover:bg-green-600">
             {isSubmitting ? "Processing..." : "Continue"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}