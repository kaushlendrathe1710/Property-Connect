import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { PropertyForm } from "@/components/property-form";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { PropertyFormData } from "@shared/schema";

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const propertyData = {
        ...data,
        price: data.price,
        bedrooms: parseInt(data.bedrooms),
        bathrooms: parseInt(data.bathrooms),
        squareFeet: parseInt(data.squareFeet),
        yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt) : undefined,
        ownerId: user?.id,
        ownerType: user?.role,
        status: "pending",
      };
      await apiRequest("POST", "/api/properties", propertyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Listing created!",
        description: "Your property has been submitted for review.",
      });
      navigate("/my-listings");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create listing",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || (user?.role !== "seller" && user?.role !== "agent")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          Only sellers and agents can create listings
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Create New Listing</h1>
        <p className="text-muted-foreground">
          Fill in the details below to list your property
        </p>
      </div>

      <PropertyForm
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        mode="create"
      />
    </div>
  );
}
