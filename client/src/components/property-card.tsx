import { Heart, MapPin, Bed, Bath, Square, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Property } from "@shared/schema";
import { Link } from "wouter";

interface PropertyCardProps {
  property: Property;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: string) => void;
  showActions?: boolean;
}

export function PropertyCard({
  property,
  isFavorite = false,
  onToggleFavorite,
  showActions = true,
}: PropertyCardProps) {
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60";
  const mainImage = property.images && property.images.length > 0 ? property.images[0] : defaultImage;

  return (
    <Card className="group overflow-visible hover-elevate" data-testid={`card-property-${property.id}`}>
      <div className="relative overflow-hidden rounded-t-md">
        <Link href={`/property/${property.id}`}>
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            data-testid={`img-property-${property.id}`}
          />
        </Link>
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge 
            variant={property.listingType === "sale" ? "default" : "secondary"}
            className="text-xs font-medium"
            data-testid={`badge-listing-type-${property.id}`}
          >
            For {property.listingType === "sale" ? "Sale" : "Lease"}
          </Badge>
          {property.isFeatured && (
            <Badge variant="destructive" className="text-xs font-medium">
              Featured
            </Badge>
          )}
        </div>
        {showActions && onToggleFavorite && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(property.id);
            }}
            data-testid={`button-favorite-${property.id}`}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
            />
          </Button>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs">
          <Eye className="h-3 w-3" />
          <span>{property.views}</span>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-title-${property.id}`}>
            {property.title}
          </h3>
        </div>
        <p className="text-2xl font-bold text-primary mb-2" data-testid={`text-price-${property.id}`}>
          {formatPrice(property.price)}
          {property.listingType === "lease" && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
        </p>
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">{property.address}, {property.city}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            <span>{property.squareFeet.toLocaleString()} sqft</span>
          </div>
        </div>
        <Badge variant="outline" className="mt-3 text-xs capitalize">
          {property.propertyType}
        </Badge>
      </CardContent>
    </Card>
  );
}
