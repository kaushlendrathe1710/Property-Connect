import { Link, useLocation } from "wouter";
import {
  Home,
  Search,
  Heart,
  Plus,
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  CheckCircle,
  LogOut,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const publicMenuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Browse Properties",
    url: "/properties",
    icon: Search,
  },
];

const buyerMenuItems = [
  {
    title: "Saved Properties",
    url: "/favorites",
    icon: Heart,
  },
  {
    title: "My Inquiries",
    url: "/my-inquiries",
    icon: MessageSquare,
  },
];

const sellerMenuItems = [
  {
    title: "My Listings",
    url: "/my-listings",
    icon: Building2,
  },
  {
    title: "Create Listing",
    url: "/create-listing",
    icon: Plus,
  },
  {
    title: "Inquiries",
    url: "/inquiries",
    icon: MessageSquare,
  },
];

const agentMenuItems = [
  {
    title: "My Listings",
    url: "/my-listings",
    icon: Building2,
  },
  {
    title: "Create Listing",
    url: "/create-listing",
    icon: Plus,
  },
  {
    title: "Inquiries",
    url: "/inquiries",
    icon: MessageSquare,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
];

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Shield,
  },
  {
    title: "Pending Approvals",
    url: "/admin/approvals",
    icon: CheckCircle,
  },
  {
    title: "All Listings",
    url: "/admin/listings",
    icon: Building2,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const getRoleMenuItems = () => {
    if (!user) return [];
    switch (user.role) {
      case "buyer":
        return buyerMenuItems;
      case "seller":
        return sellerMenuItems;
      case "agent":
        return agentMenuItems;
      case "admin":
        return adminMenuItems;
      default:
        return [];
    }
  };

  const roleMenuItems = getRoleMenuItems();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg">PropMarket</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAuthenticated && roleMenuItems.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="capitalize">{user?.role} Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {roleMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                      >
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar || undefined} alt={user.fullName || "User"} />
                <AvatarFallback>{getInitials(user.fullName || user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.fullName || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button asChild className="w-full" data-testid="button-signin">
              <Link href="/login">Sign In / Register</Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
