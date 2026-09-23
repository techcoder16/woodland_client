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
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import logo from "@/assets/logo.png";
import { Bell, Building2, Clock, LogOut, Menu, User, Wrench } from "lucide-react";
import { getPartyInfo, partyLogout, partyGet, partyPost, PartyKind } from "@/helper/partyAuth";

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

interface PortalNotification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isNew: boolean;
}

export default function PartyDashboardLayout({ kind, children }: PartyDashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [party, setParty] = useState<any>(null);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const base = KIND_BASE[kind];
  // Contractors aren't linked to a property the same way, so they have no
  // notification feed on the backend today.
  const hasNotifications = kind === "vendor" || kind === "tenant";

  useEffect(() => {
    getPartyInfo(kind).then(setParty);
  }, [kind]);

  useEffect(() => {
    if (!hasNotifications) return;
    partyGet<{ notifications: PortalNotification[]; unreadCount: number }>(kind, "property-management/my-notifications")
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => undefined);
  }, [kind, hasNotifications]);

  const handleMarkAllRead = () => {
    if (!hasNotifications || unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
    partyPost(kind, "property-management/my-notifications/mark-read", {}).catch(() => undefined);
  };

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
            {hasNotifications && (
              <DropdownMenu onOpenChange={(open) => open && handleMarkAllRead()}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <span className="sr-only">Notifications</span>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px] flex items-center justify-center"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-6 text-sm text-center text-muted-foreground">No recent activity</div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start gap-3 px-3 py-2.5 border-b last:border-0 hover:bg-muted/40">
                          <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{new Date(notification.createdAt).toLocaleString()}</p>
                          </div>
                          {notification.isNew && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
