import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PropertyCard } from "@/components/property-card";
import { PropertyFiltersComponent, type PropertyFilters } from "@/components/property-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property, Favorite } from "@shared/schema";

const defaultFilters: PropertyFilters = {
  search: "",
  listingType: "all",
  propertyType: "all",
  minPrice: 0,
  maxPrice: 10000000,
  bedrooms: "any",
  bathrooms: "any",
  city: "",
};

export default function Properties() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);

  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: favorites } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const favoritePropertyIds = useMemo(() => {
    return new Set(favorites?.map((f) => f.propertyId) || []);
  }, [favorites]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (favoritePropertyIds.has(propertyId)) {
        await apiRequest("DELETE", `/api/favorites/${propertyId}?userId=${user?.id}`);
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId, userId: user?.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  const handleToggleFavorite = (propertyId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save properties",
        variant: "destructive",
      });
      return;
    }
    toggleFavoriteMutation.mutate(propertyId);
  };

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    return properties.filter((property) => {
      // Only show approved properties
      if (property.status !== "approved") return false;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          property.title.toLowerCase().includes(searchLower) ||
          property.address.toLowerCase().includes(searchLower) ||
          property.city.toLowerCase().includes(searchLower) ||
          property.state.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Listing type filter
      if (filters.listingType !== "all" && property.listingType !== filters.listingType) {
        return false;
      }

      // Property type filter
      if (filters.propertyType !== "all" && property.propertyType !== filters.propertyType) {
        return false;
      }

      // Price filter
      const price = parseFloat(property.price.toString());
      if (price < filters.minPrice || price > filters.maxPrice) {
        return false;
      }

      // Bedrooms filter
      if (filters.bedrooms !== "any" && property.bedrooms < parseInt(filters.bedrooms)) {
        return false;
      }

      // Bathrooms filter
      if (filters.bathrooms !== "any" && property.bathrooms < parseInt(filters.bathrooms)) {
        return false;
      }

      // City filter
      if (filters.city && !property.city.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [properties, filters]);

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load properties</h2>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Browse Properties</h1>
        <p className="text-muted-foreground">
          Find your perfect property from our curated listings
        </p>
      </div>

      <PropertyFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-md" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorite={favoritePropertyIds.has(property.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </>
      ) : (
        <Card className="py-16 text-center">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters to see more results
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
