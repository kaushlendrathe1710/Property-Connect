import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export interface PropertyFilters {
  search: string;
  listingType: string;
  propertyType: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  city: string;
}

interface PropertyFiltersProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onClearFilters: () => void;
}

const propertyTypes = [
  { value: "all", label: "All Types" },
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
];

const bedroomOptions = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

const bathroomOptions = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

export function PropertyFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
}: PropertyFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [
    filters.listingType !== "all",
    filters.propertyType !== "all",
    filters.bedrooms !== "any",
    filters.bathrooms !== "any",
    filters.minPrice > 0,
    filters.maxPrice < 10000000,
    filters.city !== "",
  ].filter(Boolean).length;

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by location, title..."
            className="pl-10"
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            data-testid="input-search"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.listingType}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, listingType: value })
            }
          >
            <SelectTrigger className="w-[140px]" data-testid="select-listing-type">
              <SelectValue placeholder="Listing Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="lease">For Lease</SelectItem>
            </SelectContent>
          </Select>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-more-filters">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow down your property search
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(value) =>
                      onFiltersChange({ ...filters, propertyType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-property-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="Enter city name"
                    value={filters.city}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, city: e.target.value })
                    }
                    data-testid="input-city"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Price Range</Label>
                  <div className="px-2">
                    <Slider
                      min={0}
                      max={10000000}
                      step={50000}
                      value={[filters.minPrice, filters.maxPrice]}
                      onValueChange={([min, max]) =>
                        onFiltersChange({ ...filters, minPrice: min, maxPrice: max })
                      }
                      data-testid="slider-price"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatPrice(filters.minPrice)}</span>
                    <span>{formatPrice(filters.maxPrice)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bedrooms</Label>
                    <Select
                      value={filters.bedrooms}
                      onValueChange={(value) =>
                        onFiltersChange({ ...filters, bedrooms: value })
                      }
                    >
                      <SelectTrigger data-testid="select-bedrooms">
                        <SelectValue placeholder="Bedrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        {bedroomOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bathrooms</Label>
                    <Select
                      value={filters.bathrooms}
                      onValueChange={(value) =>
                        onFiltersChange({ ...filters, bathrooms: value })
                      }
                    >
                      <SelectTrigger data-testid="select-bathrooms">
                        <SelectValue placeholder="Bathrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        {bathroomOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      onClearFilters();
                      setIsOpen(false);
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear All
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setIsOpen(false)}
                    data-testid="button-apply-filters"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.listingType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              For {filters.listingType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, listingType: "all" })}
              />
            </Badge>
          )}
          {filters.propertyType !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {filters.propertyType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, propertyType: "all" })}
              />
            </Badge>
          )}
          {filters.city && (
            <Badge variant="secondary" className="gap-1">
              {filters.city}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, city: "" })}
              />
            </Badge>
          )}
          {filters.bedrooms !== "any" && (
            <Badge variant="secondary" className="gap-1">
              {filters.bedrooms}+ beds
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, bedrooms: "any" })}
              />
            </Badge>
          )}
          {filters.bathrooms !== "any" && (
            <Badge variant="secondary" className="gap-1">
              {filters.bathrooms}+ baths
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, bathrooms: "any" })}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs"
            data-testid="button-clear-all"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
