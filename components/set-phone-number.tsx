"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { SmartPhone01Icon } from "@hugeicons/core-free-icons";

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
  phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
});

export default function SetPhoneNumber() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone_number: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast.error("User ID is missing");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/employee/set-phone-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          phone_number: values.phone_number,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to set phone number");
      }

      // Get the returnUrl from query params
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl") || "/employee-dashboard";

      // After setting the phone number we send them straight to the OTP step
      window.location.href = `/auth/verify-otp?userId=${userId}&returnUrl=${encodeURIComponent(returnUrl)}`;
    } catch (error: any) {
      toast.error(error.message || "Phone number setup failed");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Without a userId there is no record to attach the number to
  if (!userId) {
    return (
      <AuthShell
        title="This link is incomplete"
        subtitle="We could not tell which account to add the phone number to. Start again from the sign in page."
        backHref="/employee-login"
        backLabel="Back to sign in"
      >
        <Button
          asChild
          className="h-11 w-full rounded-md bg-brand-700 text-sm font-medium hover:bg-brand-800"
        >
          <Link href="/employee-login">Go to sign in</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Add your phone number"
      subtitle="There is no phone number on your record yet. We need one to send your verification code."
      backHref="/employee-login"
      backLabel="Back to sign in"
      footer={
        <p className="text-[13px] leading-6 text-slate-500">
          Use a number you have with you now. The 6-digit code goes to this number on the next
          screen, and it stays on your record for future sign ins.
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-slate-700">
                  Phone number
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <HugeiconsIcon icon={SmartPhone01Icon} size={18} strokeWidth={1.8} />
                    </span>
                    <Input
                      type="tel"
                      autoFocus
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="e.g. 08012345678"
                      className="h-11 rounded-md border-slate-300 pl-10 text-sm shadow-none focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
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
            {isSubmitting ? "Saving..." : "Save and send code"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
