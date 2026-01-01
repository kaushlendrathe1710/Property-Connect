import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthStep = "email" | "otp";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const requestOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/request-otp", { email });
      return res.json();
    },
    onSuccess: () => {
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", { email, otp });
      return res.json();
    },
    onSuccess: (data) => {
      login(data.user);
      
      if (data.isNewUser) {
        setLocation("/complete-profile");
      } else {
        redirectToDashboard(data.user.role);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid OTP",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
    },
  });

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case "admin":
        setLocation("/admin");
        break;
      case "agent":
      case "seller":
        setLocation("/my-listings");
        break;
      default:
        setLocation("/properties");
    }
  };

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      redirectToDashboard(user.role);
    }
  }, [isLoading, isAuthenticated, user]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      requestOtpMutation.mutate(email);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      verifyOtpMutation.mutate({ email, otp });
    }
  };

  const handleOtpComplete = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      verifyOtpMutation.mutate({ email, otp: value });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to PropMarket</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a verification code"
              : "Enter the 6-digit code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={requestOtpMutation.isPending}
                data-testid="button-send-otp"
              >
                {requestOtpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Continue with Email"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  Code sent to <span className="font-medium text-foreground">{email}</span>
                </div>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpComplete}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={verifyOtpMutation.isPending || otp.length !== 6}
                data-testid="button-verify-otp"
              >
                {verifyOtpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                }}
                data-testid="button-back-to-email"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Use different email
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => requestOtpMutation.mutate(email)}
                  disabled={requestOtpMutation.isPending}
                  data-testid="button-resend-otp"
                >
                  Didn't receive code? Resend
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
