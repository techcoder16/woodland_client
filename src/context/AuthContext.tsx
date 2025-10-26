import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DEFAULT_COOKIE_DELETE, DEFAULT_COOKIE_GETTER, DEFAULT_COOKIE_SETTER } from "@/helper/Cookie";
import { storeTokens, clearTokens, checkTokenInfo, startTokenValidation, stopTokenValidation } from "@/helper/tokenManager";
import { userPermissionApi, userApi } from "@/helper/simplePermissionApi";
import { User, UserPermission, Role } from "@/types/permissions";
import axios from "axios";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: UserPermission[];
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  checkTokenInfo: () => Promise<boolean>;
  canAccess: (screen: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const tokenValidationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Check if we have a valid access token
        const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
        
        if (accessToken) {
          console.log('Access token found, fetching current user profile from /api/user/me...');
          
          try {
            // Get current user profile from /api/user/me
            const currentUser = await userApi.getCurrentUser();
            console.log('Current user from API:', currentUser);
            console.log('User role from API:', currentUser?.role);
            setUser(currentUser);
            
            // Load user permissions
            await loadUserPermissions();
            
            // Start periodic token validation when user is logged in
            tokenValidationInterval.current = startTokenValidation(0.083); // Check every 5 seconds
          } catch (apiError) {
            console.error('Error fetching user from API:', apiError);
            // Fallback to cookie if API fails
            const savedUser = await DEFAULT_COOKIE_GETTER("user");
            if (savedUser) {
              console.log('Falling back to cookie data...');
              const userData = typeof savedUser === 'string' ? JSON.parse(savedUser) : savedUser;
              setUser(userData);
              await loadUserPermissions();
            }
          }
        } else {
          console.log('No access token found, user not logged in');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    }

    fetchData();
    
    // Cleanup function to stop token validation when component unmounts
    return () => {
      if (tokenValidationInterval.current) {
        stopTokenValidation(tokenValidationInterval.current);
      }
    };
  }, []);

  // Load user permissions
  const loadUserPermissions = async () => {
    try {
      const userPermissions = await userPermissionApi.getMyPermissions();
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error loading user permissions:', error);
      setPermissions([]);
    }
  };

  // Check if user can access a screen
  const canAccess = (screen: string): boolean => {
    if (!user) return false;
    
    if (user.role === Role.Admin) return true; // Admin can access everything
    
    return permissions.some(p => 
      p.screen.route === screen && 
      p.screen.status === 'ACTIVE'
    );
  };

  // Refresh permissions
  const refreshPermissions = async () => {
    await loadUserPermissions();
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${API_URL}auth/login`, { email, password });
      
      if (response.data?.accessToken) {
        console.log('Login response data:', response.data);
        
        // Store tokens using centralized function
        await storeTokens(response.data);
        
        // Get fresh user data from /api/user/me after login
        try {
          const currentUser = await userApi.getCurrentUser();
          console.log('Current user from API after login:', currentUser);
          console.log('User role from API after login:', currentUser?.role);
          setUser(currentUser);
          
          // Store user in cookie as backup
          await DEFAULT_COOKIE_SETTER("user", JSON.stringify(currentUser), false);
        } catch (apiError) {
          console.error('Error fetching user from API after login:', apiError);
          // Fallback to login response user data
          setUser(response.data.user);
          await DEFAULT_COOKIE_SETTER("user", JSON.stringify(response.data.user), false);
        }
        
        // Load user permissions after successful login
        await loadUserPermissions();
        
        // Start periodic token validation after successful login
        tokenValidationInterval.current = startTokenValidation(0.083); // Check every 5 seconds
        
        navigate("/");
        return true;
      }

      toast.error("Invalid credentials");
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = await DEFAULT_COOKIE_GETTER("refresh_token");
      if (!refreshTokenValue) {
        return false;
      }

      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${API_URL}auth/refresh`, {}, {
        headers: {
          Authorization: `Bearer ${refreshTokenValue}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.accessToken) {
        await storeTokens(response.data);
        
        // Get fresh user data after token refresh
        try {
          const currentUser = await userApi.getCurrentUser();
          console.log('Current user from API after token refresh:', currentUser);
          setUser(currentUser);
          await DEFAULT_COOKIE_SETTER("user", JSON.stringify(currentUser), false);
        } catch (apiError) {
          console.error('Error fetching user from API after token refresh:', apiError);
        }
        
        return true;
      }

      // If refresh fails, logout user
      logout();
      return false;
    } catch (error) {
      logout();
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    
    // Stop token validation when logging out
    if (tokenValidationInterval.current) {
      stopTokenValidation(tokenValidationInterval.current);
      tokenValidationInterval.current = null;
    }
    
    clearTokens();
    navigate("/");
  };

  // Handle different role formats from backend
  const userRole = user?.role;
  
  // Check if user is admin - handle both enum and string formats
  const isAdmin = userRole === Role.Admin || 
                  (userRole as string) === 'Admin' || 
                  (userRole as string) === 'admin' || 
                  (userRole as string) === 'ADMIN' ||
                  (user?.email && (
                    user.email.toLowerCase().includes('admin') ||
                    user.email === 'admin@woodland.com' ||
                    user.email === 'admin@example.com'
                  ));
  
  // Debug logging
  console.log('=== AUTH DEBUG ===');
  console.log('AuthContext - user:', user);
  console.log('AuthContext - user.role:', user?.role);
  console.log('AuthContext - userRole variable:', userRole);
  console.log('AuthContext - user.email:', user?.email);
  console.log('AuthContext - Role.Admin:', Role.Admin);
  console.log('AuthContext - isAdmin:', isAdmin);
  console.log('AuthContext - user object keys:', user ? Object.keys(user) : 'No user');
  console.log('Email check for admin:', user?.email && user.email.toLowerCase().includes('admin'));
  console.log('=== END AUTH DEBUG ===');

  try {
    return <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      permissions,
      isAdmin,
      login, 
      logout, 
      refreshToken, 
      checkTokenInfo,
      canAccess,
      refreshPermissions
    }}>{children}</AuthContext.Provider>;
  } catch (error) {
    console.error('AuthProvider error:', error);
    return <div>Authentication Error</div>;
  }
}
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
