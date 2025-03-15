import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Search, LogOut, Menu, Home, Users, Building2, Settings, Sun, Moon, Cookie,FolderKanban } from "lucide-react";
import { Input } from "./ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { DEFAULT_COOKIE_DELETE } from "@/helper/Cookie";

const fontFamilies = [
  { label: "Montserrat", value: "font-montserrat" },
  { label: "Lucida Sans", value: "font-lucida" },
  { label: "Roboto", value: "font-roboto" },
  { label: "Open Sans", value: "font-open-sans" },
  { label: "Arial", value: "font-arial" },
  { label: "Helvetica", value: "font-helvetica" },
  { label: "Georgia", value: "font-georgia" },
  { label: "Times New Roman", value: "font-times-new-roman" },
  { label: "Courier New", value: "font-courier-new" },
  { label: "Poppins", value: "font-poppins" },
  { label: "Lato", value: "font-lato" },
  
];

const themeColors = [
  { label: "Blue", value: "blue" },
  { label: "Green", value: "green" },
  { label: "Purple", value: "purple" },
];

export function MainNav() {
  const location = useLocation();
  const initialFontFamily = localStorage.getItem("fontFamily") || "font-montserrat";
  const initialThemeColor = localStorage.getItem("themeColor") || "blue";

  

  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [themeColor, setThemeColor] = useState(initialThemeColor);
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    // Apply persisted font family and theme color on initial render
    document.body.className = `${fontFamily} ${themeColor}`;
  }, [fontFamily, themeColor]);

  

  const handleLogout = () => {
    console.log("Logging out...");
    DEFAULT_COOKIE_DELETE("access_token");
    

    navigate("/login");
  };

  const handleFontChange = (value: string) => {
    setFontFamily(value);
    document.body.className = value;
    localStorage.setItem("fontFamily", value); // Persist font family
  };

  const handleThemeColorChange = (value: string) => {
    setThemeColor(value);
    // Add logic to change theme colors
    document.body.className = value;
    localStorage.setItem("themeColor", value); // Persist theme color
  };
  
  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link to="/" className="font-bold text-2xl flex items-center mr-4">
            <img src="/placeholder.svg" alt="Logo" className="h-8 w-8 mr-2" />
          </Link>

          <div className="flex-1 px-2 md:px-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8 w-full" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Font Family</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={fontFamily} onValueChange={handleFontChange}>
                      {fontFamilies.map((font) => (
                        <DropdownMenuRadioItem key={font.value} value={font.value}>
                          {font.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Theme Color</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={themeColor} onValueChange={handleThemeColorChange}>
                      {themeColors.map((color) => (
                        <DropdownMenuRadioItem key={color.value} value={color.value}>
                          {color.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                  {theme === "light" ? (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light Mode</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <LogOut className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            className="md:hidden"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className={cn(
            "flex flex-col md:flex-row md:items-center md:space-x-4 w-full",
            isMobileMenuOpen ? "absolute top-[7.5rem] left-0 bg-background border-b p-4 space-y-2 md:space-y-0 md:relative md:top-0 md:border-none" : "hidden md:flex"
          )}>
            <nav className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center",
                  location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/vendors"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center",
                  location.pathname === "/vendors" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                Landlords/Vendors
              </Link>
              <Link
                to="/properties"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center",
                  location.pathname === "/properties" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Properties
              </Link>


              <Link
                to="/property/manager"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center",
                  location.pathname === "/property-management" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <FolderKanban className="mr-2 h-4 w-4" />
                Property Management
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}