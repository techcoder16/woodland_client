
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  Loader2,
  Building,
  Users2,
  FileText,
  CreditCard,
  Receipt,
  Wrench,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import logo from '@/assets/logo.png'
import { SidebarTrigger } from "@/components/ui/sidebar";
import getApi from "@/helper/getApi";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchRecentActivities, markAllActivitiesRead, addActivity } from "@/redux/dataStore/dashboardSlice";
import { getActivitiesSocket } from "@/helper/socket";

interface GlobalSearchResult {
  type: "property" | "vendor";
  id: string;
  label: string;
  sublabel: string;
}

const activityIconByType: Record<string, React.ElementType> = {
  property: Building,
  vendor: Users2,
  document: FileText,
  payment: CreditCard,
  transaction: Receipt,
  maintenance: Wrench,
};

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { activities } = useAppSelector((state) => state.dashboard);
  const unreadCount = activities.filter((a) => a.isNew).length;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchRecentActivities(20));

    const socket = getActivitiesSocket();
    const handleNewActivity = (activity: any) => {
      dispatch(addActivity({ ...activity, isNew: true }));
    };
    socket.on("newActivity", handleNewActivity);

    return () => {
      socket.off("newActivity", handleNewActivity);
    };
  }, [dispatch]);

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    dispatch(markAllActivitiesRead());
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [propertiesRes, vendorsRes]: any = await Promise.all([
          getApi("properties", `?page=1&limit=5&search=${encodeURIComponent(searchTerm)}`, headers),
          getApi("vendor/getVendors", `?page=1&limit=5&search=${encodeURIComponent(searchTerm)}`, headers),
        ]);

        const propertyResults: GlobalSearchResult[] = (propertiesRes?.items || []).map((p: any) => ({
          type: "property",
          id: p.id,
          label: p.addressLine1 || "Unnamed property",
          sublabel: [p.addressLine1, p.town].filter(Boolean).join(", "),
        }));

        const vendorResults: GlobalSearchResult[] = (vendorsRes?.vendors || []).map((v: any) => ({
          type: "vendor",
          id: v.id,
          label: `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || "Unnamed landlord",
          sublabel: v.email || "",
        }));

        setSearchResults([...propertyResults, ...vendorResults]);
        setSearchOpen(true);
      } catch (error) {
        console.error("Global search failed:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: GlobalSearchResult) => {
    setSearchOpen(false);
    setSearchTerm("");
    if (result.type === "property") {
      navigate("/properties");
    } else {
      navigate("/vendors");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 glass">
      <div className="flex items-center gap-4">
        <SidebarTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SidebarTrigger>
        
        <div className="hidden md:flex items-center">
          <img src={logo} alt="Woodland" className="h-7 w-auto" />
        </div>
      </div>

      <div className="flex-1 mx-8 hidden md:flex">
        <div className="relative w-full max-w-md" ref={searchBoxRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search properties, landlords..."
            className="w-full pl-8 bg-muted/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
          />
          {searchLoading && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {searchOpen && (
            <div className="absolute top-full mt-1 w-full rounded-md border bg-popover shadow-md z-50 max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-b-0 flex flex-col"
                    onClick={() => handleResultClick(result)}
                  >
                    <span className="font-medium">
                      {result.label}
                      <span className="ml-2 text-xs text-muted-foreground uppercase">
                        {result.type}
                      </span>
                    </span>
                    {result.sublabel && (
                      <span className="text-xs text-muted-foreground">{result.sublabel}</span>
                    )}
                  </button>
                ))
              ) : (
                !searchLoading && (
                  <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                    No results found
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
        
        <ThemeToggle />

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
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground">{unreadCount} new</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="px-3 py-6 text-sm text-center text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                activities.map((activity) => {
                  const Icon = activityIconByType[activity.type] || Clock;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 px-3 py-2.5 border-b last:border-0 hover:bg-muted/40"
                    >
                      <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{activity.time}</p>
                      </div>
                      {activity.isNew && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <span className="sr-only">Open user menu</span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/50">
                <User className="h-5 w-5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
