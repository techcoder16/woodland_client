import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Header } from "./Header";
import { ThemeToggle } from "./ThemeToggle";
import {
  Building2,
  CircleUser,
  LayoutDashboard,
  LogOut,
  Settings,
  Users2,
  Wallet,
  Shield,
  Wrench,
  HardHat,
  ChevronDown,
} from "lucide-react";
import { Button } from "../ui/button";
import logo from "@/assets/logo.png";
import { TbTransactionDollar } from "react-icons/tb";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, logout, isAdmin, canAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const financeActive = location.pathname.startsWith("/finance/");
  const [financeOpen, setFinanceOpen] = useState(financeActive);

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Routes considered part of the Finance group (kept in sync with the
  // sub-items rendered below). Used so the parent "Finance" row itself
  // shows up whenever the user can access at least one child route.
  const financeRoutes = [
    "/finance/landlord-payments",
    "/finance/landlord-payments/new",
    "/finance/landlord-transactions",
    "/finance/landlord-transactions/new",
    "/finance/woodland-ocr",
  ];

  // Define all possible menu items with their routes
  const allMenuItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Properties", path: "/properties", icon: Building2 },
    { label: "Landlords", path: "/vendors", icon: Users2 },
    { label: "Maintenance", path: "/maintenance", icon: Wrench },
    { label: "Contractors", path: "/contractors", icon: HardHat },
    { label: "Transactions", path: "/transaction", icon: TbTransactionDollar },
    { label: "Finance", path: "/finance/landlord-payments", icon: Wallet },
    { label: "Tenants", path: "/tenants", icon: CircleUser },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    // Admin can see everything
    if (isAdmin) return true;

    // The Finance parent row shows if the user has access to any child route
    if (item.label === "Finance") {
      return financeRoutes.some(route => canAccess(route));
    }

    // Regular users can only see items they have permission for
    return canAccess(item.path);
  });

  // Add admin menu item if user is admin
  if (isAdmin) {
    menuItems.push({ label: "Admin Panel", path: "/admin", icon: Shield });
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="inset" className="border-r border-border/70">
        {/* Logo */}
        <SidebarHeader className="flex items-center justify-center py-5 border-b border-border/70">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src={logo} alt="logo" className="h-8 w-auto" />
          </div>
        </SidebarHeader>

        {/* Menu */}
        <SidebarContent>
          <SidebarMenu className="px-2 mt-4 space-y-0.5">
            {menuItems.map(({ label, path, icon: Icon }) => {
              if (label === "Finance") {
                // "New Landlord Transaction" is deliberately not a sidebar
                // link — creating a payment happens from inside the
                // Landlord Transactions page itself, not its own nav entry.
                const financeItems = [
                  { label: "Landlord Transactions", path: "/finance/landlord-transactions" },
                  { label: "Woodland OCR", path: "/finance/woodland-ocr" },
                ].filter((item) => isAdmin || canAccess(item.path));
                return (
                  <React.Fragment key={path}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => { setFinanceOpen((open) => !open); if (!financeActive) navigate(path); }}
                        isActive={financeActive}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${financeActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        <span>Finance</span>
                        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${financeOpen ? "rotate-180" : ""}`} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {financeOpen && financeItems.map((item) => {
                      const childActive = location.pathname === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            onClick={() => navigate(item.path)}
                            isActive={childActive}
                            className={`ml-5 flex items-center rounded-lg px-3 py-2 text-xs ${childActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                          >
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </React.Fragment>
                );
              }
              const active = location.pathname === path;
              return (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    onClick={() => navigate(path)}
                    isActive={active}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150
                      ${
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }
                    `}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] transition-colors ${
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    <span>{label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3 space-y-2 border-t border-border/70">
          <ThemeToggle />
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main */}
      <SidebarInset className="min-h-screen overflow-x-hidden bg-background">
        <Header />
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
