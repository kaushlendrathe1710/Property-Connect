import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Check, X, Eye, MapPin, Building2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Property } from "@shared/schema";

export default function AdminApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rejectReason, setRejectReason] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data: pendingListings, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/admin/pending-listings"],
    enabled: user?.role === "admin",
  });

  const approveMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await apiRequest("PATCH", `/api/admin/properties/${propertyId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Listing approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve listing", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ propertyId, reason }: { propertyId: string; reason: string }) => {
      await apiRequest("PATCH", `/api/admin/properties/${propertyId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedProperty(null);
      setRejectReason("");
      toast({ title: "Listing rejected" });
    },
    onError: () => {
      toast({ title: "Failed to reject listing", variant: "destructive" });
    },
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this page</p>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Pending Approvals</h1>
          {pendingListings && pendingListings.length > 0 && (
            <Badge variant="secondary">{pendingListings.length}</Badge>
          )}
        </div>
        <p className="text-muted-foreground">Review and approve property listings</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <Skeleton className="h-32 w-48 rounded-md" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pendingListings && pendingListings.length > 0 ? (
        <div className="space-y-4">
          {pendingListings.map((listing) => (
            <Card key={listing.id} data-testid={`card-pending-${listing.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={listing.images?.[0] || defaultImage}
                    alt={listing.title}
                    className="h-32 w-full md:w-48 object-cover rounded-md"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold">{listing.title}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {listing.address}, {listing.city}, {listing.state}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={listing.listingType === "sale" ? "default" : "secondary"}>
                        For {listing.listingType === "sale" ? "Sale" : "Lease"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{listing.propertyType}</Badge>
                      <span className="font-semibold text-primary">
                        {formatPrice(listing.price)}
                        {listing.listingType === "lease" && "/mo"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{listing.bedrooms} beds</span>
                      <span>{listing.bathrooms} baths</span>
                      <span>{listing.squareFeet.toLocaleString()} sqft</span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 justify-end">
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link href={`/property/${listing.id}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => approveMutation.mutate(listing.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-${listing.id}`}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => setSelectedProperty(listing)}
                          data-testid={`button-reject-${listing.id}`}
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Listing</DialogTitle>
                          <DialogDescription>
                            Provide a reason for rejecting "{listing.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              rejectMutation.mutate({
                                propertyId: listing.id,
                                reason: rejectReason,
                              })
                            }
                            disabled={rejectMutation.isPending}
                          >
                            Reject Listing
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <CardContent>
            <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending approvals</h3>
            <p className="text-muted-foreground">All listings have been reviewed</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
