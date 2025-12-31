import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageSquare, Mail, Phone, Clock, Check, AlertCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InquiryWithDetails } from "@shared/schema";

export default function Inquiries() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: inquiries, isLoading } = useQuery<InquiryWithDetails[]>({
    queryKey: ["/api/inquiries"],
    enabled: isAuthenticated && (user?.role === "seller" || user?.role === "agent"),
  });

  const markReadMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      await apiRequest("PATCH", `/api/inquiries/${inquiryId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Recently";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated || (user?.role !== "seller" && user?.role !== "agent")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          Only sellers and agents can view inquiries
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const unreadCount = inquiries?.filter((i) => !i.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Inquiries</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} new</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Messages from potential buyers about your properties
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : inquiries && inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card
              key={inquiry.id}
              className={inquiry.isRead ? "" : "border-primary/50 bg-primary/5"}
              data-testid={`card-inquiry-${inquiry.id}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={inquiry.buyer?.avatar || undefined} />
                    <AvatarFallback>
                      {inquiry.buyer ? getInitials(inquiry.buyer.fullName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {inquiry.buyer?.fullName || "Unknown"}
                          {!inquiry.isRead && (
                            <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                          )}
                        </h3>
                        <Link
                          href={`/property/${inquiry.propertyId}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {inquiry.property?.title || "Property"}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(inquiry.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                      {inquiry.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <a
                        href={`mailto:${inquiry.email}`}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {inquiry.email}
                      </a>
                      {inquiry.phone && (
                        <a
                          href={`tel:${inquiry.phone}`}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {inquiry.phone}
                        </a>
                      )}
                      {!inquiry.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markReadMutation.mutate(inquiry.id)}
                          className="gap-1"
                          data-testid={`button-mark-read-${inquiry.id}`}
                        >
                          <Check className="h-4 w-4" />
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                  {inquiry.property?.images?.[0] && (
                    <Link href={`/property/${inquiry.propertyId}`} className="hidden md:block">
                      <img
                        src={inquiry.property.images[0]}
                        alt={inquiry.property.title}
                        className="h-20 w-28 object-cover rounded-md"
                      />
                    </Link>
                  )}
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
            <p className="text-muted-foreground">
              When buyers contact you about your properties, you'll see their messages here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
