import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DEFAULT_COOKIE_DELETE, DEFAULT_COOKIE_GETTER, DEFAULT_COOKIE_SETTER } from "@/helper/Cookie";
import postApi from "@/helper/postApi";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() =>  {
    async function fetchData ()
    {
    const savedUser =await DEFAULT_COOKIE_GETTER("user");

    if (savedUser) {
      setUser(typeof savedUser == 'object' ? JSON.parse(savedUser):savedUser);
    }
    setIsLoading(false);

  }

  fetchData();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const { data, error } = await postApi("auth/getLogin", { email, password });

    if (data?.accessToken) {
      setUser(data.user);
      await DEFAULT_COOKIE_SETTER("access_token", data.accessToken, false);
      console.log(data.user);
      await DEFAULT_COOKIE_SETTER("user", JSON.stringify(data.user), false);
      navigate("/");
      return true;
    }

    toast.error(error?.message || "Invalid credentials");
    return false;
  };

  const logout = () => {
    setUser(null);
    DEFAULT_COOKIE_DELETE("access_token");
    DEFAULT_COOKIE_DELETE("user");
    navigate("/");
  };

  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
