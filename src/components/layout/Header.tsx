
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface GlobalSearchResult {
  type: "property" | "vendor";
  id: string;
  label: string;
  sublabel: string;
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchBoxRef = useRef<HTMLDivElement>(null);

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
          label: p.propertyName || "Unnamed property",
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
          <div className="flex items-center gap-2">
               <div className="flex w-20 bg-red-600">
        <img
                className=""
                src={logo}
                >
               
                </img>
          </div>
          </div>
        </div>
      </div>

      <div className="flex-1 mx-8 hidden md:flex">
        <div className="relative w-full max-w-md" ref={searchBoxRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search properties, vendors..."
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
