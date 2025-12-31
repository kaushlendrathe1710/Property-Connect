import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Eye, MessageSquare, Building2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import type { Property, Inquiry } from "@shared/schema";

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();

  const { data: listings, isLoading: listingsLoading } = useQuery<Property[]>({
    queryKey: ["/api/my-listings"],
    enabled: isAuthenticated && (user?.role === "seller" || user?.role === "agent"),
  });

  const { data: inquiries, isLoading: inquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
    enabled: isAuthenticated && (user?.role === "seller" || user?.role === "agent"),
  });

  if (!isAuthenticated || (user?.role !== "seller" && user?.role !== "agent")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          Only sellers and agents can view analytics
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const isLoading = listingsLoading || inquiriesLoading;

  const totalListings = listings?.length || 0;
  const activeListings = listings?.filter((l) => l.status === "approved").length || 0;
  const pendingListings = listings?.filter((l) => l.status === "pending").length || 0;
  const totalViews = listings?.reduce((sum, l) => sum + l.views, 0) || 0;
  const totalInquiries = inquiries?.length || 0;
  const unreadInquiries = inquiries?.filter((i) => !i.isRead).length || 0;

  const stats = [
    {
      title: "Total Listings",
      value: totalListings,
      description: `${activeListings} active, ${pendingListings} pending`,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Total Views",
      value: totalViews,
      description: "Across all listings",
      icon: Eye,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Total Inquiries",
      value: totalInquiries,
      description: `${unreadInquiries} unread`,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Avg. Views/Listing",
      value: totalListings > 0 ? Math.round(totalViews / totalListings) : 0,
      description: "Per property",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  const topListings = listings
    ?.filter((l) => l.status === "approved")
    .sort((a, b) => b.views - a.views)
    .slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Analytics</h1>
        <p className="text-muted-foreground">Track the performance of your listings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-10 w-10 rounded-md mb-3" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat, index) => (
              <Card key={index} data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className={`h-10 w-10 rounded-md ${stat.bgColor} flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-sm font-medium">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Top Performing Listings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Listings
          </CardTitle>
          <CardDescription>Your most viewed properties</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-16 w-24 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : topListings.length > 0 ? (
            <div className="space-y-4">
              {topListings.map((listing, index) => (
                <Link
                  key={listing.id}
                  href={`/property/${listing.id}`}
                  className="flex gap-4 p-3 rounded-md hover-elevate"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <img
                    src={listing.images?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200"}
                    alt={listing.title}
                    className="h-16 w-24 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{listing.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {listing.city}, {listing.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">{listing.views}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active listings yet</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/create-listing">Create Your First Listing</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
