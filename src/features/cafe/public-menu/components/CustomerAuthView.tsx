"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Cafe } from "@/lib/db/schema/cafes";
import { CustomerProfile } from "../types";
import { getDigitalMenuVisualTheme } from "@/lib/theme/theme-tokens";
import { useToast } from "@/components/ui/Toast";
import { authClient } from "@/lib/auth/auth-client";
import {
  findRegisteredProfile,
  setActiveCustomerProfile,
} from "../utils/customer-auth";
import {
  IconArrowLeft,
  IconDeviceMobile,
  IconMail,
  IconEdit,
  IconChevronRight,
  IconX,
  IconAlertCircle,
  IconClock,
} from "@tabler/icons-react";
import { getFirebaseAuth } from "@/lib/firebase/config";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

function getFriendlyErrorMessage(err: any): string {
  const code = (err?.code || "").toLowerCase();
  const rawMsg = String(err?.message || "");

  if (code.includes("too-many-requests") || rawMsg.includes("too-many-requests")) {
    return "Too many attempts. Please wait a few minutes before trying again, or use Email login.";
  }
  if (code.includes("invalid-phone-number") || rawMsg.includes("invalid-phone-number")) {
    return "Please enter a valid 10-digit mobile number.";
  }
  if (code.includes("quota-exceeded") || rawMsg.includes("quota-exceeded")) {
    return "SMS limit reached for now. Please try again later or log in with Email.";
  }
  if (code.includes("invalid-verification-code") || rawMsg.includes("invalid-verification-code")) {
    return "Incorrect 6-digit verification code. Please check and try again.";
  }
  if (code.includes("code-expired") || rawMsg.includes("code-expired")) {
    return "The verification code has expired. Please tap 'Resend Code'.";
  }
  if (code.includes("captcha-check-failed") || rawMsg.includes("captcha-check-failed")) {
    return "Security verification could not be completed. Please refresh and try again.";
  }
  if (code.includes("network-request-failed") || rawMsg.includes("network-request-failed")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (code.includes("operation-not-allowed") || rawMsg.includes("operation-not-allowed")) {
    return "SMS login is temporarily unavailable. Please try using Email login.";
  }
  if (code.includes("app-not-authorized") || rawMsg.includes("app-not-authorized")) {
    return "This domain is not authorized for SMS. Please use Email login.";
  }

  // Scrub any internal/developer Firebase error format
  if (rawMsg.startsWith("Firebase:") || rawMsg.includes("(auth/")) {
    return "Unable to process verification right now. Please try again or use Email.";
  }

  return rawMsg || "Something went wrong. Please try again.";
}

export interface CustomerAuthViewProps {
  cafe: Cafe;
  visualTheme: ReturnType<typeof getDigitalMenuVisualTheme>;
  onSuccess: (profile: CustomerProfile) => void;
  onCancel?: () => void;
  onContinueAsGuest?: () => void;
  isModal?: boolean;
}

type AuthStep = "CHOICE" | "ENTER_IDENTIFIER" | "VERIFY_OTP";

export const CustomerAuthView: React.FC<CustomerAuthViewProps> = ({
  cafe,
  visualTheme,
  onSuccess,
  onCancel,
  onContinueAsGuest,
  isModal = false,
}) => {
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("CHOICE");
  const [inputType, setInputType] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [resendCooldown, setResendCooldown] = useState(300);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Timer countdown matches the five-minute expiry enforced by the server.
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === "VERIFY_OTP" && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setOtpErrorMessage(
              "Verification code expired after 5 minutes. Please request a new code.",
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendCooldown]);

  // Sync Better Auth session when user actively initiates Google sign-in
  const { data: sessionData } = authClient.useSession();
  useEffect(() => {
    if (isGoogleLoading && sessionData?.user) {
      const user = sessionData.user;
      const targetId = user.email || user.id;
      const existing = findRegisteredProfile(targetId);

      let profile: CustomerProfile;
      if (existing) {
        profile = { ...existing, isGuest: false };
      } else {
        profile = {
          id: user.id || `google_${Date.now()}`,
          name: user.name || "Café Member",
          email: user.email || undefined,
          phone: (user as any).phoneNumber || undefined,
          avatarUrl: user.image || undefined,
          isGuest: false,
        };
      }

      setIsGoogleLoading(false);
      setActiveCustomerProfile(cafe.slug, profile);
      onSuccess(profile);
    }
  }, [isGoogleLoading, sessionData, cafe.slug, onSuccess]);

  // Start a real Better Auth Google OAuth flow.
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href,
      });

      // Better Auth returns { data?: { url?: string }, error?: { message?: string } }
      if (res?.error) {
        setIsGoogleLoading(false);
        toast({
          title: "Google sign-in unavailable",
          description:
            res.error.message ||
            "Google authentication is not configured for this deployment.",
          variant: "error",
        });
        return;
      }

      // If an explicit redirect URL was returned, navigate to it
      const redirectUrl = (res as any)?.data?.url || (res as any)?.url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      // If no error, the redirect is in progress; keep loading state active without triggering false error toast
      return;
    } catch (err: any) {
      setIsGoogleLoading(false);
      toast({
        title: "Google sign-in failed",
        description: err?.message || "Please try again or use your email address or phone number.",
        variant: "error",
      });
    }
  };

  // Validate Indian Phone Number or Email
  const validateInput = (
    value: string,
    type: "phone" | "email",
  ): { valid: boolean; formatted: string; error?: string } => {
    const clean = value.trim();
    if (!clean) {
      return {
        valid: false,
        formatted: "",
        error: "Please enter your mobile number or email address.",
      };
    }

    if (type === "phone" || (!clean.includes("@") && /\d/.test(clean))) {
      const digitsOnly = clean.replace(/\D/g, "");
      const tenDigits =
        digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
      const indianPhoneRegex = /^[6-9]\d{9}$/;

      if (!indianPhoneRegex.test(tenDigits)) {
        return {
          valid: false,
          formatted: clean,
          error:
            "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
        };
      }
      return { valid: true, formatted: `+91 ${tenDigits}` };
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clean)) {
        return {
          valid: false,
          formatted: clean,
          error: "Please enter a valid email address (e.g. name@example.com).",
        };
      }
      return { valid: true, formatted: clean.toLowerCase() };
    }
  };

  // Request a server-side OTP with a five-minute TTL.
  const handleSendOtp = async (overrideTarget?: string) => {
    const targetToValidate = overrideTarget || identifier;
    const validation = validateInput(targetToValidate, inputType);

    if (!validation.valid) {
      setInputError(validation.error || "Invalid input");
      toast({
        title: "Validation Error",
        description: validation.error || "Please check your input.",
        variant: "error",
      });
      return;
    }

    setInputError(null);
    setOtpErrorMessage(null);
    setIsSendingOtp(true);

    try {
      if (inputType === "phone") {
        const auth = getFirebaseAuth();

        // Clear any previous verifier widget to ensure a fresh reCAPTCHA token
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear();
          } catch {}
          recaptchaVerifierRef.current = null;
        }

        const containerEl = document.getElementById("firebase-recaptcha-container");
        if (containerEl) {
          containerEl.innerHTML = "";
        }

        const verifier = new RecaptchaVerifier(
          auth,
          "firebase-recaptcha-container",
          { size: "invisible" }
        );
        recaptchaVerifierRef.current = verifier;
        await verifier.render();

        const cleanDigits = validation.formatted.replace(/\D/g, "");
        const e164Number = `+91${cleanDigits.slice(-10)}`;
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          e164Number,
          verifier
        );
        confirmationResultRef.current = confirmationResult;

        setResendCooldown(300);
        setOtpDigits(["", "", "", "", "", ""]);
        setStep("VERIFY_OTP");

        toast({
          title: "Verification Code Sent",
          description: `SMS verification code dispatched to ${validation.formatted}`,
          variant: "success",
        });
      } else {
        const res = await fetch("/api/auth/customer/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target: validation.formatted,
            cafeSlug: cafe.slug,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to send verification code");
        }

        setResendCooldown(data.expiresInSeconds || 300);
        setOtpDigits(["", "", "", "", "", ""]);
        setStep("VERIFY_OTP");

        toast({
          title: "Verification Code Sent",
          description:
            data.message ||
            "Your verification code has been sent.",
          variant: "success",
        });
      }

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch {}
      }
      const errorDescription = getFriendlyErrorMessage(err);
      setInputError(errorDescription);
      toast({
        title: "Could Not Send Code",
        description: errorDescription,
        variant: "error",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    setOtpErrorMessage(null);
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (value && index === 5 && newDigits.every((d) => d !== "")) {
      verifyAndLogin(newDigits.join(""));
    }
  };

  // Handle backspace navigation in OTP
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle paste for 6 digits
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      verifyAndLogin(pasted);
    } else {
      otpInputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Verify the code against the server-side persisted OTP record.
  const verifyAndLogin = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length < 6) {
      setOtpErrorMessage("Please enter all 6 digits of the code.");
      return;
    }

    if (resendCooldown <= 0) {
      setOtpErrorMessage(
        "Verification code expired after 5 minutes. Please request a new code.",
      );
      toast({
        title: "Code Expired",
        description:
          "This verification code has expired. Please tap 'Resend Code'.",
        variant: "error",
      });
      return;
    }

    setIsVerifying(true);
    setOtpErrorMessage(null);

    const validation = validateInput(identifier, inputType);

    try {
      let data: any;

      if (inputType === "phone") {
        if (!confirmationResultRef.current) {
          setOtpErrorMessage("Verification session expired. Please tap 'Resend Code'.");
          toast({
            title: "Session Expired",
            description: "Please tap 'Resend Code' to receive a new code.",
            variant: "error",
          });
          setIsVerifying(false);
          return;
        }

        const credential = await confirmationResultRef.current.confirm(code);
        const res = await fetch("/api/auth/customer/firebase/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: validation.formatted,
            name: fullName,
            cafeSlug: cafe.slug,
            firebaseUid: credential.user.uid,
          }),
        });

        data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to verify phone number");
        }
      } else {
        const res = await fetch("/api/auth/customer/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target: validation.formatted,
            code,
            name: fullName,
          }),
        });

        data = await res.json();

        if (!res.ok || !data.success) {
          if (data.error === "EXPIRED") {
            setOtpErrorMessage(
              "Verification code has expired. Please tap 'Resend Code'.",
            );
            toast({
              title: "Code Expired",
              description: data.message || "Code expired. Please request a new one.",
              variant: "error",
            });
          } else {
            setOtpErrorMessage(data.message || "Invalid verification code.");
            toast({
              title: "Verification Failed",
              description: data.message || "Incorrect code. Please try again.",
              variant: "error",
            });
          }
          return;
        }
      }

      // Code is valid! Retrieve existing customer account or build new profile
      const targetKey = validation.formatted;
      const existing = findRegisteredProfile(targetKey);

      let profile: CustomerProfile;
      if (existing) {
        profile = {
          ...existing,
          id: data.customer.id,
          name: fullName.trim() || existing.name || data.customer.name,
          phone: data.customer.phone || existing.phone,
          email: data.customer.email || existing.email,
          isGuest: false,
        };
        toast({
          title: `Welcome back, ${profile.name}!`,
          description: "Your verified profile has been restored.",
          variant: "success",
        });
      } else {
        const cleanName =
          fullName.trim() ||
          (targetKey.includes("@")
            ? targetKey.split("@")[0]
            : `Café Member ${targetKey.replace(/\s+/g, "").slice(-4)}`);

        profile = {
          id: data.customer.id,
          name: data.customer.name || cleanName,
          phone: data.customer.phone,
          email: data.customer.email,
          isGuest: false,
        };

        toast({
          title: `Welcome, ${profile.name}!`,
          description: "Your contact information has been verified.",
          variant: "success",
        });
      }

      setActiveCustomerProfile(cafe.slug, profile);
      onSuccess(profile);
    } catch (err: any) {
      console.error("Verification error:", err);
      const userMsg = getFriendlyErrorMessage(err);
      setOtpErrorMessage(userMsg);
      toast({
        title: "Verification Failed",
        description: userMsg,
        variant: "error",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const validation = validateInput(identifier, inputType);
  const formattedDisplayTarget = validation.valid
    ? validation.formatted
    : identifier || "+91 98765 43210";

  return (
    <div
      className={`w-full max-w-md mx-auto ${
        isModal ? "p-0" : "min-h-screen"
      } bg-white flex flex-col justify-start select-none relative overflow-x-hidden`}
    >
      {/* Invisible Firebase reCAPTCHA container */}
      <div id="firebase-recaptcha-container" />
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TOP HERO: TALLER SUN-DRENCHED AESTHETIC CAFE SCENE (MORE IMAGE VISIBILITY)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative w-full h-[45vh] min-h-[350px] max-h-[440px] overflow-hidden bg-[#F4EFEA] flex flex-col justify-between shrink-0">
        {/* Background Image: Sun-drenched cafe photography with coffee beans & iced latte */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={
              step === "VERIFY_OTP"
                ? "/images/auth/cafe-otp-hero.jpg"
                : "/images/auth/cafe-welcome-hero.jpg"
            }
            alt={cafe.name}
            className="w-full h-full object-cover object-center transition-opacity duration-300"
          />
          {/* Subtle warm ambient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 pointer-events-none" />
        </div>

        {/* Top Control Bar: Circular back button always visible on all steps */}
        <div className="relative z-10 pt-4 px-4 flex items-center justify-between min-h-[48px]">
          <button
            type="button"
            onClick={() => {
              if (step === "VERIFY_OTP") {
                setStep("ENTER_IDENTIFIER");
              } else if (step === "ENTER_IDENTIFIER") {
                setStep("CHOICE");
              } else {
                if (onCancel) {
                  onCancel();
                } else if (onContinueAsGuest) {
                  onContinueAsGuest();
                } else {
                  router.back();
                }
              }
            }}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-black/5 shadow-xs flex items-center justify-center text-stone-800 hover:text-stone-950 transition-all active:scale-95 cursor-pointer"
            aria-label="Back"
          >
            <IconArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="w-10 h-10" />
        </div>

        {/* Center: Circular Logo (No White Box) + Dynamic Serif Cafe Name + Tagline */}
        <div
          className={`relative z-10 pb-5 px-4 flex flex-col ${
            step === "VERIFY_OTP"
              ? "items-center text-center"
              : "items-start text-left sm:items-center sm:text-center pl-6 sm:pl-4"
          }`}
        >
          {/* Clean Rounded-Full Logo (No White Square Background) */}
          <div className="mb-2 flex items-center justify-center">
            {(cafe as any).logoUrl || cafe.logoKey ? (
              <img
                src={(cafe as any).logoUrl || cafe.logoKey}
                alt={cafe.name}
                className="w-12 h-12 rounded-full object-cover shadow-sm ring-1 ring-stone-900/10"
              />
            ) : (
              <svg
                viewBox="0 0 40 40"
                fill="none"
                className="w-10 h-10 text-stone-900"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Center petal */}
                <path d="M20 7 C17.5 11 17.5 16 20 20 C22.5 16 22.5 11 20 7 Z" />
                {/* Left petal */}
                <path d="M18.5 18 C13 18 9 14 10 9 C15 9 17.5 13 18.5 18 Z" />
                {/* Right petal */}
                <path d="M21.5 18 C27 18 31 14 30 9 C25 9 22.5 13 21.5 18 Z" />
                {/* Stem */}
                <path d="M20 20 V25" />
              </svg>
            )}
          </div>

          {/* Dynamic Cafe Name in elegant Serif font */}
          <h2 className="text-[20px]  font-serif font-medium text-stone-900 tracking-wide leading-tight drop-shadow-xs">
            {cafe.name}
          </h2>

          {/* Minimalist Subtitle Tagline */}
          <p className="text-[8px] sm:text-[10px] font-semibold tracking-[0.25em] uppercase text-stone-700/90 mt-0.5">
            COFFEE &bull; FOOD &bull; GOOD VIBES
          </p>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SIGNATURE CENTER BEND ORGANIC WAVE (EXACT IMAGE 2 CURVE)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="w-full h-11 overflow-hidden leading-none select-none pointer-events-none relative z-20 -mb-[1px]">
          <svg
            viewBox="0 0 400 45"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full block text-white fill-current"
            preserveAspectRatio="none"
          >
            <path
              d="M 0,28 C 45,12 80,8 115,10 C 155,12 175,34 215,34 C 265,34 295,8 335,8 C 365,8 385,20 400,24 L 400,45 L 0,45 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTTOM SURFACE: PURE CLEAN WHITE (NICELY PROPORTIONED, NO EMPTY GAP)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white px-6 pt-3 pb-8 flex-1 flex flex-col justify-between">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STEP 1: WELCOME BACK (GOOGLE OR PHONE CHOICE)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {step === "CHOICE" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight">
                Welcome Back
              </h3>
              <p className="text-sm text-stone-500 font-normal leading-snug">
                Login to order, earn rewards and explore our menu.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Real Better Auth Continue with Google */}
              <button
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignIn}
                className="w-full h-13 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 text-stone-800 text-sm font-semibold shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {isGoogleLoading
                    ? "Connecting with Google..."
                    : "Continue with Google"}
                </span>
              </button>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <span className="relative px-3 bg-white text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
                  OR
                </span>
              </div>

              {/* Continue with Phone */}
              <button
                type="button"
                onClick={() => {
                  setInputType("phone");
                  setStep("ENTER_IDENTIFIER");
                }}
                className="w-full h-13 rounded-2xl bg-[#F7F5F2] hover:bg-[#EFECE6] border border-stone-200/70 text-stone-800 text-sm font-semibold active:scale-[0.99] transition-all flex items-center justify-between px-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <IconDeviceMobile className="w-5 h-5 text-stone-700 stroke-[1.8]" />
                  <span>Continue with Phone</span>
                </div>
                <IconChevronRight className="w-4.5 h-4.5 text-stone-400 stroke-[2]" />
              </button>

              {/* Continue as Guest option */}
              {onContinueAsGuest && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={onContinueAsGuest}
                    className="text-xs font-medium text-stone-500 hover:text-stone-900 underline underline-offset-4 cursor-pointer"
                  >
                    Continue as Guest
                  </button>
                </div>
              )}
            </div>

            {/* Footer Tagline & Sprout */}
            <div className="pt-6 flex flex-col items-center justify-center gap-1.5 text-stone-400">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                className="w-10 h-10 text-[#8B4513]"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 7 C17.5 11 17.5 16 20 20 C22.5 16 22.5 11 20 7 Z" />
                <path d="M18.5 18 C13 18 9 14 10 9 C15 9 17.5 13 18.5 18 Z" />
                <path d="M21.5 18 C27 18 31 14 30 9 C25 9 22.5 13 21.5 18 Z" />
                <path d="M20 20 V25" />
              </svg>
              <p className="text-[11px] font-medium tracking-wide text-stone-400">
                Good Coffee &bull; Better Moments
              </p>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STEP 1.5: ENTER MOBILE NUMBER OR EMAIL (STRICT VALIDATION)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {step === "ENTER_IDENTIFIER" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-[26px] font-extrabold text-stone-900 tracking-tight leading-tight">
                {inputType === "phone"
                  ? "Continue with Phone"
                  : "Continue with Email"}
              </h3>
              <p className="text-sm text-stone-500 font-normal leading-snug">
                {inputType === "phone"
                  ? "We'll send a 6-digit verification code to your mobile."
                  : "We'll send a 6-digit verification code to your email inbox."}
              </p>
            </div>

            {/* Toggle between Phone and Email */}
            <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setInputType("phone");
                  setInputError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  inputType === "phone"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <IconDeviceMobile className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputType("email");
                  setInputError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  inputType === "email"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <IconMail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="space-y-3.5 pt-1"
            >
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1.5">
                  {inputType === "phone" ? "Mobile Number" : "Email Address"}
                </label>
                {inputType === "phone" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 px-3 py-3 rounded-2xl bg-[#F7F5F2] border border-stone-200 text-xs font-bold text-stone-800 text-center select-none">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={identifier}
                      onChange={(e) => {
                        setInputError(null);
                        setIdentifier(e.target.value.replace(/[^\d\s]/g, ""));
                      }}
                      placeholder="98765 43210"
                      className={`flex-1 px-4 py-3 rounded-2xl border ${
                        inputError
                          ? "border-rose-400 bg-rose-50/20"
                          : "border-stone-200 bg-white"
                      } text-sm font-semibold text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900`}
                    />
                  </div>
                ) : (
                  <input
                    type="email"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => {
                      setInputError(null);
                      setIdentifier(e.target.value);
                    }}
                    placeholder="name@example.com"
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      inputError
                        ? "border-rose-400 bg-rose-50/20"
                        : "border-stone-200 bg-white"
                    } text-sm font-semibold text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900`}
                  />
                )}

                {inputError && (
                  <div className="flex items-center gap-1.5 text-rose-500 text-xs mt-1.5 font-medium">
                    <IconAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{inputError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1.5">
                  Your Name{" "}
                  <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rohan Mehta"
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 text-sm font-medium text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full h-13 rounded-2xl text-white text-sm font-bold shadow-md cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{
                    backgroundColor: visualTheme.avatarFallbackBg || "#8B4513",
                    boxShadow: `0 4px 14px ${visualTheme.buttonShadow || "rgba(139, 69, 19, 0.25)"}`,
                  }}
                >
                  {isSendingOtp ? (
                    <span>Sending Code...</span>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <IconChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STEP 2: ENTER VERIFICATION CODE (STRICT 30S TTL & PROPER VALIDATION)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {step === "VERIFY_OTP" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-[26px] font-extrabold text-stone-900 tracking-tight leading-tight">
                Enter Verification Code
              </h3>
              <p className="text-sm text-stone-500 font-normal leading-snug">
                We've sent a 6-digit code to
              </p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-sm font-bold text-stone-900 font-mono">
                  {formattedDisplayTarget}
                </span>
                <button
                  type="button"
                  onClick={() => setStep("ENTER_IDENTIFIER")}
                  className="p-1 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
                  title="Change destination"
                >
                  <IconEdit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 6 Individual Rounded OTP Boxes */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-1">
              {otpDigits.map((digit, idx) => {
                const isFirstEmpty = idx === 0 && !digit && !isVerifying;
                return (
                  <div key={idx} className="relative flex-1">
                    <input
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={`w-full h-14 sm:h-15 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border transition-all duration-150 focus:outline-none ${
                        otpErrorMessage
                          ? "border-rose-400 bg-rose-50/20 text-stone-900"
                          : digit
                            ? "border-stone-900 bg-white text-stone-900 shadow-xs"
                            : isFirstEmpty
                              ? "border-2 border-[#8B4513] bg-white text-stone-900"
                              : "border-stone-200 bg-white text-stone-900 focus:border-[#8B4513] focus:ring-1 focus:ring-[#8B4513]"
                      }`}
                    />
                    {isFirstEmpty && !otpErrorMessage && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-0.5 h-6 bg-[#8B4513] animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error Message if expired or invalid */}
            {otpErrorMessage && (
              <div className="flex items-center gap-1.5 text-rose-600 text-xs font-medium">
                <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpErrorMessage}</span>
              </div>
            )}

            {/* Resend Cooldown Counter (5-minute TTL) */}
            <div className="text-xs text-stone-500 text-left pt-0.5 flex items-center justify-between">
              {resendCooldown > 0 ? (
                <div className="flex items-center gap-1.5">
                  <IconClock className="w-3.5 h-3.5 text-[#8B4513]" />
                  <span>
                    Valid for:{" "}
                    <span className="font-semibold text-[#8B4513] font-mono">
                      {Math.floor(resendCooldown / 60).toString().padStart(2, "0")}:
                      {(resendCooldown % 60).toString().padStart(2, "0")}
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-rose-500 font-medium">
                  Code expired (5m limit)
                </span>
              )}

              <div>
                {resendCooldown === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp(identifier)}
                    className="font-bold text-[#8B4513] hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span className="text-stone-400 text-[11px]">
                    Didn't receive code?
                  </span>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isVerifying || resendCooldown === 0}
                onClick={() => verifyAndLogin()}
                className="w-full h-13 rounded-2xl text-white text-sm font-semibold shadow-md cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: visualTheme.avatarFallbackBg || "#8B4513",
                  boxShadow: `0 4px 14px ${visualTheme.buttonShadow || "rgba(139, 69, 19, 0.25)"}`,
                }}
              >
                {isVerifying ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <span className="text-base">&rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
