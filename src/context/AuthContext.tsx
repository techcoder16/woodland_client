import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DEFAULT_COOKIE_DELETE, DEFAULT_COOKIE_GETTER, DEFAULT_COOKIE_SETTER } from "@/helper/Cookie";
import { storeTokens, clearTokens, checkTokenInfo, startTokenValidation, stopTokenValidation } from "@/helper/tokenManager";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  checkTokenInfo: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const tokenValidationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const savedUser = await DEFAULT_COOKIE_GETTER("user");

        if (savedUser) {
          setUser(typeof savedUser == 'object' ? JSON.parse(savedUser) : savedUser);
          
          // Start periodic token validation when user is logged in
          // Check every 5 seconds since refresh token expires in 10 seconds
          tokenValidationInterval.current = startTokenValidation(0.083); // Check every 5 seconds
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${API_URL}auth/login`, { email, password });
      
      if (response.data?.accessToken) {
        setUser(response.data.user);
        
        // Store tokens using centralized function
        await storeTokens(response.data);
        
        console.log(response.data.user);
        await DEFAULT_COOKIE_SETTER("user", JSON.stringify(response.data.user), false);
        
        // Start periodic token validation after successful login
        // Check every 5 seconds since refresh token expires in 10 seconds
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
    
    // Stop token validation when logging out
    if (tokenValidationInterval.current) {
      stopTokenValidation(tokenValidationInterval.current);
      tokenValidationInterval.current = null;
    }
    
    clearTokens();
    navigate("/");
  };

  try {
    return <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshToken, checkTokenInfo }}>{children}</AuthContext.Provider>;
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
