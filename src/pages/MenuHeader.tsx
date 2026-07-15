import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Search, ChevronDown, LogOut } from 'lucide-react';
import { DEFAULT_COOKIE_DELETE, DEFAULT_COOKIE_GETTER } from "../helper/Cookie";
import { PageContext } from "../utils/contexts";
import logo from "../assets/logo.png";
import dashboardIcon from '../assets/dashboard.svg';
import landlordIcon from '../assets/landlord_vendorActive.svg';
import propertyIcon from '../assets/property-icon.svg';

interface MenuItem {
  id: number;
  label: string;
  icon: string;
}

const MenuHeader: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const { pages, setPages } = useContext<any>(PageContext);

  const menuItems: MenuItem[] = [
    { id: 1, label: 'Dashboard', icon: dashboardIcon },
    { id: 2, label: 'Tenant', icon: landlordIcon },
    { id: 3, label: 'Properties', icon: landlordIcon },
  ];

  const toggleTheme = (): void => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const toggleMenu = (id: number, index: number): void => {
    setActiveId(activeId === id ? null : id);
    setPages((index + 1).toString());
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await DEFAULT_COOKIE_GETTER('user');
        const parsedUser = JSON.parse(user || "{}");
        setUserName(parsedUser.name || '');
        setEmail(parsedUser.email || '');
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async (): Promise<void> => {
    await DEFAULT_COOKIE_DELETE("access_token");
    await DEFAULT_COOKIE_DELETE("user");
    localStorage.removeItem("user_data");
    navigate("/");
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`flex flex-col ${isDark ? 'dark' : ''}`}>
      <nav className="bg-card border-b border-border transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex-shrink-0">
                <img className="h-8 w-auto" src={logo} alt="Logo" />
              </Link>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 rounded-lg border border-border
                           bg-secondary text-foreground dark:text-white
                           focus:ring-2 focus:ring-primary transition-colors duration-200"
                />
                <Search className="absolute left-3 top-2.5 text-muted-foreground h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-secondary transition-colors duration-200"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary
                           transition-colors duration-200"
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${
                    userName ? 'bg-gradient-to-r from-primary to-purple-500' : 'bg-muted-foreground'
                  }`}>
                    {userName ? getInitials(userName) : 'U'}
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg bg-card shadow-lg
                                border border-border transition-colors duration-200">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white
                                      bg-gradient-to-r from-primary to-purple-500`}>
                          {userName ? getInitials(userName) : 'U'}
                        </div>
                        <div>
                          <div className="font-medium dark:text-white">{userName}</div>
                          <div className="text-sm text-muted-foreground">{email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-destructive hover:bg-accent
                                 rounded-md transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-[#443F5F] dark:bg-gray-900 p-2 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleMenu(item.id, item.id - 1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                         ${activeId === item.id
                           ? 'bg-white/10 text-white'
                           : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
            >
              <img src={item.icon} alt={item.label} className="h-8 w-8" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuHeader;
