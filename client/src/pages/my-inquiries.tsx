import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageSquare, Clock, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import type { InquiryWithDetails } from "@shared/schema";

export default function MyInquiries() {
  const { user, isAuthenticated } = useAuth();

  const { data: inquiries, isLoading } = useQuery<InquiryWithDetails[]>({
    queryKey: ["/api/my-inquiries"],
    enabled: isAuthenticated && user?.role === "buyer",
  });

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Recently";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your inquiries</h2>
        <p className="text-muted-foreground mb-6">
          Track your conversations with property owners
        </p>
        <Button asChild data-testid="button-signin">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">My Inquiries</h1>
        <p className="text-muted-foreground">
          Properties you've contacted about
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-28 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : inquiries && inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} data-testid={`card-inquiry-${inquiry.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Link href={`/property/${inquiry.propertyId}`}>
                    <img
                      src={inquiry.property?.images?.[0] || defaultImage}
                      alt={inquiry.property?.title || "Property"}
                      className="h-20 w-28 object-cover rounded-md flex-shrink-0"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/property/${inquiry.propertyId}`}>
                        <h3 className="font-semibold hover:text-primary truncate">
                          {inquiry.property?.title || "Property"}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {formatDate(inquiry.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {inquiry.property?.address}, {inquiry.property?.city}
                    </p>
                    <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">
                      {inquiry.message}
                    </p>
                    {inquiry.isRead && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Seen by owner
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <CardContent>
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inquiries yet</h3>
            <p className="text-muted-foreground mb-6">
              When you contact property owners, your messages will appear here
            </p>
            <Button asChild className="gap-2" data-testid="button-browse">
              <Link href="/properties">
                <Building2 className="h-4 w-4" />
                Browse Properties
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
