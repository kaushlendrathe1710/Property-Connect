import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Building2, Edit, Trash2, Eye, MoreVertical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property } from "@shared/schema";

export default function MyListings() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: listings, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/my-listings"],
    enabled: isAuthenticated && (user?.role === "seller" || user?.role === "agent"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await apiRequest("DELETE", `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
      toast({ title: "Listing deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete listing",
        variant: "destructive",
      });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "sold":
        return <Badge className="bg-green-600">Sold</Badge>;
      case "leased":
        return <Badge className="bg-blue-600">Leased</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAuthenticated || (user?.role !== "seller" && user?.role !== "agent")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          Only sellers and agents can manage listings
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format&fit=crop&q=60";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">My Listings</h1>
          <p className="text-muted-foreground">Manage your property listings</p>
        </div>
        <Button asChild className="gap-2" data-testid="button-create-listing">
          <Link href="/create-listing">
            <Plus className="h-4 w-4" />
            New Listing
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-32 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id} data-testid={`card-listing-${listing.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Link href={`/property/${listing.id}`}>
                    <img
                      src={listing.images?.[0] || defaultImage}
                      alt={listing.title}
                      className="h-24 w-32 object-cover rounded-md flex-shrink-0"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/property/${listing.id}`}>
                          <h3 className="font-semibold truncate hover:text-primary">
                            {listing.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">
                          {listing.address}, {listing.city}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-menu-${listing.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/property/${listing.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/edit-listing/${listing.id}`} className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{listing.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(listing.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-semibold text-primary">
                        {formatPrice(listing.price)}
                        {listing.listingType === "lease" && <span className="text-xs font-normal">/mo</span>}
                      </span>
                      {getStatusBadge(listing.status)}
                      <Badge variant="outline" className="capitalize">{listing.propertyType}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{listing.bedrooms} beds</span>
                      <span>{listing.bathrooms} baths</span>
                      <span>{listing.squareFeet.toLocaleString()} sqft</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {listing.views} views
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first property listing to get started
            </p>
            <Button asChild className="gap-2" data-testid="button-create-first">
              <Link href="/create-listing">
                <Plus className="h-4 w-4" />
                Create Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
