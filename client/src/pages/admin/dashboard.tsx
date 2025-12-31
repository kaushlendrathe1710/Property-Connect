import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Building2,
  Users,
  CheckCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import type { Property, User } from "@shared/schema";

interface DashboardStats {
  totalProperties: number;
  pendingApprovals: number;
  totalUsers: number;
  activeListings: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
  });

  const { data: pendingListings, isLoading: pendingLoading } = useQuery<Property[]>({
    queryKey: ["/api/admin/pending-listings"],
    enabled: user?.role === "admin",
  });

  const { data: recentUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/recent-users"],
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this page</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Properties",
      value: stats?.totalProperties || 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Active Listings",
      value: stats?.activeListings || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your real estate platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-10 w-10 rounded-md mb-3" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, index) => (
              <Card key={index} data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className={`h-10 w-10 rounded-md ${stat.bgColor} flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Approvals
              </CardTitle>
              <CardDescription>Listings waiting for review</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href="/admin/approvals">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-12 w-16 rounded-md" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingListings && pendingListings.length > 0 ? (
              <div className="space-y-3">
                {pendingListings.slice(0, 5).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/admin/approvals`}
                    className="flex gap-3 p-2 rounded-md hover-elevate"
                  >
                    <img
                      src={listing.images?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200"}
                      alt={listing.title}
                      className="h-12 w-16 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {listing.city}, {listing.state}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-muted-foreground">No pending approvals</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Recent Users
              </CardTitle>
              <CardDescription>Newly registered users</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href="/admin/users">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex gap-3 items-center p-2 rounded-md hover-elevate">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {u.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{u.fullName}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{u.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-muted-foreground">No recent users</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
