import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../ui/button";
import logo from "@/assets/logo.png";
import { Building2, LogOut, Menu, User, Wrench } from "lucide-react";
import { getPartyInfo, partyLogout, PartyKind } from "@/helper/partyAuth";

const KIND_LABELS: Record<PartyKind, string> = {
  vendor: "Landlord",
  tenant: "Tenant",
  contractor: "Contractor",
};

const KIND_LOGIN: Record<PartyKind, string> = {
  vendor: "/landlord/login",
  tenant: "/tenant/login",
  contractor: "/contractor/login",
};

const KIND_BASE: Record<PartyKind, string> = {
  vendor: "/landlord",
  tenant: "/tenant",
  contractor: "/contractor",
};

interface PartyDashboardLayoutProps {
  kind: PartyKind;
  children: React.ReactNode;
}

export default function PartyDashboardLayout({ kind, children }: PartyDashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [party, setParty] = useState<any>(null);
  const base = KIND_BASE[kind];

  useEffect(() => {
    getPartyInfo(kind).then(setParty);
  }, [kind]);

  const handleLogout = async () => {
    await partyLogout(kind);
    navigate(KIND_LOGIN[kind]);
  };

  const menuItems = [
    { label: kind === "contractor" ? "Assigned Jobs" : "Maintenance", path: `${base}/maintenance`, icon: Wrench },
    ...(kind !== "contractor"
      ? [{ label: kind === "vendor" ? "My Properties" : "My Property", path: `${base}/property`, icon: Building2 }]
      : []),
    { label: "Account", path: `${base}/account`, icon: User },
  ];

  const displayName =
    party?.name ||
    [party?.firstName, party?.lastName ?? party?.sureName].filter(Boolean).join(" ") ||
    party?.email ||
    KIND_LABELS[kind];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="inset" className="border-r border-border/70">
        <SidebarHeader className="flex items-center justify-center py-5 border-b border-border/70">
          <div
            onClick={() => navigate(`${base}/maintenance`)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src={logo} alt="logo" className="h-8 w-auto" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="px-2 mt-4 space-y-0.5">
            {menuItems.map(({ label, path, icon: Icon }) => {
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
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3 space-y-2 border-t border-border/70">
          <ThemeToggle />
          <Button variant="outline" className="w-full justify-start text-sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-screen overflow-x-hidden bg-background">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 glass">
          <div className="flex items-center gap-4">
            <SidebarTrigger>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
            <span className="text-sm font-medium text-muted-foreground">{KIND_LABELS[kind]} Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">{displayName}</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/50">
              <User className="h-5 w-5" />
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
