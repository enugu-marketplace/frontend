"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { IdentityCardIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import AuthShell from "@/components/auth/AuthShell";

const formSchema = z.object({
  identifier: z.string().min(1, "Enter your verification number"),
});

export default function EmployeeLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const TEMP_PREVENT_EMPLOYEE_LOGIN_REDIRECT = false;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/employee/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: values.identifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate login");
      }

      if (TEMP_PREVENT_EMPLOYEE_LOGIN_REDIRECT) {
        toast.success(
          `Init success. nextStep: ${data.nextStep || "unknown"}, userId: ${data.userId || "n/a"}`
        );
        return;
      }

      // Get the returnUrl from query params
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl") || "/employee-dashboard";

      // Handle redirection based on backend's response
      if (data.nextStep === "set_phone_number") {
        window.location.href = `/auth/set-phone-number?userId=${data.userId}&returnUrl=${encodeURIComponent(returnUrl)}`;
      } else if (data.nextStep === "verify_otp") {
        window.location.href = `/auth/verify-otp?userId=${data.userId}&returnUrl=${encodeURIComponent(returnUrl)}`;
      } else {
        throw new Error("Unexpected next step from server");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Enter the verification number issued to you under the scheme."
      footer={
        <p className="text-[13px] leading-6 text-slate-500">
          We send a 6-digit code to the phone number on your record. If you have not added a phone
          number yet, we will ask for one first.
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-slate-700">
                  Verification number
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <HugeiconsIcon icon={IdentityCardIcon} size={18} strokeWidth={1.8} />
                    </span>
                    <Input
                      autoFocus
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="e.g. 23628506060"
                      className="h-11 rounded-md border-slate-300 pl-10 text-sm tracking-[0.02em] shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ""))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="h-11 w-full rounded-md bg-brand-700 text-sm font-medium hover:bg-brand-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Checking your record..." : "Continue"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
