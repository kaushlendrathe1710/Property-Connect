import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Check,
  Phone,
  Mail,
  Loader2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { inquiryFormSchema, type InquiryFormData, type PropertyWithOwner, type Favorite } from "@shared/schema";

export default function PropertyDetail() {
  const [, params] = useRoute("/property/:id");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const { data: property, isLoading } = useQuery<PropertyWithOwner>({
    queryKey: ["/api/properties", params?.id],
    enabled: !!params?.id,
  });

  const { data: favorites } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const isFavorite = favorites?.some((f) => f.propertyId === params?.id) || false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${params?.id}?userId=${user?.id}`);
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId: params?.id, userId: user?.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
      });
    },
  });

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      message: "",
      phone: user?.phone || "",
      email: user?.email || "",
    },
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: InquiryFormData) => {
      await apiRequest("POST", "/api/inquiries", {
        ...data,
        propertyId: params?.id,
        sellerId: property?.ownerId,
        buyerId: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent!",
        description: "The property owner will contact you soon.",
      });
      setInquiryOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Failed to send inquiry",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmitInquiry = (data: InquiryFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send an inquiry",
        variant: "destructive",
      });
      return;
    }
    inquiryMutation.mutate(data);
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Property not found</h2>
        <p className="text-muted-foreground mb-4">This property may have been removed</p>
        <Button asChild variant="outline">
          <Link href="/properties">Browse Properties</Link>
        </Button>
      </div>
    );
  }

  const images = property.images && property.images.length > 0 ? property.images : [defaultImage];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button asChild variant="ghost" className="gap-2" data-testid="button-back">
          <Link href="/properties">
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavoriteMutation.mutate()}
            disabled={toggleFavoriteMutation.isPending}
            data-testid="button-favorite"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" data-testid="button-share">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={images[selectedImage]}
            alt={property.title}
            className="w-full h-full object-cover"
            data-testid="img-main"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={property.listingType === "sale" ? "default" : "secondary"}>
              For {property.listingType === "sale" ? "Sale" : "Lease"}
            </Badge>
            {property.isFeatured && <Badge variant="destructive">Featured</Badge>}
          </div>
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                  selectedImage === idx ? "border-primary" : "border-transparent"
                }`}
                data-testid={`button-thumbnail-${idx}`}
              >
                <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-title">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {property.address}, {property.city}, {property.state} {property.zipCode}
              </span>
            </div>
          </div>

          <p className="text-3xl font-bold text-primary" data-testid="text-price">
            {formatPrice(property.price)}
            {property.listingType === "lease" && (
              <span className="text-lg font-normal text-muted-foreground">/month</span>
            )}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-semibold">{property.bedrooms}</p>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-semibold">{property.bathrooms}</p>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Square className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-semibold">{property.squareFeet.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Sq Ft</p>
                </div>
              </CardContent>
            </Card>
            {property.yearBuilt && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-semibold">{property.yearBuilt}</p>
                    <p className="text-sm text-muted-foreground">Year Built</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-semibold mb-3">About this property</h2>
            <p className="text-muted-foreground whitespace-pre-line" data-testid="text-description">
              {property.description}
            </p>
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Contact Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact {property.ownerType === "agent" ? "Agent" : "Owner"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.owner && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={property.owner.avatar || undefined} />
                    <AvatarFallback>{getInitials(property.owner.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{property.owner.fullName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{property.owner.role}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {property.owner?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{property.owner.phone}</span>
                  </div>
                )}
                {property.owner?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{property.owner.email}</span>
                  </div>
                )}
              </div>

              <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-contact">
                    Send Inquiry
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Contact about this property</DialogTitle>
                    <DialogDescription>
                      Send a message to the {property.ownerType === "agent" ? "agent" : "owner"} about this property
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitInquiry)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Email</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-inquiry-email" />
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
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-inquiry-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="I'm interested in this property..."
                                className="min-h-[100px]"
                                {...field}
                                data-testid="input-inquiry-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={inquiryMutation.isPending}
                        data-testid="button-send-inquiry"
                      >
                        {inquiryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Send Message
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="capitalize">{property.propertyType}</Badge>
                <span>Listed {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : "recently"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
