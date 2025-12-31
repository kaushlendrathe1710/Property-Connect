import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PropertyCard } from "@/components/property-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property, Favorite } from "@shared/schema";

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: favorites, isLoading: favoritesLoading } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const isLoading = favoritesLoading || propertiesLoading;

  const favoritePropertyIds = useMemo(() => {
    return new Set(favorites?.map((f) => f.propertyId) || []);
  }, [favorites]);

  const favoriteProperties = useMemo(() => {
    if (!properties || !favorites) return [];
    return properties.filter((p) => favoritePropertyIds.has(p.id));
  }, [properties, favorites, favoritePropertyIds]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).id : null;
      await apiRequest("DELETE", `/api/favorites/${propertyId}?userId=${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "Removed from favorites" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Heart className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view saved properties</h2>
        <p className="text-muted-foreground mb-6">
          Save your favorite properties and access them anytime
        </p>
        <Button asChild data-testid="button-signin">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Saved Properties</h1>
        <p className="text-muted-foreground">
          Properties you've saved for later
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-md" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favoriteProperties.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {favoriteProperties.length} saved {favoriteProperties.length === 1 ? "property" : "properties"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorite={true}
                onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
              />
            ))}
          </div>
        </>
      ) : (
        <Card className="py-16 text-center">
          <CardContent>
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved properties yet</h3>
            <p className="text-muted-foreground mb-6">
              Start browsing and save properties you're interested in
            </p>
            <Button asChild className="gap-2" data-testid="button-browse">
              <Link href="/properties">
                Browse Properties
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
