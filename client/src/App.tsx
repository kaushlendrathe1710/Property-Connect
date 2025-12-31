import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider } from "@/context/auth-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Properties from "@/pages/properties";
import PropertyDetail from "@/pages/property-detail";
import Favorites from "@/pages/favorites";
import MyListings from "@/pages/my-listings";
import CreateListing from "@/pages/create-listing";
import Inquiries from "@/pages/inquiries";
import MyInquiries from "@/pages/my-inquiries";
import Analytics from "@/pages/analytics";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminApprovals from "@/pages/admin/approvals";
import AdminUsers from "@/pages/admin/users";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/properties" component={Properties} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/my-listings" component={MyListings} />
      <Route path="/create-listing" component={CreateListing} />
      <Route path="/inquiries" component={Inquiries} />
      <Route path="/my-inquiries" component={MyInquiries} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/approvals" component={AdminApprovals} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/listings" component={Properties} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="propmarket-theme">
        <AuthProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <header className="sticky top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto">
                    <div className="container max-w-7xl mx-auto px-4 py-6">
                      <Router />
                    </div>
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
