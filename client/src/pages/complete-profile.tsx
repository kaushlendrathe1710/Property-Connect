import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { completeProfileSchema, type CompleteProfileData } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Loader2, User, Phone, Briefcase } from "lucide-react";

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();

  const form = useForm<CompleteProfileData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      role: "buyer",
    },
  });

  const completeProfileMutation = useMutation({
    mutationFn: async (data: CompleteProfileData) => {
      const res = await apiRequest("POST", "/api/auth/complete-profile", {
        userId: user?.id,
        ...data,
      });
      return res.json();
    },
    onSuccess: (updatedUser) => {
      login(updatedUser);
      toast({
        title: "Profile Complete",
        description: `Welcome to PropMarket, ${updatedUser.fullName}!`,
      });
      redirectToDashboard(updatedUser.role);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
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

  const onSubmit = (data: CompleteProfileData) => {
    completeProfileMutation.mutate(data);
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us a bit about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your full name"
                          className="pl-10"
                          {...field}
                          data-testid="input-fullname"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="+91 98765 43210"
                          className="pl-10"
                          {...field}
                          data-testid="input-phone"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I want to</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select your role" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buyer">Buy or Lease Properties</SelectItem>
                        <SelectItem value="seller">Sell or Rent My Properties</SelectItem>
                        <SelectItem value="agent">Work as a Real Estate Agent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={completeProfileMutation.isPending}
                data-testid="button-complete-profile"
              >
                {completeProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
