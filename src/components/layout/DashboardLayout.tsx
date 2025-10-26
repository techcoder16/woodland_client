import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
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

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Define all possible menu items with their routes
  const allMenuItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Properties", path: "/properties", icon: Building2 },
    { label: "Vendors & Landlords", path: "/vendors", icon: Users2 },
    { label: "Transactions", path: "/transaction", icon: TbTransactionDollar },
    { label: "Finance", path: "/property-management", icon: Wallet },
    { label: "Tenants", path: "/tenants", icon: CircleUser },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    // Admin can see everything
    if (isAdmin) return true;
    
    // Regular users can only see items they have permission for
    return canAccess(item.path);
  });

  // Add admin menu item if user is admin
  if (isAdmin) {
    menuItems.push({ label: "Admin Panel", path: "/admin", icon: Shield });
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="inset" className="border-r">
        {/* Logo */}
        <SidebarHeader className="flex items-center justify-center py-4 border-b">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src={logo} alt="logo" className="h-8 w-auto" />
            <span className="font-semibold text-lg">MyApp</span>
          </div>
        </SidebarHeader>

        {/* Menu */}
        <SidebarContent>
          <SidebarMenu className="px-2 mt-4 space-y-1">
            {menuItems.map(({ label, path, icon: Icon }) => {
              const active = window.location.pathname === path;
              return (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    onClick={() => navigate(path)}
                    isActive={active}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition
                      ${
                        active
                          ? "bg-muted font-medium"
                          : "hover:bg-muted/40 text-muted-foreground"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3 space-y-2 border-t">
          <ThemeToggle />
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main */}
      <SidebarInset className="min-h-screen">
        <Header />
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
