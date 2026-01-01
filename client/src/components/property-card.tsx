import { Heart, MapPin, Bed, Bath, Square, Eye, Calendar, Home, TrendingUp } from "lucide-react";
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
    if (numPrice >= 10000000) {
      return `$${(numPrice / 1000000).toFixed(1)}M`;
    } else if (numPrice >= 100000) {
      return `$${(numPrice / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatFullPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatPricePerSqft = (price: string | number, sqft: number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    const pricePerSqft = numPrice / sqft;
    return `$${pricePerSqft.toFixed(0)}/sqft`;
  };

  const getTimeAgo = (date: Date | string | null) => {
    if (!date) return "Recently";
    const now = new Date();
    const createdAt = new Date(date);
    const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60";
  const mainImage = property.images && property.images.length > 0 ? property.images[0] : defaultImage;
  const imageCount = property.images?.length || 0;

  return (
    <Card className="group overflow-visible hover-elevate" data-testid={`card-property-${property.id}`}>
      <div className="relative overflow-hidden rounded-t-md">
        <Link href={`/property/${property.id}`}>
          <div className="relative">
            <img
              src={mainImage}
              alt={property.title}
              className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
              data-testid={`img-property-${property.id}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        </Link>
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge 
            variant={property.listingType === "sale" ? "default" : "secondary"}
            className="text-xs font-semibold shadow-md"
            data-testid={`badge-listing-type-${property.id}`}
          >
            For {property.listingType === "sale" ? "Sale" : "Rent"}
          </Badge>
          {property.isFeatured && (
            <Badge variant="destructive" className="text-xs font-semibold shadow-md gap-1">
              <TrendingUp className="h-3 w-3" />
              Featured
            </Badge>
          )}
        </div>
        
        {showActions && onToggleFavorite && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm shadow-md"
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
        
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="text-white">
            <p className="text-2xl font-bold drop-shadow-lg" data-testid={`text-price-${property.id}`}>
              {formatFullPrice(property.price)}
              {property.listingType === "lease" && <span className="text-sm font-normal">/mo</span>}
            </p>
            {property.listingType === "sale" && property.squareFeet > 0 && (
              <p className="text-xs text-white/80">
                {formatPricePerSqft(property.price, property.squareFeet)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {imageCount > 1 && (
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                {imageCount} Photos
              </Badge>
            )}
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs gap-1">
              <Eye className="h-3 w-3" />
              {property.views}
            </Badge>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1 mb-1" data-testid={`text-title-${property.id}`}>
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="line-clamp-1">{property.address}, {property.city}, {property.state}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <Badge variant="outline" className="text-xs capitalize shrink-0 gap-1">
            <Home className="h-3 w-3" />
            {property.propertyType}
          </Badge>
          {property.yearBuilt && (
            <Badge variant="outline" className="text-xs shrink-0 gap-1">
              <Calendar className="h-3 w-3" />
              Built {property.yearBuilt}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5" title="Bedrooms">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <Bed className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium">{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Bathrooms">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <Bath className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium">{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Area">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <Square className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium">{property.squareFeet.toLocaleString()}</span>
              <span className="text-muted-foreground text-xs">sqft</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Posted {getTimeAgo(property.createdAt)}</span>
          <Link href={`/property/${property.id}`}>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
