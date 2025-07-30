
import React from "react";
import { Navigate } from "react-router-dom";
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
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Header } from "./Header";
import { ThemeToggle } from "./ThemeToggle";
import { Building2, CircleUser, LayoutDashboard, LogOut, Settings, Users2, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="inset">
        <SidebarHeader className="flex flex-col items-center justify-center py-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600">
            <span className="text-white font-bold text-lg">PM</span>
          </div>
          <h1 className="font-bold text-lg mt-2">Woodland</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate("/dashboard")}
                isActive={window.location.pathname === "/dashboard"}
                tooltip="Dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate("/properties")}
                isActive={window.location.pathname === "/properties"}
                tooltip="Properties"
              >
                <Building2 className="w-5 h-5" />
                <span>Properties</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate("/vendors")}
                isActive={window.location.pathname === "/vendors"}
                tooltip="Vendors & Landlords"
              >
                <Users2 className="w-5 h-5" />
                <span>Vendors & Landlords</span>
              </SidebarMenuButton>


  <SidebarMenuButton 
                onClick={() => navigate("/property-management")}
                isActive={window.location.pathname === "/property-management"}
                tooltip="Finance"
              >
                <Wallet className="w-5 h-5" />
                <span>Finance</span>
              </SidebarMenuButton>


                     <SidebarMenuButton 
                onClick={() => navigate("/tenants")}
                isActive={window.location.pathname === "/tenants"}
                tooltip="Tenants"
              >
                <CircleUser className="w-5 h-5" />
                <span>Tenants</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate("/settings")}
                isActive={window.location.pathname === "/settings"}
                tooltip="Settings"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="space-y-2">
          
          <ThemeToggle />
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={logout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            <span>Logout</span>
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <Header />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
