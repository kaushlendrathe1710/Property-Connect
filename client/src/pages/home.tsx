import { Link } from "wouter";
import { ArrowRight, Building2, Users, Shield, TrendingUp, Search, Heart, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/property-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@shared/schema";

export default function Home() {
  const { data: featuredProperties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
  });

  const features = [
    {
      icon: Search,
      title: "Smart Search",
      description: "Find your perfect property with advanced filters and real-time search",
    },
    {
      icon: Heart,
      title: "Save Favorites",
      description: "Save properties you love and compare them side by side",
    },
    {
      icon: Key,
      title: "Easy Listings",
      description: "List your property in minutes with our simple listing process",
    },
    {
      icon: Shield,
      title: "Verified Listings",
      description: "All listings are reviewed and verified by our team",
    },
  ];

  const stats = [
    { value: "10K+", label: "Properties Listed" },
    { value: "5K+", label: "Happy Customers" },
    { value: "500+", label: "Verified Agents" },
    { value: "50+", label: "Cities Covered" },
  ];

  const userTypes = [
    {
      icon: Users,
      title: "For Buyers",
      description: "Browse thousands of properties, save favorites, and connect with sellers directly",
      cta: "Start Browsing",
      href: "/properties",
    },
    {
      icon: Building2,
      title: "For Sellers",
      description: "List your property and reach thousands of potential buyers instantly",
      cta: "List Property",
      href: "/login",
    },
    {
      icon: TrendingUp,
      title: "For Agents",
      description: "Manage multiple listings, track leads, and grow your business",
      cta: "Join as Agent",
      href: "/login",
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 px-6 md:px-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="mb-4">
            Trusted by thousands of users
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight" data-testid="text-hero-title">
            Find Your Dream Property
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're buying, selling, or leasing, PropMarket connects you with the perfect property opportunities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="gap-2" data-testid="button-browse-properties">
              <Link href="/properties">
                Browse Properties
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" data-testid="button-list-property">
              <Link href="/login">List Your Property</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <p className="text-3xl md:text-4xl font-bold text-primary" data-testid={`text-stat-${index}`}>
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Features */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Why Choose PropMarket?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We make finding and listing properties simple, secure, and efficient
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate">
              <CardHeader>
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <p className="text-muted-foreground">Handpicked properties just for you</p>
          </div>
          <Button asChild variant="outline" className="gap-2" data-testid="button-view-all">
            <Link href="/properties">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredProperties && featuredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.slice(0, 6).map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <Card className="py-12 text-center">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No featured properties at the moment</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* User Types CTA */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Get Started Today</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of users who trust PropMarket for their real estate needs
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userTypes.map((type, index) => (
            <Card key={index} className="hover-elevate">
              <CardHeader>
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                  <type.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{type.title}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link href={type.href}>
                    {type.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
