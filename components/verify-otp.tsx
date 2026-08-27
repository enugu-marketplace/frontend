"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthShell from "@/components/auth/AuthShell";

const formSchema = z.object({
  otp: z.string().min(6, "Enter all 6 digits").max(6),
});

const RESEND_SECONDS = 60;

export default function VerifyOtp() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const returnUrl = searchParams.get("returnUrl") || "/employee-dashboard";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const otpValue = form.watch("otp");

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }

    return () => clearTimeout(timer);
  }, [countdown, resendDisabled]);

  const handleResendOtp = async () => {
    try {
      if (!userId) {
        toast.error("User ID is missing");
        return;
      }

      setIsResending(true);

      const response = await fetch("/api/auth/employee/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      toast.success("We sent you a new code.");
      form.reset({ otp: "" });
      setResendDisabled(true);
      setCountdown(RESEND_SECONDS);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast.error("User ID is missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        userId,
        otp: values.otp,
        callbackUrl: returnUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error: any) {
      toast.error(error.message || "OTP verification failed");
      form.setValue("otp", "");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Landing here without a userId means the sign-in step was skipped or the link expired
  if (!userId) {
    return (
      <AuthShell
        title="This link is incomplete"
        subtitle="We could not tell which account this code belongs to. Start again from the sign in page and we will send you a fresh code."
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
      title="Enter your verification code"
      subtitle="We sent a 6-digit code to the phone number on your staff record. It expires shortly, so enter it soon."
      backHref="/employee-login"
      backLabel="Back to sign in"
      footer={
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-slate-500">Did not get the code?</span>
          {resendDisabled ? (
            <span className="text-slate-400">Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="font-medium text-brand-700 hover:underline disabled:text-slate-400"
            >
              {isResending ? "Sending..." : "Send a new code"}
            </button>
          )}
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-slate-700">
                  6-digit code
                </FormLabel>
                <FormControl>
                  <InputOTP
                    maxLength={6}
                    value={field.value}
                    onChange={field.onChange}
                    autoFocus
                    containerClassName="justify-start"
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="h-12 w-11 rounded-md border border-slate-300 text-base font-medium shadow-none data-[active=true]:border-brand-600 data-[active=true]:ring-brand-600/15"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="h-11 w-full rounded-md bg-brand-700 text-sm font-medium hover:bg-brand-800"
            disabled={isSubmitting || otpValue.length < 6}
          >
            {isSubmitting ? "Verifying..." : "Verify and continue"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
